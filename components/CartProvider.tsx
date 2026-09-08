"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { EMPTY_CART, type CartView } from "@/lib/cart/types";
import {
  addToCartAction,
  getCartAction,
  removeFromCartAction,
  setCartQtyAction,
} from "@/lib/cart/actions";

type CartContextValue = {
  cart: CartView;
  count: number;
  /** false until the first server read lands — lets the badge avoid flashing */
  ready: boolean;
  pending: boolean;
  add: (productId: string, qty?: number) => Promise<void>;
  setQty: (productId: string, qty: number) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

export default function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartView>(EMPTY_CART);
  const [ready, setReady] = useState(false);
  const [inFlight, setInFlight] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const mounted = useRef(true);

  /* The cart lives on the server (cookie → cart row), so the first paint is
     empty and we reconcile straight after mount. That keeps every product and
     journal page statically renderable. */
  useEffect(() => {
    mounted.current = true;
    getCartAction()
      .then((view) => {
        if (mounted.current) setCart(view);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted.current) setReady(true);
      });
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async (work: () => Promise<CartView>) => {
    setInFlight((n) => n + 1);
    try {
      const view = await work();
      if (mounted.current) setCart(view);
    } catch (error) {
      console.error("[cart] update failed", error);
    } finally {
      if (mounted.current) setInFlight((n) => Math.max(0, n - 1));
    }
  }, []);

  const add = useCallback(
    async (productId: string, qty = 1) => {
      setIsOpen(true);
      await run(() => addToCartAction(productId, qty));
    },
    [run],
  );

  const setQty = useCallback(
    async (productId: string, qty: number) => {
      await run(() => setCartQtyAction(productId, qty));
    },
    [run],
  );

  const remove = useCallback(
    async (productId: string) => {
      await run(() => removeFromCartAction(productId));
    },
    [run],
  );

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  /* close on Escape, and stop the page scrolling behind the drawer */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  const value = useMemo(
    () => ({
      cart,
      count: cart.count,
      ready,
      pending: inFlight > 0,
      add,
      setQty,
      remove,
      isOpen,
      openCart,
      closeCart,
    }),
    [cart, ready, inFlight, add, setQty, remove, isOpen, openCart, closeCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

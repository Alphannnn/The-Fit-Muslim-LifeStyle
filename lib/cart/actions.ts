"use server";

import {
  addToCart,
  readCart,
  removeFromCart,
  setCartQty,
  type CartView,
} from "@/lib/cart/server";

/* Thin server-action wrappers around the cart module. Each returns the fresh
   server-side view, so the client never computes a price it then has to trust. */

export async function getCartAction(): Promise<CartView> {
  return readCart();
}

export async function addToCartAction(productId: string, qty = 1): Promise<CartView> {
  return addToCart(productId, Math.max(1, Math.min(99, Math.trunc(qty) || 1)));
}

export async function setCartQtyAction(productId: string, qty: number): Promise<CartView> {
  return setCartQty(productId, Math.min(99, Math.trunc(qty) || 0));
}

export async function removeFromCartAction(productId: string): Promise<CartView> {
  return removeFromCart(productId);
}

import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { cartItems, carts, products } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { newId } from "@/lib/ids";
import { CURRENCY, totalsFor } from "@/lib/money";
import { EMPTY_CART, type CartLine, type CartView } from "./types";

export const CART_COOKIE = "tfm_cart";
const CART_TTL_DAYS = 60;
const MAX_QTY = 99;

export { EMPTY_CART };
export type { CartLine, CartView };

/**
 * The cart as the server sees it. Prices and stock are read from the
 * products table on every call — the client only ever tells us *what* is in
 * the cart, never what it costs.
 */
export async function readCart(): Promise<CartView> {
  const jar = await cookies();
  const cartId = jar.get(CART_COOKIE)?.value;
  if (!cartId) return EMPTY_CART;
  return loadCart(cartId);
}

export async function loadCart(cartId: string): Promise<CartView> {
  const db = await getDb();
  const rows = await db
    .select({ item: cartItems, product: products })
    .from(cartItems)
    .innerJoin(products, eq(products.id, cartItems.productId))
    .where(and(eq(cartItems.cartId, cartId), eq(products.active, true)));

  const lines: CartLine[] = rows.map(({ item, product }) => {
    /* never let a stale cart row exceed what we can actually ship */
    const qty =
      product.stock === null ? item.qty : Math.max(0, Math.min(item.qty, product.stock));
    return {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      subtitle: product.subtitle,
      image: product.image,
      kind: product.kind,
      unitPriceCents: product.priceCents,
      compareAtCents: product.compareAtCents,
      qty,
      lineTotalCents: product.priceCents * qty,
      stock: product.stock,
      downloadPath: product.downloadPath,
    };
  });

  const live = lines.filter((l) => l.qty > 0);
  const hasPhysical = live.some((l) => l.kind === "physical");

  return {
    id: cartId,
    lines: live,
    count: live.reduce((n, l) => n + l.qty, 0),
    currency: rows[0]?.product.currency ?? CURRENCY,
    hasPhysical,
    totals: totalsFor(live, hasPhysical),
  };
}

/** Mutations only — this sets a cookie, so it must run in an action or route. */
export async function getOrCreateCartId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(CART_COOKIE)?.value;
  const db = await getDb();

  if (existing) {
    const found = await db.select({ id: carts.id }).from(carts).where(eq(carts.id, existing)).limit(1);
    if (found.length) return existing;
  }

  const user = await getCurrentUser();
  const id = newId();
  await db.insert(carts).values({ id, userId: user?.id ?? null });

  jar.set(CART_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CART_TTL_DAYS * 24 * 60 * 60,
  });

  return id;
}

async function touch(cartId: string): Promise<void> {
  const db = await getDb();
  await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cartId));
}

/** Clamp against real stock so the cart can't promise what isn't there. */
async function allowedQty(productId: string, wanted: number): Promise<number> {
  const db = await getDb();
  const rows = await db
    .select({ stock: products.stock })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.active, true)))
    .limit(1);

  if (rows.length === 0) return 0; // unknown or inactive product
  const stock = rows[0].stock;
  const ceiling = stock === null ? MAX_QTY : Math.min(MAX_QTY, stock);
  return Math.max(0, Math.min(wanted, ceiling));
}

export async function addToCart(productId: string, qty = 1): Promise<CartView> {
  const cartId = await getOrCreateCartId();
  const db = await getDb();

  const existing = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)))
    .limit(1);

  const target = await allowedQty(productId, (existing[0]?.qty ?? 0) + Math.max(1, qty));
  if (target === 0) return loadCart(cartId);

  if (existing.length) {
    await db
      .update(cartItems)
      .set({ qty: target })
      .where(eq(cartItems.id, existing[0].id));
  } else {
    await db.insert(cartItems).values({
      id: newId(),
      cartId,
      productId,
      qty: target,
    });
  }

  await touch(cartId);
  return loadCart(cartId);
}

export async function setCartQty(productId: string, qty: number): Promise<CartView> {
  const cartId = await getOrCreateCartId();
  const db = await getDb();

  if (qty <= 0) {
    await db
      .delete(cartItems)
      .where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)));
  } else {
    const target = await allowedQty(productId, qty);
    if (target === 0) {
      await db
        .delete(cartItems)
        .where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)));
    } else {
      await db
        .update(cartItems)
        .set({ qty: target })
        .where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)));
    }
  }

  await touch(cartId);
  return loadCart(cartId);
}

export async function removeFromCart(productId: string): Promise<CartView> {
  return setCartQty(productId, 0);
}

export async function clearCart(cartId: string): Promise<void> {
  const db = await getDb();
  await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
  await touch(cartId);
}

/** After signing in, attach the visitor's anonymous cart to their account. */
export async function claimCartForUser(userId: string): Promise<void> {
  const jar = await cookies();
  const cartId = jar.get(CART_COOKIE)?.value;
  if (!cartId) return;
  const db = await getDb();
  await db.update(carts).set({ userId }).where(eq(carts.id, cartId));
}

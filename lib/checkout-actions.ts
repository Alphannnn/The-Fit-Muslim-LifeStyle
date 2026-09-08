"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { CART_COOKIE } from "@/lib/cart/server";
import { markOrderPaid } from "@/lib/orders";
import { stripeEnabled } from "@/lib/stripe";

/**
 * Settles an order without a payment provider, so the whole purchase flow can
 * be walked in development. Refuses to run the moment Stripe keys exist.
 */
export async function settleSimulatedOrderAction(orderId: string) {
  if (stripeEnabled()) {
    throw new Error("Simulated settlement is disabled — Stripe is configured.");
  }

  const jar = await cookies();
  await markOrderPaid({ orderId, cartId: jar.get(CART_COOKIE)?.value ?? null });

  redirect(`/orders/${orderId}`);
}

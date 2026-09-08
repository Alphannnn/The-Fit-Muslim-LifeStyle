import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { markOrderPaid, setOrderStatus } from "@/lib/orders";
import { stripeClient } from "@/lib/stripe";

/* Stripe needs the raw body to verify the signature, so nothing may parse it
   before we do. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function addressFrom(details: Stripe.Address | null | undefined) {
  if (!details) return null;
  return {
    line1: details.line1 ?? undefined,
    line2: details.line2 ?? undefined,
    city: details.city ?? undefined,
    postalCode: details.postal_code ?? undefined,
    country: details.country ?? undefined,
  };
}

export async function POST(request: Request) {
  const stripe = stripeClient();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !secret) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    /* An unverifiable payload is either misconfiguration or an attack — either
       way it must never reach the order logic. */
    console.error("[stripe] signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const orderId = session.metadata?.orderId ?? session.client_reference_id;
        if (!orderId) break;

        /* markOrderPaid is idempotent, so a retry (or the success page having
           already reconciled) is harmless. */
        await markOrderPaid({
          orderId,
          paymentIntentId:
            typeof session.payment_intent === "string" ? session.payment_intent : null,
          address:
            addressFrom(session.collected_information?.shipping_details?.address) ??
            addressFrom(session.customer_details?.address),
          cartId: session.metadata?.cartId || null,
        });

        if (session.mode === "subscription" && session.subscription) {
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          const userId = session.metadata?.userId;
          const amount = session.amount_total ?? 0;

          if (userId) {
            await db
              .insert(subscriptions)
              .values({
                userId,
                interval: "month",
                status: "active",
                priceCents: amount,
                stripeSubscriptionId: subscriptionId,
                stripeCustomerId:
                  typeof session.customer === "string" ? session.customer : null,
              })
              .onConflictDoNothing();
          }
        }
        break;
      }

      case "checkout.session.expired": {
        const orderId = event.data.object.metadata?.orderId;
        if (orderId) await setOrderStatus(orderId, "cancelled");
        break;
      }

      case "charge.refunded": {
        const orderId = event.data.object.metadata?.orderId;
        if (orderId) await setOrderStatus(orderId, "refunded");
        break;
      }

      default:
        /* Everything else is acknowledged and ignored on purpose. */
        break;
    }
  } catch (error) {
    /* Returning 500 makes Stripe retry, which is what we want for a transient
       database failure. */
    console.error(`[stripe] handler for ${event.type} failed`, error);
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { readCart } from "@/lib/cart/server";
import { attachStripeSession, createPendingOrder } from "@/lib/orders";
import { siteUrl, stripeClient, stripeEnabled } from "@/lib/stripe";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  name: z.string().trim().min(2).max(80),
  address: z
    .object({
      line1: z.string().trim().max(120).optional(),
      line2: z.string().trim().max(120).optional(),
      city: z.string().trim().max(80).optional(),
      postalCode: z.string().trim().max(24).optional(),
      country: z.string().trim().max(60).optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your details and try again." }, { status: 400 });
  }

  /* The cart is re-read from the database here. Whatever the browser thinks
     things cost is irrelevant — every price and every total below comes from
     the products table. */
  const cart = await readCart();
  if (cart.lines.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  /* Stripe cannot mix one-off and recurring items in a single session. */
  const subscriptionLines = cart.lines.filter((l) => l.kind === "subscription");
  if (subscriptionLines.length > 0 && subscriptionLines.length !== cart.lines.length) {
    return NextResponse.json(
      {
        error:
          "Your plan subscription needs its own checkout — please order it separately from the physical items.",
      },
      { status: 400 },
    );
  }

  const user = await getCurrentUser();
  const order = await createPendingOrder({
    cart,
    email: parsed.data.email,
    userId: user?.id ?? null,
  });

  await db
    .update(orders)
    .set({ shippingName: parsed.data.name, shippingAddress: parsed.data.address ?? null })
    .where(eq(orders.id, order.id));

  const stripe = stripeClient();
  if (!stripe || !stripeEnabled()) {
    /* No payment provider configured: hand back our own settlement page so the
       whole flow stays walkable in development. It is clearly labelled and
       refuses to run once Stripe keys exist. */
    return NextResponse.json({ url: `/checkout/confirm/${order.id}`, simulated: true });
  }

  const isSubscription = subscriptionLines.length > 0;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? "subscription" : "payment",
      customer_email: parsed.data.email,
      client_reference_id: order.id,
      metadata: { orderId: order.id, cartId: cart.id ?? "" },
      ...(isSubscription
        ? { subscription_data: { metadata: { orderId: order.id, userId: user?.id ?? "" } } }
        : { payment_intent_data: { metadata: { orderId: order.id } } }),
      line_items: [
        ...order.items.map((item) => ({
          quantity: item.qty,
          price_data: {
            currency: order.currency.toLowerCase(),
            unit_amount: item.unitPriceCents,
            ...(isSubscription ? { recurring: { interval: "month" as const } } : {}),
            product_data: {
              name: `${item.name} ${item.subtitle}`.trim(),
              ...(item.image.startsWith("http") ? { images: [item.image] } : {}),
            },
          },
        })),
        ...(order.shippingCents > 0
          ? [
              {
                quantity: 1,
                price_data: {
                  currency: order.currency.toLowerCase(),
                  unit_amount: order.shippingCents,
                  product_data: { name: "Delivery" },
                },
              },
            ]
          : []),
      ],
      success_url: `${siteUrl()}/orders/${order.id}?session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl()}/checkout?cancelled=1`,
    });

    await attachStripeSession(order.id, session.id);

    if (!session.url) throw new Error("Stripe returned a session without a URL");
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[checkout] stripe session failed", error);
    return NextResponse.json(
      { error: "We couldn't reach the payment provider. Please try again." },
      { status: 502 },
    );
  }
}

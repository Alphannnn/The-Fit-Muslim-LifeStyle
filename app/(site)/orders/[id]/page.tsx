import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder, markOrderPaid } from "@/lib/orders";
import { formatMoneyExact } from "@/lib/money";
import { stripeClient } from "@/lib/stripe";
import type { OrderStatus } from "@/lib/db/schema";

export const metadata: Metadata = {
  title: "Your order",
  robots: { index: false, follow: false },
};

const STEPS: { status: OrderStatus; label: string; note: string }[] = [
  { status: "paid", label: "Paid", note: "Payment confirmed" },
  { status: "fulfilled", label: "Sent", note: "Handed to the carrier" },
];

const STATUS_COPY: Record<OrderStatus, { title: string; body: string; tone: string }> = {
  pending: {
    title: "Awaiting payment",
    body: "We haven't received payment for this order yet. If you've just paid, give it a moment and refresh.",
    tone: "border-gold/45 bg-gold/6 text-gold-deep",
  },
  paid: {
    title: "Jazāk Allāhu khayran — your order is confirmed",
    body: "We've emailed your receipt. Physical items are packed and sent within 2–3 working days.",
    tone: "border-green-500/40 bg-green-800/6 text-green-800",
  },
  fulfilled: {
    title: "On its way",
    body: "Your order has left us. Delivery usually takes 2–5 working days from dispatch.",
    tone: "border-green-500/40 bg-green-800/6 text-green-800",
  },
  cancelled: {
    title: "Order cancelled",
    body: "This order was cancelled and nothing has been charged.",
    tone: "border-linen bg-sand text-ink-soft",
  },
  refunded: {
    title: "Refunded",
    body: "This order has been refunded. Allow 5–10 working days for it to reach your account.",
    tone: "border-linen bg-sand text-ink-soft",
  },
};

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session?: string }>;
}) {
  const [{ id }, { session }] = await Promise.all([params, searchParams]);

  let order = await getOrder(id);
  if (!order) notFound();

  /* The webhook is the source of truth, but it can land after the customer is
     redirected back. Reconcile here too — markOrderPaid is idempotent, so
     whichever arrives first wins and the other is a no-op. */
  if (order.status === "pending" && session) {
    const stripe = stripeClient();
    if (stripe) {
      try {
        const checkout = await stripe.checkout.sessions.retrieve(session);
        if (
          checkout.payment_status === "paid" &&
          (checkout.metadata?.orderId ?? checkout.client_reference_id) === order.id
        ) {
          await markOrderPaid({
            orderId: order.id,
            paymentIntentId:
              typeof checkout.payment_intent === "string" ? checkout.payment_intent : null,
            cartId: checkout.metadata?.cartId || null,
          });
          order = (await getOrder(id)) ?? order;
        }
      } catch (error) {
        console.error("[orders] could not reconcile with stripe", error);
      }
    }
  }

  const copy = STATUS_COPY[order.status];
  const settled = order.status === "paid" || order.status === "fulfilled";
  const downloads = settled
    ? order.items.filter((i) => i.kind === "digital" && i.downloadPath)
    : [];

  const reachedIndex = order.status === "fulfilled" ? 1 : order.status === "paid" ? 0 : -1;

  return (
    <div className="px-6 pt-32 pb-24 md:pt-40">
      <div className="mx-auto max-w-2xl">
        <header className="text-center">
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.32em] text-gold-deep">
            Order {order.orderNumber}
          </p>
          <h1 className="mt-4 font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
            {copy.title}
          </h1>
          <p className="mx-auto mt-4 max-w-md font-serif text-lg leading-relaxed text-ink-soft">
            {copy.body}
          </p>
        </header>

        {/* progress */}
        {order.status !== "cancelled" && order.status !== "refunded" && (
          <ol className="mt-10 flex items-center justify-center gap-3">
            {STEPS.map((step, i) => {
              const done = i <= reachedIndex;
              return (
                <li key={step.status} className="flex items-center gap-3">
                  <span
                    className={`flex items-center gap-2 rounded-full border px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] ${
                      done
                        ? "border-green-500/45 bg-green-800/8 text-green-800"
                        : "border-linen bg-sand text-ink-muted"
                    }`}
                  >
                    {done && (
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {step.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span
                      className={`h-px w-8 ${i < reachedIndex ? "bg-green-500/50" : "bg-linen"}`}
                      aria-hidden
                    />
                  )}
                </li>
              );
            })}
          </ol>
        )}

        {order.status === "pending" && (
          <div className={`mt-8 rounded-lg border px-5 py-4 text-sm ${copy.tone}`}>
            Payment outstanding. Nothing has been charged and no stock has been reserved.
          </div>
        )}

        {/* downloads unlock immediately */}
        {downloads.length > 0 && (
          <section className="mt-10 rounded-lg border border-green-500/35 bg-green-800/5 p-6">
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-green-800">
              Ready to download
            </h2>
            <ul className="mt-4 space-y-2.5">
              {downloads.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.downloadPath!}
                    download
                    className="flex items-center justify-between gap-4 rounded-sm border border-linen bg-ivory px-4 py-3 transition-colors hover:border-gold"
                  >
                    <span className="font-serif text-base text-ink">
                      {item.name} — {item.subtitle}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-green-700">
                      Download
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* items */}
        <section className="mt-10 overflow-hidden rounded-lg border border-linen bg-shell">
          <ul className="divide-y divide-linen">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 px-5 py-4">
                <div className="grid h-20 w-16 shrink-0 place-items-center overflow-hidden rounded-sm border border-linen bg-sand">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt="" className="h-full w-full object-contain p-1.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-base text-ink">{item.name}</p>
                  <p className="text-[0.6rem] font-medium uppercase tracking-[0.18em] text-ink-muted">
                    {item.subtitle} · Qty {item.qty}
                  </p>
                </div>
                <span className="font-display text-sm font-semibold text-ink">
                  {formatMoneyExact(item.unitPriceCents * item.qty, order.currency)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="space-y-2 border-t border-linen bg-sand px-5 py-4 text-[0.82rem]">
            <div className="flex justify-between">
              <dt className="text-ink-muted">Subtotal</dt>
              <dd className="text-ink">
                {formatMoneyExact(order.subtotalCents, order.currency)}
              </dd>
            </div>
            {order.shippingCents > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-muted">Delivery</dt>
                <dd className="text-ink">
                  {formatMoneyExact(order.shippingCents, order.currency)}
                </dd>
              </div>
            )}
            {order.taxCents > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-muted">Tax</dt>
                <dd className="text-ink">{formatMoneyExact(order.taxCents, order.currency)}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between border-t border-linen pt-2.5">
              <dt className="text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-ink-muted">
                Total
              </dt>
              <dd className="font-display text-xl font-semibold text-ink">
                {formatMoneyExact(order.totalCents, order.currency)}
              </dd>
            </div>
          </dl>
        </section>

        {/* delivery details */}
        {order.shippingAddress && (
          <section className="mt-6 rounded-lg border border-linen bg-shell p-5">
            <h2 className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-ink-muted">
              Delivering to
            </h2>
            <address className="mt-2 not-italic font-serif text-base leading-relaxed text-ink-soft">
              {order.shippingName && (
                <>
                  <span className="text-ink">{order.shippingName}</span>
                  <br />
                </>
              )}
              {[
                order.shippingAddress.line1,
                order.shippingAddress.line2,
                order.shippingAddress.city,
                order.shippingAddress.postalCode,
                order.shippingAddress.country,
              ]
                .filter(Boolean)
                .join(", ")}
            </address>
            {order.trackingNumber && (
              <p className="mt-3 text-[0.8rem] text-ink-soft">
                Tracking:{" "}
                <span className="font-mono text-ink">{order.trackingNumber}</span>
              </p>
            )}
          </section>
        )}

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/account/orders"
            className="rounded-sm bg-green-800 px-7 py-3.5 text-center text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ivory transition-colors hover:bg-green-900"
          >
            All Your Orders
          </Link>
          <Link
            href="/shop"
            className="rounded-sm border border-gold/55 px-7 py-3.5 text-center text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-gold-deep transition-colors hover:bg-gold/10"
          >
            Continue Shopping
          </Link>
        </div>

        <p className="mt-8 text-center text-[0.74rem] text-ink-muted">
          Keep this link — it&apos;s the receipt for order {order.orderNumber}.
        </p>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { settleSimulatedOrderAction } from "@/lib/checkout-actions";
import { getOrder } from "@/lib/orders";
import { formatMoneyExact } from "@/lib/money";
import { stripeEnabled } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Confirm your order",
  robots: { index: false, follow: false },
};

/**
 * Test settlement. Exists so the purchase flow — order, stock, email,
 * downloads, account history — is walkable before Stripe keys are added.
 * Once they are, this page redirects rather than allowing a free order.
 */
export default async function ConfirmPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  if (stripeEnabled()) redirect("/checkout");

  const order = await getOrder(orderId);
  if (!order) notFound();
  if (order.status !== "pending") redirect(`/orders/${order.id}`);

  const settle = settleSimulatedOrderAction.bind(null, order.id);

  return (
    <div className="px-6 pt-32 pb-24 md:pt-40">
      <div className="mx-auto max-w-lg">
        <div className="rounded-lg border border-gold/45 bg-gold/6 px-5 py-4">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-gold-deep">
            Test mode
          </p>
          <p className="mt-1.5 text-[0.85rem] leading-relaxed text-ink-soft">
            No payment provider is connected, so no card is taken. Confirming below
            settles the order exactly as a real payment would — stock is reduced,
            the receipt is written, and downloads unlock.
          </p>
        </div>

        <header className="mt-8 text-center">
          <h1 className="font-display text-3xl font-semibold text-ink">
            Confirm order {order.orderNumber}
          </h1>
          <p className="mt-3 font-serif text-lg text-ink-soft">
            {order.items.length} {order.items.length === 1 ? "item" : "items"} ·{" "}
            {formatMoneyExact(order.totalCents, order.currency)}
          </p>
        </header>

        <ul className="mt-8 divide-y divide-linen rounded-lg border border-linen bg-shell">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
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

        <form action={settle} className="mt-8">
          <button
            type="submit"
            className="w-full cursor-pointer rounded-sm bg-green-800 px-8 py-4 text-[0.74rem] font-semibold uppercase tracking-[0.2em] text-ivory transition-all hover:-translate-y-0.5 hover:bg-green-900"
          >
            Settle Order (Test)
          </button>
        </form>

        <p className="mt-4 text-center text-[0.75rem] text-ink-muted">
          <Link href="/checkout" className="underline decoration-gold/50 hover:text-green-800">
            Back to checkout
          </Link>
        </p>
      </div>
    </div>
  );
}

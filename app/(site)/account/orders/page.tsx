import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { listOrdersForUser } from "@/lib/orders";
import { formatMoneyExact } from "@/lib/money";
import type { OrderStatus } from "@/lib/db/schema";

export const metadata: Metadata = {
  title: "Your Orders",
  robots: { index: false, follow: false },
};

const BADGE: Record<OrderStatus, string> = {
  pending: "border-gold/45 bg-gold/8 text-gold-deep",
  paid: "border-green-500/40 bg-green-800/8 text-green-700",
  fulfilled: "border-green-500/40 bg-green-800/8 text-green-700",
  cancelled: "border-linen bg-sand text-ink-muted",
  refunded: "border-linen bg-sand text-ink-muted",
};

export default async function AccountOrdersPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const orders = await listOrdersForUser(user.id);

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-linen bg-sand p-8 text-center">
        <p className="font-serif text-lg text-ink">No orders yet</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
          When you order, everything appears here — receipts, tracking, and any
          digital downloads.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-sm bg-green-800 px-7 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-ivory transition-colors hover:bg-green-900"
        >
          Browse the Store
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-semibold text-ink">
        {orders.length} {orders.length === 1 ? "order" : "orders"}
      </h2>

      <ul className="space-y-4">
        {orders.map((order) => (
          <li key={order.id} className="overflow-hidden rounded-lg border border-linen bg-shell">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-linen bg-sand px-5 py-3.5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-[0.82rem] font-semibold text-ink">
                  {order.orderNumber}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.14em] ${BADGE[order.status]}`}
                >
                  {order.status}
                </span>
                <span className="text-[0.7rem] text-ink-muted">
                  {order.createdAt.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <Link
                href={`/orders/${order.id}`}
                className="text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-green-700 transition-colors hover:text-green-900"
              >
                View receipt →
              </Link>
            </div>

            <ul className="divide-y divide-linen">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="grid h-16 w-14 shrink-0 place-items-center overflow-hidden rounded-sm border border-linen bg-sand">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt="" className="h-full w-full object-contain p-1" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-[0.98rem] text-ink">{item.name}</p>
                    <p className="text-[0.6rem] font-medium uppercase tracking-[0.16em] text-ink-muted">
                      {item.subtitle} · Qty {item.qty}
                    </p>
                  </div>
                  <span className="text-[0.82rem] font-semibold text-ink">
                    {formatMoneyExact(item.unitPriceCents * item.qty, order.currency)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex items-baseline justify-between border-t border-linen px-5 py-3.5">
              <span className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-ink-muted">
                Total
              </span>
              <span className="font-display text-lg font-semibold text-ink">
                {formatMoneyExact(order.totalCents, order.currency)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

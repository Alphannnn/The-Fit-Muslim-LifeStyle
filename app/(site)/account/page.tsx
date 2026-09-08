import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getActivePlan, getProgressSummary, getSubscription } from "@/lib/account";
import { listOrdersForUser, purchasedDownloads } from "@/lib/orders";
import { formatMoneyExact } from "@/lib/money";

export const metadata: Metadata = {
  title: "Account Overview",
  robots: { index: false, follow: false },
};

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-lg border border-linen bg-shell p-5">
      <p className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-ink-muted">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl font-semibold text-ink">{value}</p>
      {note && <p className="mt-1 text-[0.74rem] text-ink-muted">{note}</p>}
    </div>
  );
}

export default async function AccountOverview() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [plan, progress, orders, downloads, subscription] = await Promise.all([
    getActivePlan(user.id),
    getProgressSummary(user.id),
    listOrdersForUser(user.id),
    purchasedDownloads(user.id),
    getSubscription(user.id),
  ]);

  const settled = orders.filter((o) => o.status === "paid" || o.status === "fulfilled");

  return (
    <div className="space-y-8">
      {/* the plan is the centre of the account */}
      <section className="overflow-hidden rounded-xl border border-linen bg-sand">
        <div className="border-b border-linen px-6 py-5">
          <p className="text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-gold-deep">
            Your Plan
          </p>
        </div>

        {plan ? (
          <div className="px-6 py-6">
            <h2 className="font-display text-2xl font-semibold text-ink">{plan.title}</h2>
            <p className="mt-2 max-w-xl font-serif text-base leading-relaxed text-ink-soft">
              {plan.summary}
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { k: "Calories", v: `${plan.targetCalories}` },
                { k: "Protein", v: `${plan.proteinGrams}g` },
                { k: "Carbs", v: `${plan.carbGrams}g` },
                { k: "Fat", v: `${plan.fatGrams}g` },
              ].map((m) => (
                <div key={m.k}>
                  <dt className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-ink-muted">
                    {m.k}
                  </dt>
                  <dd className="mt-1 font-display text-xl font-semibold text-green-800">{m.v}</dd>
                </div>
              ))}
            </dl>

            <Link
              href={`/account/plans/${plan.id}`}
              className="mt-6 inline-block rounded-sm bg-green-800 px-7 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-ivory transition-colors hover:bg-green-900"
            >
              Open Your Plan
            </Link>
          </div>
        ) : (
          <div className="px-6 py-8">
            <h2 className="font-display text-xl font-semibold text-ink">
              You don&apos;t have an approved plan yet
            </h2>
            <p className="mt-2 max-w-xl font-serif text-base leading-relaxed text-ink-soft">
              Two minutes of questions and our engine drafts a plan from your metrics
              and your prayer times. A coach reviews every one before it reaches you.
            </p>
            <Link
              href="/plan"
              className="mt-5 inline-block rounded-sm bg-green-800 px-7 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-ivory transition-colors hover:bg-green-900"
            >
              Start Your Plan
            </Link>
          </div>
        )}
      </section>

      {/* progress */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">This week</h2>
          <Link
            href="/account/progress"
            className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-green-700 transition-colors hover:text-green-900"
          >
            Log today →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Logging streak"
            value={progress.streak > 0 ? `${progress.streak} days` : "—"}
            note={progress.entries === 0 ? "Nothing logged yet" : `${progress.entries} entries`}
          />
          <Stat
            label="Weight"
            value={progress.latestWeightKg != null ? `${progress.latestWeightKg}kg` : "—"}
            note={
              progress.weightChangeKg != null
                ? `${progress.weightChangeKg > 0 ? "+" : ""}${progress.weightChangeKg}kg since you started`
                : undefined
            }
          />
          <Stat label="Workouts" value={`${progress.workoutsLast7}`} note="Last 7 days" />
          <Stat
            label="Salah on time"
            value={`${progress.prayersLast7}/35`}
            note={progress.fastsLast7 > 0 ? `${progress.fastsLast7} fasts kept` : "Last 7 days"}
          />
        </div>
      </section>

      {/* orders + downloads + subscription */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-linen bg-shell p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">Recent orders</h2>
            <Link
              href="/account/orders"
              className="text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-green-700 hover:text-green-900"
            >
              All
            </Link>
          </div>

          {settled.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">
              No orders yet.{" "}
              <Link href="/shop" className="text-green-700 underline decoration-gold/50">
                Visit the store
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-linen">
              {settled.slice(0, 3).map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/orders/${order.id}`}
                      className="font-mono text-[0.8rem] text-ink transition-colors hover:text-green-800"
                    >
                      {order.orderNumber}
                    </Link>
                    <p className="text-[0.7rem] text-ink-muted">
                      {order.items.length} {order.items.length === 1 ? "item" : "items"} ·{" "}
                      {order.createdAt.toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <span className="font-display text-sm font-semibold text-ink">
                    {formatMoneyExact(order.totalCents, order.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-linen bg-shell p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">Downloads</h2>
            <Link
              href="/account/downloads"
              className="text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-green-700 hover:text-green-900"
            >
              All
            </Link>
          </div>

          {downloads.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">
              Nothing to download yet — digital purchases appear here instantly.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {downloads.slice(0, 3).map((d) => (
                <li key={`${d.orderNumber}-${d.path}`}>
                  <a
                    href={d.path}
                    download
                    className="flex items-center justify-between gap-3 rounded-sm border border-linen px-4 py-2.5 text-sm transition-colors hover:border-gold"
                  >
                    <span className="text-ink">{d.name}</span>
                    <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-green-700">
                      Get
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}

          {subscription && (
            <div className="mt-6 border-t border-linen pt-4">
              <p className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-ink-muted">
                Subscription
              </p>
              <p className="mt-1.5 text-sm text-ink">
                {formatMoneyExact(subscription.priceCents)} / {subscription.interval} ·{" "}
                <span
                  className={
                    subscription.status === "active" ? "text-green-700" : "text-ink-muted"
                  }
                >
                  {subscription.status}
                </span>
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

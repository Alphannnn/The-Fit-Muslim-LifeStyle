import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Badge,
  Card,
  CardHeader,
  Detail,
  EmptyState,
  PageHeading,
  Table,
  Td,
  Th,
} from "@/components/admin/ui/primitives";
import { getCustomerDetail } from "@/lib/admin/queries";
import { formatMoneyExact } from "@/lib/money";
import type { OrderStatus, PlanStatus } from "@/lib/db/schema";

export const metadata = { title: "Customer" };

const ORDER_TONE: Record<OrderStatus, "neutral" | "success" | "warning" | "danger" | "info"> = {
  pending: "warning",
  paid: "info",
  fulfilled: "success",
  cancelled: "neutral",
  refunded: "danger",
};

const PLAN_TONE: Record<PlanStatus, "warning" | "success" | "info"> = {
  draft: "warning",
  approved: "info",
  delivered: "success",
};

export default async function AdminCustomerDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getCustomerDetail(id);
  if (!data) notFound();

  const { user, orders, plans, subscription, progress, reviews, spendCents, orderCount } = data;

  return (
    <>
      <PageHeading
        breadcrumb={[{ label: "Customers", href: "/admin/customers" }, { label: user.name }]}
        title={user.name}
        description={user.email}
        action={
          <Badge tone={user.role === "customer" ? "neutral" : "brand"}>{user.role}</Badge>
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Lifetime spend", value: formatMoneyExact(spendCents) },
          { label: "Settled orders", value: String(orderCount) },
          { label: "Plans", value: String(plans.length) },
          {
            label: "Subscription",
            value: subscription ? subscription.status : "None",
          },
        ].map((s) => (
          <Card key={s.label}>
            <p className="text-[0.72rem] font-medium uppercase tracking-[0.08em] text-panel-muted">
              {s.label}
            </p>
            <p className="mt-1.5 text-[1.35rem] font-semibold capitalize tracking-[-0.02em] text-panel-ink">
              {s.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card padded={false}>
            <div className="p-5 pb-3">
              <CardHeader title="Orders" description={`${orders.length} in total`} />
            </div>
            {orders.length === 0 ? (
              <div className="p-5 pt-0">
                <EmptyState title="No orders yet" />
              </div>
            ) : (
              <Table minWidth="32rem">
                <thead>
                  <tr>
                    <Th>Order</Th>
                    <Th>Items</Th>
                    <Th>Status</Th>
                    <Th align="right">Total</Th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <Td>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-medium text-panel-ink transition-colors hover:text-green-700"
                        >
                          {order.orderNumber}
                        </Link>
                        <span className="block text-[0.72rem] text-panel-muted">
                          {order.createdAt.toLocaleDateString("en-GB")}
                        </span>
                      </Td>
                      <Td>
                        <span className="block max-w-[16rem] truncate text-[0.78rem]">
                          {order.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
                        </span>
                      </Td>
                      <Td>
                        <Badge tone={ORDER_TONE[order.status]} dot>
                          {order.status}
                        </Badge>
                      </Td>
                      <Td align="right" className="font-semibold text-panel-ink">
                        {formatMoneyExact(order.totalCents, order.currency)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>

          <Card>
            <CardHeader title="Plans" description="Every version drafted for this customer." />
            {plans.length === 0 ? (
              <p className="py-4 text-[0.83rem] text-panel-muted">
                This customer has not completed the plan intake.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {plans.map((plan) => (
                  <li
                    key={plan.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-panel-border px-3.5 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[0.85rem] font-medium text-panel-ink">
                        {plan.title}
                      </p>
                      <p className="text-[0.72rem] text-panel-muted">
                        v{plan.version} · {plan.targetCalories} kcal ·{" "}
                        {plan.createdAt.toLocaleDateString("en-GB")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={PLAN_TONE[plan.status]}>{plan.status}</Badge>
                      <Link
                        href={`/admin/plans/${plan.id}`}
                        className="text-[0.76rem] font-medium text-green-700 transition-colors hover:text-green-900"
                      >
                        Open
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Profile" />
            <dl>
              <Detail label="Joined">
                {user.createdAt.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Detail>
              <Detail label="City">{user.city ?? "—"}</Detail>
              <Detail label="Country">{user.country ?? "—"}</Detail>
              <Detail label="Timezone">{user.timezone ?? "—"}</Detail>
            </dl>
            <p className="mt-3 text-[0.74rem] leading-relaxed text-panel-muted">
              Location is used to anchor their plan to local prayer times.
            </p>
          </Card>

          {subscription && (
            <Card>
              <CardHeader title="Subscription" />
              <dl>
                <Detail label="Status">
                  <Badge tone={subscription.status === "active" ? "success" : "neutral"}>
                    {subscription.status}
                  </Badge>
                </Detail>
                <Detail label="Price">
                  {formatMoneyExact(subscription.priceCents)} / {subscription.interval}
                </Detail>
                <Detail label="Renews">
                  {subscription.currentPeriodEnd
                    ? subscription.currentPeriodEnd.toLocaleDateString("en-GB")
                    : "—"}
                </Detail>
              </dl>
            </Card>
          )}

          <Card>
            <CardHeader title="Recent progress" description="Last 10 entries." />
            {progress.length === 0 ? (
              <p className="text-[0.83rem] text-panel-muted">Nothing logged yet.</p>
            ) : (
              <ul className="space-y-2">
                {progress.map((log) => (
                  <li key={log.id} className="flex items-baseline justify-between gap-3">
                    <span className="text-[0.78rem] text-panel-muted">
                      {new Date(`${log.loggedOn}T00:00:00`).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    <span className="text-right text-[0.78rem] text-panel-soft">
                      {[
                        log.weightKg != null ? `${log.weightKg}kg` : null,
                        log.workouts > 0 ? `${log.workouts} workout${log.workouts > 1 ? "s" : ""}` : null,
                        `${log.prayersOnTime}/5 salah`,
                        log.fasted ? "fasted" : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {reviews.length > 0 && (
            <Card>
              <CardHeader title="Reviews written" />
              <ul className="space-y-2">
                {reviews.map((review) => (
                  <li key={review.id} className="text-[0.8rem]">
                    <span className="font-medium text-panel-ink">{review.rating}★</span>{" "}
                    <span className="text-panel-soft">{review.title || review.body.slice(0, 60)}</span>
                    {!review.approved && (
                      <Badge tone="warning">pending</Badge>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

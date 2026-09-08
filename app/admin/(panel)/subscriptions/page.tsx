import Link from "next/link";
import {
  Badge,
  Card,
  EmptyState,
  PageHeading,
  Table,
  Td,
  Th,
} from "@/components/admin/ui/primitives";
import { FilterSelect, Pagination, SearchInput } from "@/components/admin/ui/TableControls";
import { listSubscriptions } from "@/lib/admin/queries";
import { formatMoneyExact } from "@/lib/money";
import type { SubscriptionStatus } from "@/lib/db/schema";

export const metadata = { title: "Subscriptions" };

const TONE: Record<SubscriptionStatus, "success" | "warning" | "danger" | "neutral"> = {
  active: "success",
  trialing: "warning",
  past_due: "danger",
  cancelled: "neutral",
};

const STATUSES: SubscriptionStatus[] = ["active", "trialing", "past_due", "cancelled"];

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const { rows, total, page, pages } = await listSubscriptions({
    query: sp.q,
    status: sp.status,
    page: Number(sp.page) || 1,
  });

  const mrr = rows
    .filter((r) => r.subscription.status === "active")
    .reduce(
      (sum, r) =>
        sum +
        (r.subscription.interval === "year"
          ? Math.round(r.subscription.priceCents / 12)
          : r.subscription.priceCents),
      0,
    );

  return (
    <>
      <PageHeading
        title="Subscriptions"
        description="Recurring plan subscriptions, their billing state and renewal dates."
      />

      <Card className="mb-4" padded={false}>
        <div className="flex flex-wrap items-center gap-3 p-4">
          <SearchInput placeholder="Customer name or email…" />
          <FilterSelect
            paramName="status"
            label="Filter by status"
            allLabel="All statuses"
            options={STATUSES.map((s) => ({ value: s, label: s.replace("_", " ") }))}
          />
          <span className="ml-auto text-[0.78rem] text-panel-muted">
            {formatMoneyExact(mrr)} monthly recurring on this page
          </span>
        </div>
      </Card>

      {rows.length === 0 ? (
        <EmptyState
          title="No subscriptions yet"
          description="They are created automatically when a customer checks out with a recurring plan."
        />
      ) : (
        <>
          <Table minWidth="46rem">
            <thead>
              <tr>
                <Th>Customer</Th>
                <Th>Status</Th>
                <Th>Interval</Th>
                <Th align="right">Price</Th>
                <Th>Renews</Th>
                <Th>Started</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ subscription, user }) => (
                <tr key={subscription.id}>
                  <Td>
                    <Link
                      href={`/admin/customers/${user.id}`}
                      className="font-medium text-panel-ink transition-colors hover:text-green-700"
                    >
                      {user.name}
                    </Link>
                    <span className="block truncate text-[0.72rem] text-panel-muted">
                      {user.email}
                    </span>
                  </Td>
                  <Td>
                    <Badge tone={TONE[subscription.status]} dot>
                      {subscription.status.replace("_", " ")}
                    </Badge>
                  </Td>
                  <Td className="capitalize">{subscription.interval}ly</Td>
                  <Td align="right" className="font-semibold text-panel-ink">
                    {formatMoneyExact(subscription.priceCents)}
                  </Td>
                  <Td>
                    {subscription.currentPeriodEnd
                      ? subscription.currentPeriodEnd.toLocaleDateString("en-GB")
                      : "—"}
                    {subscription.cancelAtPeriodEnd && (
                      <span className="block text-[0.7rem] text-danger">cancels at period end</span>
                    )}
                  </Td>
                  <Td>{subscription.createdAt.toLocaleDateString("en-GB")}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination page={page} pages={pages} total={total} label="subscriptions" />
        </>
      )}
    </>
  );
}

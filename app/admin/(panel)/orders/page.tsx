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
import {
  FilterSelect,
  Pagination,
  SearchInput,
  SortHeader,
} from "@/components/admin/ui/TableControls";
import { listOrders } from "@/lib/admin/queries";
import { formatMoneyExact } from "@/lib/money";
import type { OrderStatus } from "@/lib/db/schema";

export const metadata = { title: "Orders" };

const STATUS_TONE: Record<OrderStatus, "neutral" | "success" | "warning" | "danger" | "info"> = {
  pending: "warning",
  paid: "info",
  fulfilled: "success",
  cancelled: "neutral",
  refunded: "danger",
};

const STATUSES: OrderStatus[] = ["pending", "paid", "fulfilled", "cancelled", "refunded"];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    page?: string;
    sort?: string;
    dir?: string;
  }>;
}) {
  const sp = await searchParams;
  const { rows, total, page, pages } = await listOrders({
    query: sp.q,
    status: sp.status,
    page: Number(sp.page) || 1,
    sort: sp.sort,
    dir: sp.dir === "asc" ? "asc" : "desc",
  });

  const settled = rows.filter((o) => o.status === "paid" || o.status === "fulfilled");

  return (
    <>
      <PageHeading
        title="Orders"
        description="Every order, with its payment state, fulfilment state and tracking."
      />

      <Card className="mb-4" padded={false}>
        <div className="flex flex-wrap items-center gap-3 p-4">
          <SearchInput placeholder="Order number, email or name…" />
          <FilterSelect
            paramName="status"
            label="Filter by status"
            allLabel="All statuses"
            options={STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))}
          />
          <span className="ml-auto text-[0.78rem] text-panel-muted">
            {settled.length} settled on this page ·{" "}
            {formatMoneyExact(settled.reduce((sum, o) => sum + o.totalCents, 0))}
          </span>
        </div>
      </Card>

      {rows.length === 0 ? (
        <EmptyState
          title="No orders match"
          description="Try clearing the search or the status filter."
        />
      ) : (
        <>
          <Table minWidth="56rem">
            <thead>
              <tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Items</Th>
                <SortHeader field="status">Status</SortHeader>
                <SortHeader field="created">Placed</SortHeader>
                <SortHeader field="total" align="right">
                  Total
                </SortHeader>
                <Th align="right" />
              </tr>
            </thead>
            <tbody>
              {rows.map((order) => (
                <tr key={order.id}>
                  <Td>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-medium text-panel-ink transition-colors hover:text-green-700"
                    >
                      {order.orderNumber}
                    </Link>
                    {order.trackingNumber && (
                      <span className="block text-[0.7rem] text-panel-muted">
                        Tracking {order.trackingNumber}
                      </span>
                    )}
                  </Td>
                  <Td>
                    <span className="block truncate font-medium text-panel-ink">
                      {order.shippingName ?? order.customerName ?? "Guest"}
                    </span>
                    <span className="block truncate text-[0.72rem] text-panel-muted">
                      {order.email}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-[0.8rem]">
                      {order.items.reduce((n, i) => n + i.qty, 0)}
                    </span>
                    <span className="block max-w-[14rem] truncate text-[0.72rem] text-panel-muted">
                      {order.items.map((i) => i.name).join(", ")}
                    </span>
                  </Td>
                  <Td>
                    <Badge tone={STATUS_TONE[order.status]} dot>
                      {order.status}
                    </Badge>
                  </Td>
                  <Td>
                    <span className="text-[0.8rem]">
                      {order.createdAt.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </Td>
                  <Td align="right" className="font-semibold text-panel-ink">
                    {formatMoneyExact(order.totalCents, order.currency)}
                  </Td>
                  <Td align="right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-[0.76rem] font-medium text-green-700 transition-colors hover:text-green-900"
                    >
                      Manage
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination page={page} pages={pages} total={total} label="orders" />
        </>
      )}
    </>
  );
}

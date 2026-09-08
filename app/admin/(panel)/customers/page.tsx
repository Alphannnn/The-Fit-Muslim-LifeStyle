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
import { Pagination, SearchInput, SortHeader } from "@/components/admin/ui/TableControls";
import { listCustomers } from "@/lib/admin/queries";
import { formatMoneyExact } from "@/lib/money";

export const metadata = { title: "Customers" };

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; sort?: string; dir?: string }>;
}) {
  const sp = await searchParams;
  const { rows, total, page, pages } = await listCustomers({
    query: sp.q,
    page: Number(sp.page) || 1,
    sort: sp.sort,
    dir: sp.dir === "asc" ? "asc" : "desc",
  });

  return (
    <>
      <PageHeading
        title="Customers"
        description="Everyone with an account, what they have spent, and where their plan stands."
      />

      <Card className="mb-4" padded={false}>
        <div className="flex flex-wrap items-center gap-3 p-4">
          <SearchInput placeholder="Name or email…" />
          <span className="ml-auto text-[0.78rem] text-panel-muted">{total} customers</span>
        </div>
      </Card>

      {rows.length === 0 ? (
        <EmptyState
          title="No customers match"
          description="Accounts appear here as soon as someone signs up on the storefront."
        />
      ) : (
        <>
          <Table minWidth="52rem">
            <thead>
              <tr>
                <SortHeader field="name">Customer</SortHeader>
                <Th>Location</Th>
                <SortHeader field="orders">Orders</SortHeader>
                <SortHeader field="spend" align="right">
                  Spend
                </SortHeader>
                <Th>Plans</Th>
                <SortHeader field="created">Joined</SortHeader>
                <Th align="right" />
              </tr>
            </thead>
            <tbody>
              {rows.map((customer) => (
                <tr key={customer.id}>
                  <Td>
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="font-medium text-panel-ink transition-colors hover:text-green-700"
                    >
                      {customer.name}
                    </Link>
                    <span className="block truncate text-[0.72rem] text-panel-muted">
                      {customer.email}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-[0.8rem]">
                      {customer.city ? `${customer.city}` : "—"}
                    </span>
                    {customer.country && (
                      <span className="block text-[0.72rem] text-panel-muted">
                        {customer.country}
                      </span>
                    )}
                  </Td>
                  <Td>
                    <span className="text-[0.83rem] font-medium text-panel-ink">
                      {customer.orderCount}
                    </span>
                    {customer.lastOrderAt && (
                      <span className="block text-[0.72rem] text-panel-muted">
                        last {customer.lastOrderAt.toLocaleDateString("en-GB")}
                      </span>
                    )}
                  </Td>
                  <Td align="right" className="font-semibold text-panel-ink">
                    {formatMoneyExact(customer.spendCents)}
                  </Td>
                  <Td>
                    {customer.planCount > 0 ? (
                      <Badge tone="brand">{customer.planCount}</Badge>
                    ) : (
                      <span className="text-[0.78rem] text-panel-muted">—</span>
                    )}
                  </Td>
                  <Td>
                    <span className="text-[0.8rem]">
                      {customer.createdAt.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </Td>
                  <Td align="right">
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="text-[0.76rem] font-medium text-green-700 transition-colors hover:text-green-900"
                    >
                      Open
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination page={page} pages={pages} total={total} label="customers" />
        </>
      )}
    </>
  );
}

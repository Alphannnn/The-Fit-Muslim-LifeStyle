import Link from "next/link";
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
  LinkButton,
  PageHeading,
  Table,
  Td,
  Th,
} from "@/components/admin/ui/primitives";
import { requireAdmin } from "@/lib/admin/auth";
import { dashboard } from "@/lib/admin/queries";
import { formatMoney, formatMoneyExact } from "@/lib/money";
import type { OrderStatus } from "@/lib/db/schema";

export const metadata = { title: "Overview" };

const STATUS_TONE: Record<OrderStatus, "neutral" | "success" | "warning" | "danger" | "info"> = {
  pending: "warning",
  paid: "info",
  fulfilled: "success",
  cancelled: "neutral",
  refunded: "danger",
};

function Trend({ value }: { value: number }) {
  if (value === 0) {
    return <span className="text-[0.72rem] text-panel-muted">No change</span>;
  }
  const up = value > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[0.72rem] font-medium ${
        up ? "text-success" : "text-danger"
      }`}
    >
      <svg viewBox="0 0 24 24" className={`h-3 w-3 ${up ? "" : "rotate-180"}`} fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M12 19V5m0 0-6 6m6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {Math.abs(value)}%
      <span className="font-normal text-panel-muted">vs prev 30d</span>
    </span>
  );
}

function Kpi({
  label,
  value,
  footer,
}: {
  label: string;
  value: string;
  footer?: React.ReactNode;
}) {
  return (
    <Card>
      <p className="text-[0.72rem] font-medium uppercase tracking-[0.08em] text-panel-muted">
        {label}
      </p>
      <p className="mt-1.5 text-[1.6rem] font-semibold tracking-[-0.02em] text-panel-ink">
        {value}
      </p>
      {footer && <div className="mt-1.5">{footer}</div>}
    </Card>
  );
}

/** 30 days of settled revenue. Plain SVG — no charting dependency. */
function RevenueChart({ series }: { series: { day: string; cents: number }[] }) {
  const width = 720;
  const height = 160;
  const pad = { top: 12, right: 8, bottom: 22, left: 8 };
  const max = Math.max(...series.map((s) => s.cents), 1);
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const step = innerW / Math.max(1, series.length - 1);

  const points = series.map((s, i) => ({
    x: pad.left + i * step,
    y: pad.top + innerH - (s.cents / max) * innerH,
    ...s,
  }));

  const line = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${pad.left},${pad.top + innerH} ${line} ${(pad.left + innerW).toFixed(1)},${pad.top + innerH}`;
  const hasData = series.some((s) => s.cents > 0);

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-40 w-full"
        role="img"
        aria-label={`Settled revenue over the last 30 days, peaking at ${formatMoney(max)}`}
      >
        <defs>
          <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-green-500)" stopOpacity="0.24" />
            <stop offset="100%" stopColor="var(--color-green-500)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={pad.left}
            x2={pad.left + innerW}
            y1={pad.top + innerH * f}
            y2={pad.top + innerH * f}
            stroke="var(--color-panel-border)"
            strokeDasharray="3 4"
          />
        ))}
        {hasData && <polygon points={area} fill="url(#rev-fill)" />}
        <polyline
          points={line}
          fill="none"
          stroke="var(--color-green-700)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p) =>
          p.cents > 0 ? (
            <circle key={p.day} cx={p.x} cy={p.y} r="2.5" fill="var(--color-green-800)">
              <title>{`${p.day}: ${formatMoneyExact(p.cents)}`}</title>
            </circle>
          ) : null,
        )}
      </svg>
      <div className="flex justify-between px-1 text-[0.68rem] text-panel-muted">
        <span>{series[0]?.day}</span>
        <span>Peak {formatMoney(max)}</span>
        <span>{series[series.length - 1]?.day}</span>
      </div>
    </div>
  );
}

export default async function AdminOverview({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; denied?: string }>;
}) {
  const [{ welcome, denied }, user, data] = await Promise.all([
    searchParams,
    requireAdmin(),
    dashboard(),
  ]);

  const attention = [
    data.draftPlans > 0 && {
      label: "Plans awaiting coach review",
      count: data.draftPlans,
      href: "/admin/plans",
    },
    data.awaitingDispatch > 0 && {
      label: "Paid orders awaiting dispatch",
      count: data.awaitingDispatch,
      href: "/admin/orders?status=paid",
    },
    data.pendingReviews > 0 && {
      label: "Reviews awaiting moderation",
      count: data.pendingReviews,
      href: "/admin/reviews",
    },
    data.lowStock.length > 0 && {
      label: "Products low or out of stock",
      count: data.lowStock.length,
      href: "/admin/products",
    },
  ].filter(Boolean) as { label: string; count: number; href: string }[];

  return (
    <>
      <PageHeading
        title={`As-salāmu ʿalaykum, ${user.name.split(" ")[0]}`}
        description="Everything that needs a decision today, and how the store is performing."
        action={<LinkButton href="/admin/orders" variant="secondary">View all orders</LinkButton>}
      />

      {welcome && (
        <div className="mb-6 rounded-lg border border-success/30 bg-success-soft px-4 py-3 text-[0.85rem] text-success">
          Welcome aboard. Your staff account is ready — you are signed in as{" "}
          <strong>{user.role}</strong>.
        </div>
      )}
      {denied && (
        <div className="mb-6 rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 text-[0.85rem] text-warning">
          That area is restricted to full admins.
        </div>
      )}

      {attention.length > 0 && (
        <Card className="mb-6 border-warning/30 bg-warning-soft/50">
          <CardHeader
            title="Needs your attention"
            description="Nothing here resolves itself — each one is waiting on a person."
          />
          <ul className="grid gap-2 sm:grid-cols-2">
            {attention.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between gap-3 rounded-md border border-panel-border bg-panel-surface px-3.5 py-2.5 transition-colors hover:border-warning/50"
                >
                  <span className="text-[0.83rem] text-panel-soft">{item.label}</span>
                  <span className="rounded-full bg-warning px-2 py-0.5 text-[0.7rem] font-bold text-white">
                    {item.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Revenue · 30 days"
          value={formatMoney(data.revenue30Cents)}
          footer={<Trend value={data.revenueChange} />}
        />
        <Kpi
          label="Orders · 30 days"
          value={String(data.orders30)}
          footer={<Trend value={data.ordersChange} />}
        />
        <Kpi
          label="Customers"
          value={String(data.customersTotal)}
          footer={
            <span className="text-[0.72rem] text-panel-muted">
              +{data.customers30} in the last 30 days
            </span>
          }
        />
        <Kpi
          label="Lifetime revenue"
          value={formatMoney(data.revenueAllCents)}
          footer={
            <span className="text-[0.72rem] text-panel-muted">
              {data.activeSubs} active subscription{data.activeSubs === 1 ? "" : "s"}
            </span>
          }
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Settled revenue"
            description="Paid and fulfilled orders over the last 30 days."
          />
          <RevenueChart series={data.series} />
        </Card>

        <Card>
          <CardHeader title="Best sellers" description="By revenue, all time." />
          {data.topProducts.length === 0 ? (
            <p className="py-6 text-center text-[0.83rem] text-panel-muted">
              No settled orders yet.
            </p>
          ) : (
            <ol className="space-y-3">
              {data.topProducts.map((p, i) => (
                <li key={`${p.name}-${p.subtitle}`} className="flex items-center gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-panel text-[0.7rem] font-semibold text-panel-muted">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.83rem] font-medium text-panel-ink">
                      {p.name}
                    </span>
                    <span className="block truncate text-[0.72rem] text-panel-muted">
                      {p.subtitle} · {p.units} sold
                    </span>
                  </span>
                  <span className="shrink-0 text-[0.82rem] font-semibold text-panel-ink">
                    {formatMoney(p.revenue)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" padded={false}>
          <div className="p-5 pb-0">
            <CardHeader
              title="Recent orders"
              action={
                <Link
                  href="/admin/orders"
                  className="text-[0.76rem] font-medium text-green-700 transition-colors hover:text-green-900"
                >
                  View all
                </Link>
              }
            />
          </div>
          {data.recentOrders.length === 0 ? (
            <div className="p-5 pt-0">
              <EmptyState title="No orders yet" description="They will appear here as they come in." />
            </div>
          ) : (
            <Table minWidth="34rem">
              <thead>
                <tr>
                  <Th>Order</Th>
                  <Th>Customer</Th>
                  <Th>Status</Th>
                  <Th align="right">Total</Th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map(({ order, customerName }) => (
                  <tr key={order.id}>
                    <Td>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium text-panel-ink transition-colors hover:text-green-700"
                      >
                        {order.orderNumber}
                      </Link>
                      <span className="block text-[0.72rem] text-panel-muted">
                        {order.createdAt.toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </Td>
                    <Td>
                      <span className="block truncate">{customerName ?? "Guest"}</span>
                      <span className="block truncate text-[0.72rem] text-panel-muted">
                        {order.email}
                      </span>
                    </Td>
                    <Td>
                      <Badge tone={STATUS_TONE[order.status]} dot>
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
          <CardHeader title="Stock watch" description="12 units or fewer." />
          {data.lowStock.length === 0 ? (
            <p className="py-6 text-center text-[0.83rem] text-panel-muted">
              Every tracked product is comfortably in stock.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {data.lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3">
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="min-w-0 flex-1 truncate text-[0.83rem] text-panel-soft transition-colors hover:text-green-700"
                  >
                    {p.name}
                    <span className="block truncate text-[0.72rem] text-panel-muted">
                      {p.subtitle}
                    </span>
                  </Link>
                  <Badge tone={(p.stock ?? 0) <= 0 ? "danger" : "warning"}>
                    {(p.stock ?? 0) <= 0 ? "Out" : `${p.stock} left`}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

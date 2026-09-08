import Link from "next/link";
import { notFound } from "next/navigation";
import OrderStatusForm from "@/components/admin/OrderStatusForm";
import {
  Badge,
  Card,
  CardHeader,
  Detail,
  PageHeading,
} from "@/components/admin/ui/primitives";
import { getOrderDetail } from "@/lib/admin/queries";
import { formatMoneyExact } from "@/lib/money";
import type { OrderStatus } from "@/lib/db/schema";

export const metadata = { title: "Order" };

const STATUS_TONE: Record<OrderStatus, "neutral" | "success" | "warning" | "danger" | "info"> = {
  pending: "warning",
  paid: "info",
  fulfilled: "success",
  cancelled: "neutral",
  refunded: "danger",
};

export default async function AdminOrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderDetail(id);
  if (!order) notFound();

  const address = order.shippingAddress;

  return (
    <>
      <PageHeading
        breadcrumb={[{ label: "Orders", href: "/admin/orders" }, { label: order.orderNumber }]}
        title={order.orderNumber}
        description={`Placed ${order.createdAt.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })} · ${order.email}`}
        action={<Badge tone={STATUS_TONE[order.status]} dot>{order.status}</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card padded={false}>
            <div className="p-5 pb-3">
              <CardHeader title="Items" />
            </div>
            <ul className="divide-y divide-panel-border">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="grid h-14 w-12 shrink-0 place-items-center overflow-hidden rounded-md border border-panel-border bg-panel">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt="" className="h-full w-full object-contain p-1" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.86rem] font-medium text-panel-ink">
                      {item.name}
                    </p>
                    <p className="truncate text-[0.74rem] text-panel-muted">
                      {item.subtitle} · {formatMoneyExact(item.unitPriceCents, order.currency)} each
                      {item.kind !== "physical" && ` · ${item.kind}`}
                    </p>
                  </div>
                  <span className="shrink-0 text-[0.8rem] text-panel-muted">×{item.qty}</span>
                  <span className="w-24 shrink-0 text-right text-[0.86rem] font-semibold text-panel-ink">
                    {formatMoneyExact(item.unitPriceCents * item.qty, order.currency)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="border-t border-panel-border bg-panel-raised px-5 py-4">
              <Detail label="Subtotal">
                {formatMoneyExact(order.subtotalCents, order.currency)}
              </Detail>
              {order.shippingCents > 0 && (
                <Detail label="Delivery">
                  {formatMoneyExact(order.shippingCents, order.currency)}
                </Detail>
              )}
              {order.taxCents > 0 && (
                <Detail label="Tax">{formatMoneyExact(order.taxCents, order.currency)}</Detail>
              )}
              <Detail label="Total">
                <span className="text-[1rem]">
                  {formatMoneyExact(order.totalCents, order.currency)}
                </span>
              </Detail>
            </dl>
          </Card>

          <Card>
            <CardHeader
              title="Fulfilment"
              description="Changing the status here is recorded in the activity log."
            />
            <OrderStatusForm
              orderId={order.id}
              status={order.status}
              trackingNumber={order.trackingNumber}
            />
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Customer" />
            <dl>
              <Detail label="Name">{order.shippingName ?? order.customer?.name ?? "Guest"}</Detail>
              <Detail label="Email">{order.email}</Detail>
              <Detail label="Account">
                {order.customer ? (
                  <Link
                    href={`/admin/customers/${order.customer.id}`}
                    className="text-green-700 transition-colors hover:text-green-900"
                  >
                    View profile
                  </Link>
                ) : (
                  <span className="text-panel-muted">Guest checkout</span>
                )}
              </Detail>
            </dl>
          </Card>

          <Card>
            <CardHeader title="Delivery" />
            {address ? (
              <address className="text-[0.85rem] not-italic leading-relaxed text-panel-soft">
                {order.shippingName && (
                  <>
                    <span className="font-medium text-panel-ink">{order.shippingName}</span>
                    <br />
                  </>
                )}
                {[address.line1, address.line2, address.city, address.postalCode, address.country]
                  .filter(Boolean)
                  .join(", ")}
              </address>
            ) : (
              <p className="text-[0.83rem] text-panel-muted">
                No delivery address — this order is digital or a subscription.
              </p>
            )}
          </Card>

          <Card>
            <CardHeader title="Payment" />
            <dl>
              <Detail label="Status">
                <Badge tone={STATUS_TONE[order.status]}>{order.status}</Badge>
              </Detail>
              <Detail label="Paid at">
                {order.paidAt
                  ? order.paidAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
                  : "—"}
              </Detail>
              <Detail label="Stripe session">
                <span className="font-mono text-[0.72rem]">
                  {order.stripeSessionId ?? "—"}
                </span>
              </Detail>
              <Detail label="Payment intent">
                <span className="font-mono text-[0.72rem]">
                  {order.stripePaymentIntentId ?? "—"}
                </span>
              </Detail>
            </dl>
          </Card>

          <Card>
            <CardHeader title="Customer view" />
            <Link
              href={`/orders/${order.id}`}
              target="_blank"
              className="text-[0.82rem] font-medium text-green-700 transition-colors hover:text-green-900"
            >
              Open the receipt the customer sees ↗
            </Link>
          </Card>
        </div>
      </div>
    </>
  );
}

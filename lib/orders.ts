import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  orderItems,
  orders,
  products,
  users,
  type Address,
  type Order,
  type OrderItem,
} from "@/lib/db/schema";
import { clearCart, type CartView } from "@/lib/cart/server";
import { formatMoneyExact } from "@/lib/money";
import { newId, newOrderNumber } from "@/lib/ids";
import { orderConfirmationMail, sendMail } from "@/lib/mail";
import { siteUrl } from "@/lib/stripe";

export type OrderWithItems = Order & { items: OrderItem[] };

/**
 * Turns a server-side cart into a pending order. Totals come from
 * `cart.totals`, which is itself derived from the products table — a client
 * payload never reaches this function.
 */
export async function createPendingOrder(input: {
  cart: CartView;
  email: string;
  userId?: string | null;
}): Promise<OrderWithItems> {
  const { cart, email, userId } = input;
  if (cart.lines.length === 0) throw new Error("EMPTY_CART");

  const db = await getDb();
  const id = newId();

  const [order] = await db
    .insert(orders)
    .values({
      id,
      orderNumber: newOrderNumber(),
      userId: userId ?? null,
      email: email.trim().toLowerCase(),
      status: "pending",
      subtotalCents: cart.totals.subtotalCents,
      shippingCents: cart.totals.shippingCents,
      taxCents: cart.totals.taxCents,
      totalCents: cart.totals.totalCents,
      currency: cart.currency,
    })
    .returning();

  const items = await db
    .insert(orderItems)
    .values(
      cart.lines.map((line) => ({
        id: newId(),
        orderId: id,
        productId: line.productId,
        name: line.name,
        subtitle: line.subtitle,
        image: line.image,
        kind: line.kind,
        /* snapshotted so a later catalogue change can't break an old receipt */
        downloadPath: line.downloadPath,
        unitPriceCents: line.unitPriceCents,
        qty: line.qty,
      })),
    )
    .returning();

  return { ...order, items };
}

export async function attachStripeSession(
  orderId: string,
  sessionId: string,
): Promise<void> {
  const db = await getDb();
  await db
    .update(orders)
    .set({ stripeSessionId: sessionId })
    .where(eq(orders.id, orderId));
}

/**
 * Settles an order: records payment, decrements stock, empties the cart and
 * sends the confirmation. Idempotent — a webhook retry (or the success page
 * reconciling before the webhook lands) will not double-apply anything.
 */
export async function markOrderPaid(input: {
  orderId: string;
  paymentIntentId?: string | null;
  address?: Address | null;
  cartId?: string | null;
}): Promise<Order | null> {
  const db = await getDb();

  const existing = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
  const order = existing[0];
  if (!order) return null;
  if (order.status !== "pending") return order; // already settled

  const [updated] = await db
    .update(orders)
    .set({
      status: "paid",
      paidAt: new Date(),
      stripePaymentIntentId: input.paymentIntentId ?? order.stripePaymentIntentId,
      shippingAddress: input.address ?? order.shippingAddress,
    })
    .where(eq(orders.id, input.orderId))
    .returning();

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

  /* Reduce stock for trackable goods. `max(0, …)` keeps a race from pushing
     a count negative; digital goods and plans carry a null stock. */
  for (const item of items) {
    if (!item.productId) continue;
    await db
      .update(products)
      .set({ stock: sql`max(0, ${products.stock} - ${item.qty})` })
      .where(eq(products.id, item.productId));
  }

  if (input.cartId) await clearCart(input.cartId);

  const name = order.userId
    ? (await db.select({ name: users.name }).from(users).where(eq(users.id, order.userId)).limit(1))[0]?.name
    : null;

  await sendMail(
    orderConfirmationMail({
      to: order.email,
      name,
      orderNumber: order.orderNumber,
      total: formatMoneyExact(order.totalCents, order.currency),
      lines: items.map((i) => ({ name: i.name, qty: i.qty })),
      orderUrl: `${siteUrl()}/orders/${order.id}`,
    }),
  );

  return updated;
}

export async function getOrder(id: string): Promise<OrderWithItems | null> {
  const db = await getDb();
  const rows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!rows[0]) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
  return { ...rows[0], items };
}

export async function listOrdersForUser(userId: string): Promise<OrderWithItems[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));

  return Promise.all(
    rows.map(async (order) => ({
      ...order,
      items: await db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
    })),
  );
}

export async function listAllOrders(limit = 100): Promise<OrderWithItems[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(limit);

  return Promise.all(
    rows.map(async (order) => ({
      ...order,
      items: await db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
    })),
  );
}

export async function setOrderStatus(
  id: string,
  status: Order["status"],
): Promise<void> {
  const db = await getDb();
  await db.update(orders).set({ status }).where(eq(orders.id, id));
}

/** Digital goods the customer has paid for, for the account downloads list. */
export async function purchasedDownloads(
  userId: string,
): Promise<{ name: string; subtitle: string; path: string; orderNumber: string }[]> {
  const all = await listOrdersForUser(userId);
  const paid = all.filter((o) => o.status === "paid" || o.status === "fulfilled");
  const db = await getDb();

  const results: { name: string; subtitle: string; path: string; orderNumber: string }[] = [];
  for (const order of paid) {
    for (const item of order.items) {
      if (item.kind !== "digital" || !item.productId) continue;
      const rows = await db
        .select({ downloadPath: products.downloadPath })
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);
      const path = item.downloadPath ?? rows[0]?.downloadPath;
      if (path) {
        results.push({
          name: item.name,
          subtitle: item.subtitle,
          path,
          orderNumber: order.orderNumber,
        });
      }
    }
  }
  return results;
}

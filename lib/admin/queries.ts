import { and, desc, asc, count, eq, gte, inArray, like, or, sql, sum } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  journalPosts,
  newsletterSubscribers,
  orderItems,
  orders,
  plans,
  products,
  progressLogs,
  reviews,
  subscriptions,
  users,
  type Order,
  type OrderItem,
  type OrderStatus,
  type User,
} from "@/lib/db/schema";

/* Read-side helpers for the admin lists. Every one of them supports the same
   URL-driven contract — search, filter, sort, page — so the list screens all
   behave identically. */

export type ListOptions = {
  page?: number;
  perPage?: number;
  query?: string;
  status?: string;
  sort?: string;
  dir?: "asc" | "desc";
};

export type Paged<T> = { rows: T[]; total: number; page: number; pages: number };

const paginate = (total: number, page: number, perPage: number) => ({
  total,
  page,
  pages: Math.max(1, Math.ceil(total / perPage)),
});

const like_ = (value: string) => `%${value.toLowerCase()}%`;

/* --------------------------------------------------------------- orders */

export type OrderRow = Order & { items: OrderItem[]; customerName: string | null };

export async function listOrders(options: ListOptions = {}): Promise<Paged<OrderRow>> {
  const perPage = options.perPage ?? 20;
  const page = Math.max(1, options.page ?? 1);

  const filters = [];
  if (options.query) {
    const q = like_(options.query);
    filters.push(
      or(
        like(sql`lower(${orders.orderNumber})`, q),
        like(sql`lower(${orders.email})`, q),
        like(sql`lower(${orders.shippingName})`, q),
      ),
    );
  }
  if (options.status) filters.push(eq(orders.status, options.status as OrderStatus));
  const where = filters.length ? and(...filters) : undefined;

  const totalRow = await (where
    ? db.select({ n: count() }).from(orders).where(where).get()
    : db.select({ n: count() }).from(orders).get());

  const column =
    options.sort === "total"
      ? orders.totalCents
      : options.sort === "status"
        ? orders.status
        : orders.createdAt;
  const order = options.dir === "asc" ? asc(column) : desc(column);

  const base = db
    .select({ order: orders, customerName: users.name })
    .from(orders)
    .leftJoin(users, eq(users.id, orders.userId));

  const rows = await (where ? base.where(where) : base)
    .orderBy(order)
    .limit(perPage)
    .offset((page - 1) * perPage)
    .all();

  /* one query for the line items of this page rather than one per order */
  const ids = rows.map((r) => r.order.id);
  const items = ids.length
    ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids)).all()
    : [];

  return {
    rows: rows.map((r) => ({
      ...r.order,
      customerName: r.customerName,
      items: items.filter((i) => i.orderId === r.order.id),
    })),
    ...paginate(Number(totalRow?.n ?? 0), page, perPage),
  };
}

export async function getOrderDetail(id: string) {
  const row = await db
    .select({ order: orders, customer: users })
    .from(orders)
    .leftJoin(users, eq(users.id, orders.userId))
    .where(eq(orders.id, id))
    .get();
  if (!row) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id)).all();
  return { ...row.order, customer: row.customer, items };
}

/* ------------------------------------------------------------ customers */

export type CustomerRow = User & {
  orderCount: number;
  spendCents: number;
  planCount: number;
  lastOrderAt: Date | null;
};

export async function listCustomers(options: ListOptions = {}): Promise<Paged<CustomerRow>> {
  const perPage = options.perPage ?? 20;
  const page = Math.max(1, options.page ?? 1);

  const filters = [eq(users.role, "customer")];
  if (options.query) {
    const q = like_(options.query);
    const match = or(like(sql`lower(${users.name})`, q), like(sql`lower(${users.email})`, q));
    if (match) filters.push(match);
  }
  const where = and(...filters);

  const totalRow = await db.select({ n: count() }).from(users).where(where).get();

  /* Spend and order counts are aggregated in SQL — pulling every order into
     JS to count them would not survive a real customer list. */
  const column =
    options.sort === "spend"
      ? sql`coalesce(spend, 0)`
      : options.sort === "orders"
        ? sql`coalesce(order_count, 0)`
        : options.sort === "name"
          ? users.name
          : users.createdAt;
  const direction = options.dir === "asc" ? asc(column) : desc(column);

  const rows = await db
    .select({
      user: users,
      orderCount: sql<number>`(
        select count(*) from orders o
        where o.user_id = ${users.id} and o.status in ('paid','fulfilled')
      )`.as("order_count"),
      spendCents: sql<number>`(
        select coalesce(sum(o.total_cents), 0) from orders o
        where o.user_id = ${users.id} and o.status in ('paid','fulfilled')
      )`.as("spend"),
      planCount: sql<number>`(select count(*) from plans p where p.user_id = ${users.id})`,
      lastOrderAt: sql<number | null>`(
        select max(o.created_at) from orders o where o.user_id = ${users.id}
      )`,
    })
    .from(users)
    .where(where)
    .orderBy(direction)
    .limit(perPage)
    .offset((page - 1) * perPage)
    .all();

  return {
    rows: rows.map((r) => ({
      ...r.user,
      orderCount: Number(r.orderCount ?? 0),
      spendCents: Number(r.spendCents ?? 0),
      planCount: Number(r.planCount ?? 0),
      lastOrderAt: r.lastOrderAt ? new Date(Number(r.lastOrderAt) * 1000) : null,
    })),
    ...paginate(Number(totalRow?.n ?? 0), page, perPage),
  };
}

export async function getCustomerDetail(id: string) {
  const user = await db.select().from(users).where(eq(users.id, id)).get();
  if (!user) return null;

  const [customerOrders, customerPlans, customerSubscription, logs, customerReviews] =
    await Promise.all([
      db.select().from(orders).where(eq(orders.userId, id)).orderBy(desc(orders.createdAt)).all(),
      db.select().from(plans).where(eq(plans.userId, id)).orderBy(desc(plans.version)).all(),
      db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, id))
        .orderBy(desc(subscriptions.createdAt))
        .get(),
      db
        .select()
        .from(progressLogs)
        .where(eq(progressLogs.userId, id))
        .orderBy(desc(progressLogs.loggedOn))
        .limit(10)
        .all(),
      db.select().from(reviews).where(eq(reviews.userId, id)).all(),
    ]);

  const ids = customerOrders.map((o) => o.id);
  const items = ids.length
    ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids)).all()
    : [];

  const settled = customerOrders.filter(
    (o) => o.status === "paid" || o.status === "fulfilled",
  );

  return {
    user,
    orders: customerOrders.map((o) => ({
      ...o,
      items: items.filter((i) => i.orderId === o.id),
    })),
    plans: customerPlans,
    subscription: customerSubscription ?? null,
    progress: logs,
    reviews: customerReviews,
    spendCents: settled.reduce((sum, o) => sum + o.totalCents, 0),
    orderCount: settled.length,
  };
}

/* -------------------------------------------------------- subscriptions */

export async function listSubscriptions(options: ListOptions = {}) {
  const perPage = options.perPage ?? 25;
  const page = Math.max(1, options.page ?? 1);

  const filters = [];
  if (options.status) filters.push(eq(subscriptions.status, options.status as never));
  if (options.query) {
    const q = like_(options.query);
    const match = or(like(sql`lower(${users.name})`, q), like(sql`lower(${users.email})`, q));
    if (match) filters.push(match);
  }
  const where = filters.length ? and(...filters) : undefined;

  const totalQuery = db
    .select({ n: count() })
    .from(subscriptions)
    .innerJoin(users, eq(users.id, subscriptions.userId));
  const totalRow = await (where ? totalQuery.where(where) : totalQuery).get();

  const base = db
    .select({ subscription: subscriptions, user: users })
    .from(subscriptions)
    .innerJoin(users, eq(users.id, subscriptions.userId));

  const rows = await (where ? base.where(where) : base)
    .orderBy(desc(subscriptions.createdAt))
    .limit(perPage)
    .offset((page - 1) * perPage)
    .all();

  return { rows, ...paginate(Number(totalRow?.n ?? 0), page, perPage) };
}

/* ----------------------------------------------------------- newsletter */

export async function listSubscribers(options: ListOptions = {}) {
  const perPage = options.perPage ?? 40;
  const page = Math.max(1, options.page ?? 1);

  const where = options.query
    ? like(sql`lower(${newsletterSubscribers.email})`, like_(options.query))
    : undefined;

  const totalRow = await (where
    ? db.select({ n: count() }).from(newsletterSubscribers).where(where).get()
    : db.select({ n: count() }).from(newsletterSubscribers).get());

  const base = db.select().from(newsletterSubscribers);
  const rows = await (where ? base.where(where) : base)
    .orderBy(desc(newsletterSubscribers.createdAt))
    .limit(perPage)
    .offset((page - 1) * perPage)
    .all();

  return { rows, ...paginate(Number(totalRow?.n ?? 0), page, perPage) };
}

export function allSubscriberEmails() {
  return db
    .select({ email: newsletterSubscribers.email, source: newsletterSubscribers.source, createdAt: newsletterSubscribers.createdAt })
    .from(newsletterSubscribers)
    .orderBy(desc(newsletterSubscribers.createdAt))
    .all();
}

/* ------------------------------------------------------------ dashboard */

export type DashboardData = Awaited<ReturnType<typeof dashboard>>;

export async function dashboard() {
  const now = Date.now();
  const since30 = new Date(now - 30 * 86_400_000);
  const since60 = new Date(now - 60 * 86_400_000);
  const settled: OrderStatus[] = ["paid", "fulfilled"];

  const [
    revenueAll,
    revenue30,
    revenuePrev30,
    orders30,
    ordersPrev30,
    awaitingDispatch,
    draftPlans,
    pendingReviews,
    lowStock,
    customers30,
    customersTotal,
    subscribersTotal,
    activeSubs,
    recentOrders,
    topProducts,
  ] = await Promise.all([
    db.select({ v: sum(orders.totalCents) }).from(orders).where(inArray(orders.status, settled)).get(),
    db
      .select({ v: sum(orders.totalCents) })
      .from(orders)
      .where(and(inArray(orders.status, settled), gte(orders.createdAt, since30)))
      .get(),
    db
      .select({ v: sum(orders.totalCents) })
      .from(orders)
      .where(
        and(
          inArray(orders.status, settled),
          gte(orders.createdAt, since60),
          sql`${orders.createdAt} < ${Math.floor(since30.getTime() / 1000)}`,
        ),
      )
      .get(),
    db
      .select({ n: count() })
      .from(orders)
      .where(and(inArray(orders.status, settled), gte(orders.createdAt, since30)))
      .get(),
    db
      .select({ n: count() })
      .from(orders)
      .where(
        and(
          inArray(orders.status, settled),
          gte(orders.createdAt, since60),
          sql`${orders.createdAt} < ${Math.floor(since30.getTime() / 1000)}`,
        ),
      )
      .get(),
    db.select({ n: count() }).from(orders).where(eq(orders.status, "paid")).get(),
    db.select({ n: count() }).from(plans).where(eq(plans.status, "draft")).get(),
    db.select({ n: count() }).from(reviews).where(eq(reviews.approved, false)).get(),
    db
      .select()
      .from(products)
      .where(and(eq(products.active, true), sql`${products.stock} is not null and ${products.stock} <= 12`))
      .orderBy(products.stock)
      .all(),
    db.select({ n: count() }).from(users).where(and(eq(users.role, "customer"), gte(users.createdAt, since30))).get(),
    db.select({ n: count() }).from(users).where(eq(users.role, "customer")).get(),
    db.select({ n: count() }).from(newsletterSubscribers).get(),
    db.select({ n: count() }).from(subscriptions).where(eq(subscriptions.status, "active")).get(),
    db
      .select({ order: orders, customerName: users.name })
      .from(orders)
      .leftJoin(users, eq(users.id, orders.userId))
      .orderBy(desc(orders.createdAt))
      .limit(6)
      .all(),
    db
      .select({
        name: orderItems.name,
        subtitle: orderItems.subtitle,
        units: sql<number>`sum(${orderItems.qty})`,
        revenue: sql<number>`sum(${orderItems.qty} * ${orderItems.unitPriceCents})`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(inArray(orders.status, settled))
      .groupBy(orderItems.name, orderItems.subtitle)
      .orderBy(desc(sql`sum(${orderItems.qty} * ${orderItems.unitPriceCents})`))
      .limit(5)
      .all(),
  ]);

  /* 30 days of settled revenue, bucketed by day for the sparkline. */
  const daily = await db
    .select({
      day: sql<string>`date(${orders.createdAt}, 'unixepoch')`,
      total: sql<number>`sum(${orders.totalCents})`,
    })
    .from(orders)
    .where(and(inArray(orders.status, settled), gte(orders.createdAt, since30)))
    .groupBy(sql`date(${orders.createdAt}, 'unixepoch')`)
    .all();

  const byDay = new Map(daily.map((d) => [d.day, Number(d.total ?? 0)]));
  const series = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(now - (29 - i) * 86_400_000);
    const key = date.toISOString().slice(0, 10);
    return { day: key, cents: byDay.get(key) ?? 0 };
  });

  const n = (v: unknown) => Number(v ?? 0);
  const change = (current: number, previous: number) =>
    previous === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - previous) / previous) * 100);

  return {
    revenueAllCents: n(revenueAll?.v),
    revenue30Cents: n(revenue30?.v),
    revenueChange: change(n(revenue30?.v), n(revenuePrev30?.v)),
    orders30: n(orders30?.n),
    ordersChange: change(n(orders30?.n), n(ordersPrev30?.n)),
    awaitingDispatch: n(awaitingDispatch?.n),
    draftPlans: n(draftPlans?.n),
    pendingReviews: n(pendingReviews?.n),
    lowStock,
    customers30: n(customers30?.n),
    customersTotal: n(customersTotal?.n),
    subscribersTotal: n(subscribersTotal?.n),
    activeSubs: n(activeSubs?.n),
    recentOrders,
    topProducts: topProducts.map((p) => ({
      ...p,
      units: Number(p.units ?? 0),
      revenue: Number(p.revenue ?? 0),
    })),
    series,
  };
}

/* ---------------------------------------------------------------- staff */

export async function listStaff() {
  return db
    .select()
    .from(users)
    .where(inArray(users.role, ["admin", "coach"]))
    .orderBy(users.role, users.name)
    .all();
}

export async function contentCounts() {
  const [productCount, postCount] = await Promise.all([
    db.select({ n: count() }).from(products).get(),
    db.select({ n: count() }).from(journalPosts).get(),
  ]);
  return { products: Number(productCount?.n ?? 0), posts: Number(postCount?.n ?? 0) };
}

import { randomUUID } from "node:crypto";
import { relations } from "drizzle-orm";
import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/* ============================================================
   Conventions
   - ids are uuids (text) so they are safe to expose in URLs
   - all money is stored as integer minor units (cents), never floats
   - timestamps are unix seconds via drizzle's timestamp mode
   ============================================================ */

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID());

const createdAt = () =>
  integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date());

/* ---------------------------------------------------------------- users */

export type UserRole = "customer" | "coach" | "admin";

export const users = sqliteTable(
  "users",
  {
    id: id(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    role: text("role").notNull().$type<UserRole>().default("customer"),
    /** free-form personalisation the account dashboard collects over time */
    city: text("city"),
    country: text("country"),
    timezone: text("timezone"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("users_email_unique").on(t.email)],
);

/**
 * Storefront and admin sessions are deliberately separate rows with separate
 * cookies. Signing into the shop grants no admin access, and an admin session
 * is scoped to /admin with a much shorter life.
 */
export type SessionScope = "site" | "admin";

export const sessions = sqliteTable("sessions", {
  /** sha256 of the cookie token — the raw token is never stored */
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  scope: text("scope").notNull().$type<SessionScope>().default("site"),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  /* recorded so a staff member can see and revoke their own live sessions */
  userAgent: text("user_agent"),
  ip: text("ip"),
  lastSeenAt: integer("last_seen_at", { mode: "timestamp" }),
  createdAt: createdAt(),
});

/* ------------------------------------------------------------- catalogue */

export type ProductKind = "physical" | "digital" | "subscription";

export const products = sqliteTable(
  "products",
  {
    id: id(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    subtitle: text("subtitle").notNull().default(""),
    /** short line used on cards and meta descriptions */
    tagline: text("tagline").notNull().default(""),
    /** long description, markdown-ish (paragraphs split on blank lines) */
    description: text("description").notNull().default(""),
    kind: text("kind").notNull().$type<ProductKind>().default("physical"),
    priceCents: integer("price_cents").notNull(),
    compareAtCents: integer("compare_at_cents"),
    currency: text("currency").notNull().default("USD"),
    image: text("image").notNull(),
    /** optional secondary media shown on the product page */
    video: text("video"),
    videoPoster: text("video_poster"),
    /** null = not stock-tracked (digital goods, subscriptions) */
    stock: integer("stock"),
    /** digital goods are fulfilled instantly from this path */
    downloadPath: text("download_path"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    position: integer("position").notNull().default(0),
    /** collection slugs, e.g. ["ramadan","worship"] — drives merchandising */
    collections: text("collections", { mode: "json" }).$type<string[]>().notNull().$defaultFn(() => []),
    pillars: text("pillars", { mode: "json" }).$type<string[]>().notNull().$defaultFn(() => []),
    specs: text("specs", { mode: "json" })
      .$type<{ k: string; v: string }[]>()
      .notNull()
      .$defaultFn(() => []),
    /* ---- halal transparency (feature 5) ---- */
    halalStatus: text("halal_status")
      .notNull()
      .$type<"certified" | "verified-ingredients" | "not-applicable">()
      .default("not-applicable"),
    halalAuthority: text("halal_authority"),
    halalCertRef: text("halal_cert_ref"),
    ingredients: text("ingredients", { mode: "json" }).$type<string[]>().notNull().$defaultFn(() => []),
    allergens: text("allergens", { mode: "json" }).$type<string[]>().notNull().$defaultFn(() => []),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("products_slug_unique").on(t.slug)],
);

export const journalPosts = sqliteTable(
  "journal_posts",
  {
    id: id(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    category: text("category").notNull().default("Mindset"),
    excerpt: text("excerpt").notNull().default(""),
    body: text("body").notNull().default(""),
    coverImage: text("cover_image").notNull().default(""),
    author: text("author").notNull().default("The Fit Muslim"),
    readMinutes: integer("read_minutes").notNull().default(5),
    published: integer("published", { mode: "boolean" }).notNull().default(false),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("journal_slug_unique").on(t.slug)],
);

export const reviews = sqliteTable("reviews", {
  id: id(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  authorName: text("author_name").notNull(),
  rating: integer("rating").notNull(),
  title: text("title").notNull().default(""),
  body: text("body").notNull().default(""),
  /** true when the author has a paid order containing this product */
  verifiedPurchase: integer("verified_purchase", { mode: "boolean" }).notNull().default(false),
  approved: integer("approved", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
});

/* ------------------------------------------------------------------ cart */

export const carts = sqliteTable("carts", {
  id: id(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: createdAt(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const cartItems = sqliteTable("cart_items", {
  id: id(),
  cartId: text("cart_id")
    .notNull()
    .references(() => carts.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  qty: integer("qty").notNull().default(1),
  createdAt: createdAt(),
});

/* ---------------------------------------------------------------- orders */

export type OrderStatus = "pending" | "paid" | "fulfilled" | "cancelled" | "refunded";

export type Address = {
  line1?: string;
  line2?: string;
  city?: string;
  postalCode?: string;
  country?: string;
};

export const orders = sqliteTable(
  "orders",
  {
    id: id(),
    /** human-facing reference, e.g. TFM-8F3K2Q */
    orderNumber: text("order_number").notNull(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    email: text("email").notNull(),
    status: text("status").notNull().$type<OrderStatus>().default("pending"),
    subtotalCents: integer("subtotal_cents").notNull(),
    shippingCents: integer("shipping_cents").notNull().default(0),
    taxCents: integer("tax_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull(),
    currency: text("currency").notNull().default("USD"),
    stripeSessionId: text("stripe_session_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    shippingName: text("shipping_name"),
    shippingAddress: text("shipping_address", { mode: "json" }).$type<Address | null>(),
    trackingNumber: text("tracking_number"),
    createdAt: createdAt(),
    paidAt: integer("paid_at", { mode: "timestamp" }),
    fulfilledAt: integer("fulfilled_at", { mode: "timestamp" }),
  },
  (t) => [uniqueIndex("orders_number_unique").on(t.orderNumber)],
);

export const orderItems = sqliteTable("order_items", {
  id: id(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
  /** name/price are snapshotted so historic orders never change */
  name: text("name").notNull(),
  subtitle: text("subtitle").notNull().default(""),
  image: text("image").notNull().default(""),
  kind: text("kind").notNull().$type<ProductKind>().default("physical"),
  downloadPath: text("download_path"),
  unitPriceCents: integer("unit_price_cents").notNull(),
  qty: integer("qty").notNull(),
});

/* ------------------------------------------------- diet plans (feature 2) */

export type IntakeStatus = "submitted" | "in_review" | "changes_requested" | "approved";
export type PlanStatus = "draft" | "approved" | "delivered";

export const planIntakes = sqliteTable("plan_intakes", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().$type<IntakeStatus>().default("submitted"),
  goal: text("goal").notNull().$type<"lose" | "maintain" | "gain">(),
  sex: text("sex").notNull().$type<"male" | "female">(),
  age: integer("age").notNull(),
  heightCm: real("height_cm").notNull(),
  weightKg: real("weight_kg").notNull(),
  targetWeightKg: real("target_weight_kg"),
  activityLevel: text("activity_level")
    .notNull()
    .$type<"sedentary" | "light" | "moderate" | "active" | "athlete">(),
  trainingDaysPerWeek: integer("training_days_per_week").notNull().default(3),
  dietaryStyle: text("dietary_style").notNull().default("balanced"),
  allergies: text("allergies", { mode: "json" }).$type<string[]>().notNull().$defaultFn(() => []),
  avoid: text("avoid", { mode: "json" }).$type<string[]>().notNull().$defaultFn(() => []),
  medical: text("medical").notNull().default(""),
  /** prayer-aware scheduling inputs */
  city: text("city"),
  country: text("country"),
  timezone: text("timezone"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  ramadanMode: integer("ramadan_mode", { mode: "boolean" }).notNull().default(false),
  fastsMondayThursday: integer("fasts_mon_thu", { mode: "boolean" }).notNull().default(false),
  notes: text("notes").notNull().default(""),
  createdAt: createdAt(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type PlanMeal = {
  name: string;
  /** local time label, anchored to prayer times where relevant */
  time: string;
  anchor?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  items: string[];
};

export type PlanTrainingDay = {
  day: string;
  focus: string;
  window: string;
  blocks: string[];
};

export const plans = sqliteTable("plans", {
  id: id(),
  intakeId: text("intake_id")
    .notNull()
    .references(() => planIntakes.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  version: integer("version").notNull().default(1),
  status: text("status").notNull().$type<PlanStatus>().default("draft"),
  title: text("title").notNull(),
  summary: text("summary").notNull().default(""),
  bmr: integer("bmr").notNull(),
  tdee: integer("tdee").notNull(),
  targetCalories: integer("target_calories").notNull(),
  proteinGrams: integer("protein_grams").notNull(),
  carbGrams: integer("carb_grams").notNull(),
  fatGrams: integer("fat_grams").notNull(),
  hydrationLitres: real("hydration_litres").notNull().default(2.5),
  meals: text("meals", { mode: "json" }).$type<PlanMeal[]>().notNull().$defaultFn(() => []),
  training: text("training", { mode: "json" }).$type<PlanTrainingDay[]>().notNull().$defaultFn(() => []),
  guidance: text("guidance", { mode: "json" }).$type<string[]>().notNull().$defaultFn(() => []),
  coachNotes: text("coach_notes").notNull().default(""),
  generatedBy: text("generated_by").notNull().default("engine"),
  approvedBy: text("approved_by").references(() => users.id, { onDelete: "set null" }),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  deliveredAt: integer("delivered_at", { mode: "timestamp" }),
  createdAt: createdAt(),
});

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "cancelled";

export const subscriptions = sqliteTable("subscriptions", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  interval: text("interval").notNull().$type<"month" | "year">().default("month"),
  status: text("status").notNull().$type<SubscriptionStatus>().default("active"),
  priceCents: integer("price_cents").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeCustomerId: text("stripe_customer_id"),
  currentPeriodEnd: integer("current_period_end", { mode: "timestamp" }),
  cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
});

/* -------------------------------------------------- progress (feature 3) */

export const progressLogs = sqliteTable("progress_logs", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  /** ISO date (yyyy-mm-dd) — one entry per day per user, enforced in code */
  loggedOn: text("logged_on").notNull(),
  weightKg: real("weight_kg"),
  waistCm: real("waist_cm"),
  workouts: integer("workouts").notNull().default(0),
  prayersOnTime: integer("prayers_on_time").notNull().default(0),
  fasted: integer("fasted", { mode: "boolean" }).notNull().default(false),
  notes: text("notes").notNull().default(""),
  createdAt: createdAt(),
});

/** Every outbound email, whatever the transport — auditable in dev too. */
export const emailLog = sqliteTable("email_log", {
  id: id(),
  to: text("to").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  provider: text("provider").notNull().default("console"),
  createdAt: createdAt(),
});

export const newsletterSubscribers = sqliteTable(
  "newsletter_subscribers",
  {
    id: id(),
    email: text("email").notNull(),
    source: text("source").notNull().default("footer"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("newsletter_email_unique").on(t.email)],
);

/* --------------------------------------------------- admin & governance */

/**
 * Staff accounts are never self-serve. An existing admin issues an invite and
 * the recipient opens a one-time link — there is no public admin sign-up.
 */
export const adminInvites = sqliteTable(
  "admin_invites",
  {
    id: id(),
    email: text("email").notNull(),
    role: text("role").notNull().$type<Exclude<UserRole, "customer">>().default("coach"),
    /** sha256 of the link token; the raw token only ever exists in the URL */
    tokenHash: text("token_hash").notNull(),
    invitedBy: text("invited_by").references(() => users.id, { onDelete: "set null" }),
    note: text("note").notNull().default(""),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    acceptedAt: integer("accepted_at", { mode: "timestamp" }),
    acceptedBy: text("accepted_by").references(() => users.id, { onDelete: "set null" }),
    revokedAt: integer("revoked_at", { mode: "timestamp" }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("admin_invites_token_unique").on(t.tokenHash)],
);

/** Every state-changing action a staff member takes, for accountability. */
export const auditLog = sqliteTable("audit_log", {
  id: id(),
  actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
  /** snapshotted so the trail survives the account being deleted */
  actorEmail: text("actor_email").notNull().default(""),
  actorName: text("actor_name").notNull().default(""),
  action: text("action").notNull(),
  entity: text("entity").notNull().default(""),
  entityId: text("entity_id"),
  summary: text("summary").notNull().default(""),
  meta: text("meta", { mode: "json" }).$type<Record<string, unknown>>(),
  ip: text("ip"),
  createdAt: createdAt(),
});

/** Failed sign-in attempts, used to throttle credential stuffing. */
export const loginAttempts = sqliteTable("login_attempts", {
  id: id(),
  /** lowercased email, or `ip:1.2.3.4` — whichever bucket is being counted */
  identifier: text("identifier").notNull(),
  scope: text("scope").notNull().$type<SessionScope>().default("site"),
  successful: integer("successful", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
});

/* ----------------------------------------------------------- relations */

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  plans: many(plans),
  intakes: many(planIntakes),
  progress: many(progressLogs),
  subscriptions: many(subscriptions),
}));

export const productsRelations = relations(products, ({ many }) => ({
  reviews: many(reviews),
}));

export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  user: one(users, { fields: [orders.userId], references: [users.id] }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const cartsRelations = relations(carts, ({ many }) => ({
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  product: one(products, { fields: [cartItems.productId], references: [products.id] }),
}));

export const plansRelations = relations(plans, ({ one }) => ({
  intake: one(planIntakes, { fields: [plans.intakeId], references: [planIntakes.id] }),
  user: one(users, { fields: [plans.userId], references: [users.id] }),
}));

export const planIntakesRelations = relations(planIntakes, ({ one, many }) => ({
  user: one(users, { fields: [planIntakes.userId], references: [users.id] }),
  plans: many(plans),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, { fields: [reviews.productId], references: [products.id] }),
}));

/* ------------------------------------------------------------- row types */

export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type JournalPost = typeof journalPosts.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type PlanIntake = typeof planIntakes.$inferSelect;
export type Plan = typeof plans.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type ProgressLog = typeof progressLogs.$inferSelect;
export type AdminInvite = typeof adminInvites.$inferSelect;
export type AuditEntry = typeof auditLog.$inferSelect;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;

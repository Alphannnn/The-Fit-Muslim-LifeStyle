"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  journalPosts,
  orders,
  planIntakes,
  plans,
  products,
  reviews,
  users,
  type OrderStatus,
} from "@/lib/db/schema";
import { assertAdmin } from "@/lib/admin/auth";
import { record } from "@/lib/admin/audit";
import { slugify } from "@/lib/ids";
import { readingMinutes } from "@/lib/markdown";
import { planReadyMail, sendMail } from "@/lib/mail";
import { siteOrigin } from "@/lib/site";

/**
 * Every action in this file goes through here first. Note this is the *admin*
 * session, not the storefront one — being signed in as a customer, whatever
 * the account's role, grants nothing here.
 */
const requireStaff = assertAdmin;

export type AdminState = { error?: string; ok?: boolean };

/* ------------------------------------------------------- plan review */

const planEditSchema = z.object({
  planId: z.string().min(1),
  title: z.string().trim().min(3).max(120),
  summary: z.string().trim().max(600).default(""),
  targetCalories: z.coerce.number().int().min(1000).max(6000),
  proteinGrams: z.coerce.number().int().min(40).max(400),
  carbGrams: z.coerce.number().int().min(0).max(900),
  fatGrams: z.coerce.number().int().min(20).max(300),
  coachNotes: z.string().trim().max(1200).default(""),
});

/**
 * A coach's edits and approval in one step — the plan is delivered to the
 * customer and they are emailed. This is the only path by which a plan
 * becomes visible to them.
 */
export async function approvePlanAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const staff = await requireStaff();

  const parsed = planEditSchema.safeParse({
    planId: formData.get("planId"),
    title: formData.get("title"),
    summary: formData.get("summary") ?? "",
    targetCalories: formData.get("targetCalories"),
    proteinGrams: formData.get("proteinGrams"),
    carbGrams: formData.get("carbGrams"),
    fatGrams: formData.get("fatGrams"),
    coachNotes: formData.get("coachNotes") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the plan fields." };
  }

  const plan = await db.select().from(plans).where(eq(plans.id, parsed.data.planId)).get();
  if (!plan) return { error: "That plan no longer exists." };

  const now = new Date();
  await db
    .update(plans)
    .set({
      title: parsed.data.title,
      summary: parsed.data.summary,
      targetCalories: parsed.data.targetCalories,
      proteinGrams: parsed.data.proteinGrams,
      carbGrams: parsed.data.carbGrams,
      fatGrams: parsed.data.fatGrams,
      coachNotes: parsed.data.coachNotes,
      status: "delivered",
      approvedBy: staff.id,
      approvedAt: now,
      deliveredAt: now,
    })
    .where(eq(plans.id, plan.id));

  await db
    .update(planIntakes)
    .set({ status: "approved", updatedAt: now })
    .where(eq(planIntakes.id, plan.intakeId));

  const customer = await db.select().from(users).where(eq(users.id, plan.userId)).get();
  if (customer) {
    await sendMail(
      planReadyMail({
        to: customer.email,
        name: customer.name,
        planTitle: parsed.data.title,
        planUrl: `${siteOrigin()}/account/plans/${plan.id}`,
        coachNote: parsed.data.coachNotes || undefined,
      }),
    );
  }

  await record({
    actor: staff,
    action: "plan.approved",
    entity: "plan",
    entityId: plan.id,
    summary: `Approved and delivered "${parsed.data.title}" to ${customer?.name ?? "a customer"}`,
    meta: { calories: parsed.data.targetCalories, protein: parsed.data.proteinGrams },
  });

  revalidatePath("/admin/plans");
  redirect("/admin/plans?approved=1");
}

export async function claimPlanAction(planId: string) {
  await requireStaff();
  const plan = await db.select().from(plans).where(eq(plans.id, planId)).get();
  if (!plan) return;
  await db
    .update(planIntakes)
    .set({ status: "in_review", updatedAt: new Date() })
    .where(eq(planIntakes.id, plan.intakeId));
  revalidatePath("/admin/plans");
}

/* ---------------------------------------------------------- products */

const lines = z
  .string()
  .default("")
  .transform((v) =>
    v
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
  );

const csv = z
  .string()
  .default("")
  .transform((v) =>
    v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );

/** Prices are entered as "44.95" and stored as 4495. */
const priceToCents = z
  .string()
  .trim()
  .transform((v) => Math.round(Number(v) * 100))
  .refine((v) => Number.isFinite(v) && v >= 0, "Enter a valid price.");

const productSchema = z.object({
  id: z.string().default(""),
  name: z.string().trim().min(2).max(80),
  subtitle: z.string().trim().max(80).default(""),
  slug: z.string().trim().max(80).default(""),
  tagline: z.string().trim().max(200).default(""),
  description: z.string().trim().max(8000).default(""),
  kind: z.enum(["physical", "digital", "subscription"]),
  price: priceToCents,
  compareAt: z
    .string()
    .trim()
    .default("")
    .transform((v) => (v === "" ? null : Math.round(Number(v) * 100))),
  currency: z.string().trim().length(3).default("USD"),
  image: z.string().trim().min(1, "An image path or URL is required.").max(400),
  video: z.string().trim().max(400).default(""),
  videoPoster: z.string().trim().max(400).default(""),
  stock: z
    .string()
    .trim()
    .default("")
    .transform((v) => (v === "" ? null : Math.max(0, Math.trunc(Number(v))))),
  downloadPath: z.string().trim().max(400).default(""),
  active: z.coerce.boolean().default(false),
  featured: z.coerce.boolean().default(false),
  position: z.coerce.number().int().min(0).max(999).default(0),
  collections: csv,
  pillars: csv,
  specsRaw: lines,
  halalStatus: z.enum(["certified", "verified-ingredients", "not-applicable"]),
  halalAuthority: z.string().trim().max(120).default(""),
  halalCertRef: z.string().trim().max(80).default(""),
  ingredients: lines,
  allergens: csv,
});

export async function saveProductAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const actor = await requireStaff();

  const parsed = productSchema.safeParse({
    id: formData.get("id") ?? "",
    name: formData.get("name"),
    subtitle: formData.get("subtitle") ?? "",
    slug: formData.get("slug") ?? "",
    tagline: formData.get("tagline") ?? "",
    description: formData.get("description") ?? "",
    kind: formData.get("kind"),
    price: formData.get("price"),
    compareAt: formData.get("compareAt") ?? "",
    currency: formData.get("currency") ?? "USD",
    image: formData.get("image"),
    video: formData.get("video") ?? "",
    videoPoster: formData.get("videoPoster") ?? "",
    stock: formData.get("stock") ?? "",
    downloadPath: formData.get("downloadPath") ?? "",
    active: formData.get("active") === "on",
    featured: formData.get("featured") === "on",
    position: formData.get("position") ?? 0,
    collections: formData.get("collections") ?? "",
    pillars: formData.get("pillars") ?? "",
    specsRaw: formData.get("specs") ?? "",
    halalStatus: formData.get("halalStatus"),
    halalAuthority: formData.get("halalAuthority") ?? "",
    halalCertRef: formData.get("halalCertRef") ?? "",
    ingredients: formData.get("ingredients") ?? "",
    allergens: formData.get("allergens") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the product fields." };
  }
  const d = parsed.data;

  /* "Pages: 120, full colour" → { k: "Pages", v: "120, full colour" } */
  const specs = d.specsRaw
    .map((line) => {
      const [k, ...rest] = line.split(":");
      return { k: k.trim(), v: rest.join(":").trim() };
    })
    .filter((s) => s.k && s.v);

  const row = {
    name: d.name,
    subtitle: d.subtitle,
    slug: d.slug ? slugify(d.slug) : slugify(`${d.name} ${d.subtitle}`),
    tagline: d.tagline,
    description: d.description,
    kind: d.kind,
    priceCents: d.price,
    compareAtCents: d.compareAt,
    currency: d.currency.toUpperCase(),
    image: d.image,
    video: d.video || null,
    videoPoster: d.videoPoster || null,
    /* digital goods and subscriptions are never stock-tracked */
    stock: d.kind === "physical" ? (d.stock ?? 0) : null,
    downloadPath: d.downloadPath || null,
    active: d.active,
    featured: d.featured,
    position: d.position,
    collections: d.collections,
    pillars: d.pillars,
    specs,
    halalStatus: d.halalStatus,
    halalAuthority: d.halalAuthority || null,
    halalCertRef: d.halalCertRef || null,
    ingredients: d.ingredients,
    allergens: d.allergens,
  };

  if (d.id) {
    await db.update(products).set(row).where(eq(products.id, d.id));
    await record({
      actor,
      action: "product.updated",
      entity: "product",
      entityId: d.id,
      summary: `Updated product "${row.name}"`,
    });
  } else {
    const clash = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, row.slug))
      .get();
    if (clash) return { error: `The slug "${row.slug}" is already taken.` };
    const [created] = await db.insert(products).values(row).returning();
    await record({
      actor,
      action: "product.created",
      entity: "product",
      entityId: created.id,
      summary: `Created product "${row.name}"`,
    });
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath(`/product/${row.slug}`);
  revalidatePath("/");
  redirect("/admin/products?saved=1");
}

export async function toggleProductActiveAction(id: string) {
  const actor = await requireStaff();
  const product = await db.select().from(products).where(eq(products.id, id)).get();
  if (!product) return;
  await db.update(products).set({ active: !product.active }).where(eq(products.id, id));
  await record({
    actor,
    action: "product.visibility",
    entity: "product",
    entityId: id,
    summary: `${product.active ? "Hid" : "Published"} "${product.name}"`,
  });
  revalidatePath("/admin/products");
  revalidatePath("/shop");
}

/* ----------------------------------------------------------- journal */

const postSchema = z.object({
  id: z.string().default(""),
  title: z.string().trim().min(4).max(160),
  slug: z.string().trim().max(120).default(""),
  category: z.string().trim().min(2).max(40),
  excerpt: z.string().trim().max(400).default(""),
  body: z.string().trim().min(20, "The body needs a little more than that.").max(40_000),
  coverImage: z.string().trim().max(400).default(""),
  author: z.string().trim().max(80).default("The Fit Muslim"),
  published: z.coerce.boolean().default(false),
});

export async function savePostAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const actor = await requireStaff();

  const parsed = postSchema.safeParse({
    id: formData.get("id") ?? "",
    title: formData.get("title"),
    slug: formData.get("slug") ?? "",
    category: formData.get("category"),
    excerpt: formData.get("excerpt") ?? "",
    body: formData.get("body"),
    coverImage: formData.get("coverImage") ?? "",
    author: formData.get("author") ?? "The Fit Muslim",
    published: formData.get("published") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the post fields." };
  }
  const d = parsed.data;

  const existing = d.id
    ? await db.select().from(journalPosts).where(eq(journalPosts.id, d.id)).get()
    : null;

  const row = {
    title: d.title,
    slug: d.slug ? slugify(d.slug) : slugify(d.title),
    category: d.category,
    excerpt: d.excerpt,
    body: d.body,
    coverImage: d.coverImage,
    author: d.author,
    readMinutes: readingMinutes(d.body),
    published: d.published,
    /* stamp the publish date the first time it goes live, then leave it alone */
    publishedAt: d.published ? (existing?.publishedAt ?? new Date()) : null,
  };

  if (existing) {
    await db.update(journalPosts).set(row).where(eq(journalPosts.id, existing.id));
    await record({
      actor,
      action: "post.updated",
      entity: "post",
      entityId: existing.id,
      summary: `${row.published ? "Published" : "Saved draft of"} "${row.title}"`,
    });
  } else {
    const clash = await db
      .select({ id: journalPosts.id })
      .from(journalPosts)
      .where(eq(journalPosts.slug, row.slug))
      .get();
    if (clash) return { error: `The slug "${row.slug}" is already taken.` };
    const [created] = await db.insert(journalPosts).values(row).returning();
    await record({
      actor,
      action: "post.created",
      entity: "post",
      entityId: created.id,
      summary: `Created post "${row.title}"`,
    });
  }

  revalidatePath("/admin/journal");
  revalidatePath("/journal");
  revalidatePath(`/journal/${row.slug}`);
  redirect("/admin/journal?saved=1");
}

/* ------------------------------------------------------------ orders */

export async function updateOrderAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const actor = await requireStaff();

  const id = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;
  const tracking = String(formData.get("trackingNumber") ?? "").trim();

  const allowed: OrderStatus[] = ["pending", "paid", "fulfilled", "cancelled", "refunded"];
  if (!id || !allowed.includes(status)) return { error: "Unknown order or status." };

  await db
    .update(orders)
    .set({
      status,
      trackingNumber: tracking || null,
      fulfilledAt: status === "fulfilled" ? new Date() : null,
    })
    .where(eq(orders.id, id));

  const order = await db.select().from(orders).where(eq(orders.id, id)).get();
  await record({
    actor,
    action: "order.updated",
    entity: "order",
    entityId: id,
    summary: `Order ${order?.orderNumber ?? id} marked ${status}${tracking ? ` · tracking ${tracking}` : ""}`,
    meta: { status, tracking: tracking || null },
  });

  revalidatePath("/admin/orders");
  return { ok: true };
}

/* ----------------------------------------------------------- reviews */

export async function moderateReviewAction(id: string, approve: boolean) {
  const actor = await requireStaff();
  const review = await db.select().from(reviews).where(eq(reviews.id, id)).get();
  if (!review) return;

  if (approve) {
    await db.update(reviews).set({ approved: true }).where(eq(reviews.id, id));
  } else {
    await db.delete(reviews).where(eq(reviews.id, id));
  }

  await record({
    actor,
    action: approve ? "review.approved" : "review.deleted",
    entity: "review",
    entityId: id,
    summary: `${approve ? "Approved" : "Removed"} a ${review.rating}-star review by ${review.authorName}`,
  });

  const product = await db
    .select({ slug: products.slug })
    .from(products)
    .where(eq(products.id, review.productId))
    .get();

  revalidatePath("/admin/reviews");
  if (product) revalidatePath(`/product/${product.slug}`);
}

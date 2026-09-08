import { and, avg, count, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { journalPosts, products, reviews, type Product } from "@/lib/db/schema";

export type Rating = { average: number; count: number };
export type ProductWithRating = Product & { rating: Rating | null };

/** Approved-review aggregates for a set of products, in one query. */
export async function getRatings(productIds: string[]): Promise<Map<string, Rating>> {
  if (productIds.length === 0) return new Map();
  const rows = await db
    .select({
      productId: reviews.productId,
      average: avg(reviews.rating),
      total: count(reviews.id),
    })
    .from(reviews)
    .where(and(eq(reviews.approved, true), inArray(reviews.productId, productIds)))
    .groupBy(reviews.productId)
    .all();

  return new Map(
    rows.map((r) => [
      r.productId,
      { average: Math.round(Number(r.average ?? 0) * 10) / 10, count: Number(r.total) },
    ]),
  );
}

async function withRatings(rows: Product[]): Promise<ProductWithRating[]> {
  const ratings = await getRatings(rows.map((r) => r.id));
  return rows.map((r) => ({ ...r, rating: ratings.get(r.id) ?? null }));
}

export async function getProducts(options: { collection?: string; limit?: number } = {}) {
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.active, true))
    .orderBy(products.position, products.name)
    .all();

  const filtered = options.collection
    ? rows.filter((r) => r.collections.includes(options.collection!))
    : rows;

  return withRatings(options.limit ? filtered.slice(0, options.limit) : filtered);
}

export async function getFeaturedProducts(limit = 4) {
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.active, true), eq(products.featured, true)))
    .orderBy(products.position)
    .limit(limit)
    .all();
  return withRatings(rows);
}

/** The hero product for the landing page. */
export async function getHeadlineProduct() {
  const row = await db
    .select()
    .from(products)
    .where(eq(products.slug, "my-muslim-hero-daily-planner"))
    .get();
  if (!row) return null;
  const [withRating] = await withRatings([row]);
  return withRating;
}

export async function getProductBySlug(slug: string) {
  const row = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.active, true)))
    .get();
  if (!row) return null;
  const [withRating] = await withRatings([row]);
  return withRating;
}

export async function getProductReviews(productId: string) {
  return db
    .select()
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.approved, true)))
    .orderBy(desc(reviews.createdAt))
    .all();
}

/** Every distinct collection slug in use, for shop filtering. */
export async function getCollections() {
  const rows = await db
    .select({ collections: products.collections })
    .from(products)
    .where(eq(products.active, true))
    .all();
  const seen = new Set<string>();
  for (const r of rows) for (const c of r.collections) seen.add(c);
  return [...seen].sort();
}

/* --------------------------------------------------------------- journal */

export async function getPosts(limit?: number) {
  const q = db
    .select()
    .from(journalPosts)
    .where(eq(journalPosts.published, true))
    .orderBy(desc(journalPosts.publishedAt));
  return limit ? q.limit(limit).all() : q.all();
}

export async function getPostBySlug(slug: string) {
  return (
    db
      .select()
      .from(journalPosts)
      .where(and(eq(journalPosts.slug, slug), eq(journalPosts.published, true)))
      .get() ?? null
  );
}

export async function getRelatedPosts(slug: string, category: string, limit = 2) {
  const rows = await db
    .select()
    .from(journalPosts)
    .where(
      and(
        eq(journalPosts.published, true),
        eq(journalPosts.category, category),
        sql`${journalPosts.slug} <> ${slug}`,
      ),
    )
    .limit(limit)
    .all();

  if (rows.length >= limit) return rows;
  /* top up with anything recent so the section never looks broken */
  const fill = await db
    .select()
    .from(journalPosts)
    .where(and(eq(journalPosts.published, true), sql`${journalPosts.slug} <> ${slug}`))
    .orderBy(desc(journalPosts.publishedAt))
    .limit(limit + rows.length)
    .all();

  const merged = [...rows];
  for (const p of fill) {
    if (merged.length >= limit) break;
    if (!merged.some((m) => m.id === p.id)) merged.push(p);
  }
  return merged;
}

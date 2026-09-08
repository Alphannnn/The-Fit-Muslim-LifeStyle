import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { journalPosts, products } from "@/lib/db/schema";
import { siteOrigin } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();

  const [productRows, postRows] = await Promise.all([
    db
      .select({ slug: products.slug, createdAt: products.createdAt })
      .from(products)
      .where(eq(products.active, true))
      .all(),
    db
      .select({
        slug: journalPosts.slug,
        publishedAt: journalPosts.publishedAt,
        createdAt: journalPosts.createdAt,
      })
      .from(journalPosts)
      .where(eq(journalPosts.published, true))
      .all(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: origin, changeFrequency: "weekly", priority: 1 },
    { url: `${origin}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${origin}/plan`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${origin}/journal`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${origin}/prayer-times`, changeFrequency: "daily", priority: 0.7 },
    { url: `${origin}/login`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${origin}/signup`, changeFrequency: "yearly", priority: 0.3 },
  ];

  return [
    ...staticRoutes,
    ...productRows.map((p) => ({
      url: `${origin}/product/${p.slug}`,
      lastModified: p.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...postRows.map((p) => ({
      url: `${origin}/journal/${p.slug}`,
      lastModified: p.publishedAt ?? p.createdAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}

"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { orderItems, orders, products, reviews } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

const schema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).default(""),
  body: z.string().trim().min(10, "Tell us a little more — at least 10 characters.").max(2000),
});

export type ReviewState = { error?: string; ok?: boolean };

/** Has this user actually paid for this product? Drives the verified badge. */
async function hasPurchased(userId: string, productId: string) {
  const paid = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.userId, userId), inArray(orders.status, ["paid", "fulfilled"])))
    .all();
  if (paid.length === 0) return false;

  const match = await db
    .select({ id: orderItems.id })
    .from(orderItems)
    .where(
      and(
        eq(orderItems.productId, productId),
        inArray(
          orderItems.orderId,
          paid.map((o) => o.id),
        ),
      ),
    )
    .get();

  return Boolean(match);
}

export async function submitReviewAction(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in to leave a review." };

  const parsed = schema.safeParse({
    productId: formData.get("productId"),
    rating: formData.get("rating"),
    title: formData.get("title") ?? "",
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const product = await db
    .select({ id: products.id, slug: products.slug })
    .from(products)
    .where(eq(products.id, parsed.data.productId))
    .get();
  if (!product) return { error: "That product no longer exists." };

  const existing = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.productId, product.id), eq(reviews.userId, user.id)))
    .get();
  if (existing) return { error: "You've already reviewed this product." };

  const verified = await hasPurchased(user.id, product.id);

  /* Verified buyers publish immediately; everyone else waits for moderation. */
  await db.insert(reviews).values({
    productId: product.id,
    userId: user.id,
    authorName: user.name,
    rating: parsed.data.rating,
    title: parsed.data.title,
    body: parsed.data.body,
    verifiedPurchase: verified,
    approved: verified,
  });

  revalidatePath(`/product/${product.slug}`);

  return {
    ok: true,
    error: verified
      ? undefined
      : "Thank you — your review is with our team and will appear once approved.",
  };
}

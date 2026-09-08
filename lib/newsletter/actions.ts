"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/db/schema";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("That doesn't look like an email address."),
  source: z.string().trim().max(40).default("footer"),
});

export type NewsletterState = { ok?: boolean; message?: string };

export async function subscribeAction(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    source: formData.get("source") ?? "footer",
  });
  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Please check your email address." };
  }

  /* Re-subscribing is not an error worth showing anyone. */
  await db
    .insert(newsletterSubscribers)
    .values(parsed.data)
    .onConflictDoNothing({ target: newsletterSubscribers.email });

  return { ok: true, message: "You're in. Guidance lands weekly, and nothing else." };
}

"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { progressLogs } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

const optionalNumber = (min: number, max: number) =>
  z
    .union([z.coerce.number().min(min).max(max), z.literal("")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : Number(v)));

const schema = z.object({
  loggedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date."),
  weightKg: optionalNumber(35, 300),
  waistCm: optionalNumber(40, 200),
  workouts: z.coerce.number().int().min(0).max(3).default(0),
  prayersOnTime: z.coerce.number().int().min(0).max(5).default(0),
  fasted: z.coerce.boolean().default(false),
  notes: z.string().trim().max(500).default(""),
});

export type ProgressState = { error?: string; ok?: boolean };

export async function logProgressAction(
  _prev: ProgressState,
  formData: FormData,
): Promise<ProgressState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in first." };

  const parsed = schema.safeParse({
    loggedOn: formData.get("loggedOn"),
    weightKg: formData.get("weightKg") ?? "",
    waistCm: formData.get("waistCm") ?? "",
    workouts: formData.get("workouts") ?? 0,
    prayersOnTime: formData.get("prayersOnTime") ?? 0,
    fasted: formData.get("fasted") === "on",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  /* One entry per day: logging the same date again updates it. */
  const existing = await db
    .select({ id: progressLogs.id })
    .from(progressLogs)
    .where(and(eq(progressLogs.userId, user.id), eq(progressLogs.loggedOn, parsed.data.loggedOn)))
    .get();

  if (existing) {
    await db.update(progressLogs).set(parsed.data).where(eq(progressLogs.id, existing.id));
  } else {
    await db.insert(progressLogs).values({ ...parsed.data, userId: user.id });
  }

  revalidatePath("/account/progress");
  revalidatePath("/account");

  return { ok: true };
}

export async function deleteProgressAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return;
  await db
    .delete(progressLogs)
    .where(and(eq(progressLogs.id, id), eq(progressLogs.userId, user.id)));
  revalidatePath("/account/progress");
}

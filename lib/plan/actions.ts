"use server";

import { redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { planIntakes, plans, users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { intakeReceivedMail, sendMail } from "@/lib/mail";
import { findCity } from "@/lib/prayer/locations";
import { generatePlan } from "./generate";

export type IntakeState = { error?: string; needsAccount?: boolean };

/** "peanuts, shellfish" → ["peanuts", "shellfish"] */
const list = z
  .string()
  .default("")
  .transform((value) =>
    value
      .split(/[,\n]/)
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 20),
  );

const schema = z.object({
  goal: z.enum(["lose", "maintain", "gain"]),
  sex: z.enum(["male", "female"]),
  age: z.coerce.number().int().min(14, "This plan is for ages 14 and over.").max(90),
  heightCm: z.coerce.number().min(120).max(230),
  weightKg: z.coerce.number().min(35).max(300),
  targetWeightKg: z
    .union([z.coerce.number().min(35).max(300), z.literal("")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : Number(v))),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "athlete"]),
  trainingDaysPerWeek: z.coerce.number().int().min(2).max(5),
  dietaryStyle: z.enum(["balanced", "high-protein", "vegetarian", "vegan", "mediterranean"]),
  allergies: list,
  avoid: list,
  medical: z.string().trim().max(1000).default(""),
  citySlug: z.string().trim().max(60).default(""),
  ramadanMode: z.coerce.boolean().default(false),
  fastsMondayThursday: z.coerce.boolean().default(false),
  notes: z.string().trim().max(1000).default(""),
});

export async function submitIntakeAction(
  _prev: IntakeState,
  formData: FormData,
): Promise<IntakeState> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      needsAccount: true,
      error: "Create an account (or sign in) and your answers will be saved to it.",
    };
  }

  const parsed = schema.safeParse({
    goal: formData.get("goal"),
    sex: formData.get("sex"),
    age: formData.get("age"),
    heightCm: formData.get("heightCm"),
    weightKg: formData.get("weightKg"),
    targetWeightKg: formData.get("targetWeightKg") ?? "",
    activityLevel: formData.get("activityLevel"),
    trainingDaysPerWeek: formData.get("trainingDaysPerWeek"),
    dietaryStyle: formData.get("dietaryStyle"),
    allergies: formData.get("allergies") ?? "",
    avoid: formData.get("avoid") ?? "",
    medical: formData.get("medical") ?? "",
    citySlug: formData.get("citySlug") ?? "",
    ramadanMode: formData.get("ramadanMode") === "on",
    fastsMondayThursday: formData.get("fastsMondayThursday") === "on",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your answers." };
  }

  const city = findCity(parsed.data.citySlug);

  const [intake] = await db
    .insert(planIntakes)
    .values({
      userId: user.id,
      status: "submitted",
      goal: parsed.data.goal,
      sex: parsed.data.sex,
      age: parsed.data.age,
      heightCm: parsed.data.heightCm,
      weightKg: parsed.data.weightKg,
      targetWeightKg: parsed.data.targetWeightKg,
      activityLevel: parsed.data.activityLevel,
      trainingDaysPerWeek: parsed.data.trainingDaysPerWeek,
      dietaryStyle: parsed.data.dietaryStyle,
      allergies: parsed.data.allergies,
      avoid: parsed.data.avoid,
      medical: parsed.data.medical,
      city: city?.name ?? user.city ?? null,
      country: city?.country ?? user.country ?? null,
      timezone: city?.timezone ?? user.timezone ?? null,
      latitude: city?.latitude ?? user.latitude ?? null,
      longitude: city?.longitude ?? user.longitude ?? null,
      ramadanMode: parsed.data.ramadanMode,
      fastsMondayThursday: parsed.data.fastsMondayThursday,
      notes: parsed.data.notes,
    })
    .returning();

  /* Remember the location so later plans and the dashboard don't have to ask. */
  if (city) {
    await db
      .update(users)
      .set({
        city: city.name,
        country: city.country,
        timezone: city.timezone,
        latitude: city.latitude,
        longitude: city.longitude,
      })
      .where(eq(users.id, user.id));
  }

  /* Draft immediately, but never deliver it: a coach approves first. */
  const draft = generatePlan(intake);
  const previous = await db
    .select({ version: plans.version })
    .from(plans)
    .where(eq(plans.userId, user.id))
    .orderBy(desc(plans.version))
    .get();

  await db.insert(plans).values({
    intakeId: intake.id,
    userId: user.id,
    version: (previous?.version ?? 0) + 1,
    status: "draft",
    title: draft.title,
    summary: draft.summary,
    bmr: draft.bmr,
    tdee: draft.tdee,
    targetCalories: draft.targetCalories,
    proteinGrams: draft.proteinGrams,
    carbGrams: draft.carbGrams,
    fatGrams: draft.fatGrams,
    hydrationLitres: draft.hydrationLitres,
    meals: draft.meals,
    training: draft.training,
    guidance: draft.guidance,
    generatedBy: "engine",
  });

  await sendMail(intakeReceivedMail({ to: user.email, name: user.name }));

  redirect("/account/plans?submitted=1");
}

/** Regenerates the draft from the same intake — used after a coach edit. */
export async function regenerateDraftAction(planId: string) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "coach")) {
    throw new Error("Not authorised.");
  }

  const plan = await db.select().from(plans).where(eq(plans.id, planId)).get();
  if (!plan || plan.status === "delivered") return;

  const intake = await db
    .select()
    .from(planIntakes)
    .where(eq(planIntakes.id, plan.intakeId))
    .get();
  if (!intake) return;

  const draft = generatePlan(intake);
  await db
    .update(plans)
    .set({
      title: draft.title,
      summary: draft.summary,
      bmr: draft.bmr,
      tdee: draft.tdee,
      targetCalories: draft.targetCalories,
      proteinGrams: draft.proteinGrams,
      carbGrams: draft.carbGrams,
      fatGrams: draft.fatGrams,
      hydrationLitres: draft.hydrationLitres,
      meals: draft.meals,
      training: draft.training,
      guidance: draft.guidance,
    })
    .where(and(eq(plans.id, planId), eq(plans.status, "draft")));
}

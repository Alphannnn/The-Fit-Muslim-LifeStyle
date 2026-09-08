"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { findCity } from "@/lib/prayer/locations";

const schema = z.object({
  name: z.string().trim().min(2, "Please give us a name.").max(80),
  citySlug: z.string().trim().max(60).default(""),
});

export type SettingsState = { error?: string; ok?: boolean };

export async function updateProfileAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in first." };

  const parsed = schema.safeParse({
    name: formData.get("name"),
    citySlug: formData.get("citySlug") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const city = findCity(parsed.data.citySlug);

  await db
    .update(users)
    .set({
      name: parsed.data.name,
      /* Clearing the city is allowed — the prayer bar falls back to the
         browser's timezone guess. */
      city: city?.name ?? null,
      country: city?.country ?? null,
      timezone: city?.timezone ?? null,
      latitude: city?.latitude ?? null,
      longitude: city?.longitude ?? null,
    })
    .where(eq(users.id, user.id));

  revalidatePath("/account/settings");
  revalidatePath("/account");

  return { ok: true };
}

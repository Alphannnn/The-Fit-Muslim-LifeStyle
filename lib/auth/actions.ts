"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession, getCurrentUser } from "@/lib/auth/session";
import { claimCartForUser } from "@/lib/cart/server";

export type AuthState = { error?: string };

const email = z.string().trim().toLowerCase().email("That doesn't look like an email address.");
const password = z.string().min(8, "Use at least 8 characters.").max(200);

const signupSchema = z.object({
  name: z.string().trim().min(2, "Please tell us your name.").max(80),
  email,
  password,
});

const loginSchema = z.object({ email, password: z.string().min(1, "Enter your password.") });

/** Only ever redirect inside our own app. */
function safeNext(raw: FormDataEntryValue | null) {
  const value = typeof raw === "string" ? raw : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/account";
}

export async function signupAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .get();
  if (existing) return { error: "An account with that email already exists — try signing in." };

  const [created] = await db
    .insert(users)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
    })
    .returning();

  await createSession(created.id);
  await claimCartForUser(created.id);

  redirect(safeNext(formData.get("next")));
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };

  const user = await db.select().from(users).where(eq(users.email, parsed.data.email)).get();

  /* Same message either way — an attacker learns nothing about which emails
     have accounts. The hash comparison still runs when the user is missing so
     the timing doesn't give it away either. */
  const stored = user?.passwordHash ?? (await hashPassword("no-such-user"));
  const ok = await verifyPassword(parsed.data.password, stored);
  if (!user || !ok) return { error: "Those details don't match an account." };

  await createSession(user.id);
  await claimCartForUser(user.id);

  redirect(safeNext(formData.get("next")));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

/** Lets statically-rendered pages ask about auth without going dynamic. */
export async function isSignedInAction(): Promise<boolean> {
  return Boolean(await getCurrentUser());
}

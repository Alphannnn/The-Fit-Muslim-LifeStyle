"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { users, type UserRole } from "@/lib/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  assertAdmin,
  assertFullAdmin,
  clearAttempts,
  createAdminSession,
  destroyAdminSession,
  isStaffRole,
  recordAttempt,
  requestContext,
  revokeAdminSessions,
  revokeSession,
  throttleFor,
} from "./auth";
import { record } from "./audit";
import { checkInvite, createInvite, markAccepted, revokeInvite } from "./invites";

export type AdminAuthState = { error?: string; ok?: boolean };

const credentials = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

/** Only ever redirect inside the admin area. */
function safeAdminNext(raw: FormDataEntryValue | null) {
  const value = typeof raw === "string" ? raw : "";
  return value.startsWith("/admin") && !value.startsWith("//") ? value : "/admin";
}

export async function adminLoginAction(
  _prev: AdminAuthState,
  formData: FormData,
): Promise<AdminAuthState> {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }

  const { email, password } = parsed.data;
  const { ip } = await requestContext();

  const throttle = await throttleFor(email, ip);
  if (throttle.blocked) {
    return {
      error: `Too many failed attempts. Try again in ${throttle.retryInMinutes} minutes.`,
    };
  }

  const user = await db.select().from(users).where(eq(users.email, email)).get();

  /* The hash comparison runs even when the account is missing, so response
     timing does not reveal which emails exist. */
  const stored = user?.passwordHash ?? (await hashPassword("no-such-account"));
  const passwordOk = await verifyPassword(password, stored);

  /* A customer account signing in here is treated exactly like a wrong
     password — the admin door never confirms that an address is staff. */
  if (!user || !passwordOk || !isStaffRole(user.role)) {
    await recordAttempt(email, false);
    if (ip) await recordAttempt(`ip:${ip}`, false);
    await record({
      actor: null,
      action: "auth.login_failed",
      entity: "session",
      summary: `Failed admin sign-in for ${email}`,
    });

    const after = await throttleFor(email, ip);
    return {
      error:
        after.remaining <= 2 && after.remaining > 0
          ? `Those details don't match a staff account. ${after.remaining} attempt${after.remaining === 1 ? "" : "s"} left.`
          : "Those details don't match a staff account.",
    };
  }

  await clearAttempts(email);
  if (ip) await clearAttempts(`ip:${ip}`);
  await createAdminSession(user.id);
  await record({
    actor: user,
    action: "auth.login",
    entity: "session",
    summary: `${user.name} signed in to the admin panel`,
  });

  redirect(safeAdminNext(formData.get("next")));
}

export async function adminLogoutAction() {
  const user = await assertAdmin().catch(() => null);
  if (user) {
    await record({
      actor: user,
      action: "auth.logout",
      entity: "session",
      summary: `${user.name} signed out`,
    });
  }
  await destroyAdminSession();
  redirect("/admin/login?signedOut=1");
}

/* -------------------------------------------------------------- invites */

const acceptSchema = z
  .object({
    token: z.string().min(10),
    name: z.string().trim().min(2, "Tell us your name.").max(80),
    password: z
      .string()
      .min(12, "Staff passwords must be at least 12 characters.")
      .max(200),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "The two passwords don't match.",
    path: ["confirm"],
  });

export async function acceptInviteAction(
  _prev: AdminAuthState,
  formData: FormData,
): Promise<AdminAuthState> {
  const parsed = acceptSchema.safeParse({
    token: formData.get("token"),
    name: formData.get("name"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const checked = await checkInvite(parsed.data.token);
  if (!checked.ok) {
    return { error: "This invitation is no longer valid. Ask an admin for a new link." };
  }

  const [created] = await db
    .insert(users)
    .values({
      email: checked.invite.email,
      name: parsed.data.name,
      role: checked.invite.role,
      passwordHash: await hashPassword(parsed.data.password),
    })
    .returning();

  await markAccepted(checked.invite.id, created.id);
  await createAdminSession(created.id);
  await record({
    actor: created,
    action: "invite.accepted",
    entity: "user",
    entityId: created.id,
    summary: `${created.name} joined as ${created.role}`,
  });

  redirect("/admin?welcome=1");
}

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  role: z.enum(["admin", "coach"]),
  note: z.string().trim().max(200).default(""),
});

export async function createInviteAction(
  _prev: AdminAuthState & { url?: string },
  formData: FormData,
): Promise<AdminAuthState & { url?: string }> {
  const actor = await assertFullAdmin();

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const existing = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .get();
  if (existing) {
    return {
      error: isStaffRole(existing.role)
        ? "That address already has a staff account."
        : "That address is already registered as a customer. Change their role from the Team list instead.",
    };
  }

  const { url } = await createInvite({
    email: parsed.data.email,
    role: parsed.data.role,
    invitedBy: actor.id,
    note: parsed.data.note,
  });

  await record({
    actor,
    action: "invite.created",
    entity: "invite",
    summary: `Invited ${parsed.data.email} as ${parsed.data.role}`,
  });

  revalidatePath("/admin/team");
  return { ok: true, url };
}

export async function revokeInviteAction(inviteId: string) {
  const actor = await assertFullAdmin();
  await revokeInvite(inviteId);
  await record({
    actor,
    action: "invite.revoked",
    entity: "invite",
    entityId: inviteId,
    summary: "Revoked a pending invitation",
  });
  revalidatePath("/admin/team");
}

/* ---------------------------------------------------------------- staff */

export async function changeRoleAction(userId: string, role: UserRole) {
  const actor = await assertFullAdmin();

  if (userId === actor.id) {
    throw new Error("You cannot change your own role.");
  }

  const target = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!target) return;

  /* Never allow the last admin to be demoted — that would lock everyone out. */
  if (target.role === "admin" && role !== "admin") {
    const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin")).all();
    if (admins.length <= 1) throw new Error("This is the only admin — promote someone else first.");
  }

  await db.update(users).set({ role }).where(eq(users.id, userId));

  /* A demotion must take effect at once, not when the session happens to expire. */
  if (!isStaffRole(role)) await revokeAdminSessions(userId);

  await record({
    actor,
    action: "staff.role_changed",
    entity: "user",
    entityId: userId,
    summary: `${target.name} changed from ${target.role} to ${role}`,
    meta: { from: target.role, to: role },
  });

  revalidatePath("/admin/team");
}

export async function revokeStaffSessionsAction(userId: string) {
  const actor = await assertFullAdmin();
  const target = await db.select().from(users).where(eq(users.id, userId)).get();
  await revokeAdminSessions(userId);
  await record({
    actor,
    action: "staff.sessions_revoked",
    entity: "user",
    entityId: userId,
    summary: `Signed ${target?.name ?? "a staff member"} out of every device`,
  });
  revalidatePath("/admin/team");
}

/** Ends one of your own sessions from the security list. */
export async function revokeOwnSessionAction(tokenHash: string) {
  const actor = await assertAdmin();
  await revokeSession(tokenHash, actor.id);
  revalidatePath("/admin/team");
}

import { randomBytes } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminInvites, users, type AdminInvite, type UserRole } from "@/lib/db/schema";
import { hashToken } from "./token";
import { siteOrigin } from "@/lib/site";

/* Staff accounts are invite-only. There is no admin sign-up form anywhere on
   the site — the only way in is a one-time link an existing admin issues. */

const INVITE_DAYS = 7;

export type StaffRole = Exclude<UserRole, "customer">;

export async function createInvite(input: {
  email: string;
  role: StaffRole;
  invitedBy: string;
  note?: string;
}) {
  const email = input.email.trim().toLowerCase();

  /* One live invite per address — issuing a second replaces the first, so an
     old link can never be redeemed after a re-invite. */
  await db
    .update(adminInvites)
    .set({ revokedAt: new Date() })
    .where(and(eq(adminInvites.email, email), isNull(adminInvites.acceptedAt), isNull(adminInvites.revokedAt)));

  const token = randomBytes(32).toString("base64url");
  const [invite] = await db
    .insert(adminInvites)
    .values({
      email,
      role: input.role,
      tokenHash: hashToken(token),
      invitedBy: input.invitedBy,
      note: input.note ?? "",
      expiresAt: new Date(Date.now() + INVITE_DAYS * 86_400_000),
    })
    .returning();

  /* The raw token is returned exactly once — it is never stored or shown again. */
  return { invite, url: `${siteOrigin()}/admin/join/${token}` };
}

export type InviteCheck =
  | { ok: true; invite: AdminInvite }
  | { ok: false; reason: "unknown" | "expired" | "revoked" | "used" | "email_taken" };

export async function checkInvite(token: string): Promise<InviteCheck> {
  const invite = await db
    .select()
    .from(adminInvites)
    .where(eq(adminInvites.tokenHash, hashToken(token)))
    .get();

  if (!invite) return { ok: false, reason: "unknown" };
  if (invite.acceptedAt) return { ok: false, reason: "used" };
  if (invite.revokedAt) return { ok: false, reason: "revoked" };
  if (invite.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, invite.email))
    .get();
  if (existing) return { ok: false, reason: "email_taken" };

  return { ok: true, invite };
}

export async function markAccepted(inviteId: string, userId: string) {
  await db
    .update(adminInvites)
    .set({ acceptedAt: new Date(), acceptedBy: userId })
    .where(eq(adminInvites.id, inviteId));
}

export async function revokeInvite(inviteId: string) {
  await db
    .update(adminInvites)
    .set({ revokedAt: new Date() })
    .where(eq(adminInvites.id, inviteId));
}

export type InviteStatus = "pending" | "accepted" | "revoked" | "expired";

export function inviteStatus(invite: AdminInvite): InviteStatus {
  if (invite.acceptedAt) return "accepted";
  if (invite.revokedAt) return "revoked";
  if (invite.expiresAt.getTime() < Date.now()) return "expired";
  return "pending";
}

export function listInvites() {
  return db.select().from(adminInvites).orderBy(desc(adminInvites.createdAt)).all();
}

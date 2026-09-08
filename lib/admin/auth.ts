import { randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt, gte, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { loginAttempts, sessions, users, type User, type UserRole } from "@/lib/db/schema";
import { hashToken } from "./token";

/* ============================================================
   Admin authentication.

   Deliberately a separate credential from the storefront: a
   different cookie, a different session row, a shorter life and
   a path scoped to /admin. Signing into the shop grants no admin
   access whatsoever, and an admin session is never sent to a
   storefront route.
   ============================================================ */

export const ADMIN_COOKIE = "tfm_admin";

/** Staff sessions are short — a shared laptop should not stay signed in. */
const ADMIN_SESSION_HOURS = 12;

/** How long a staff member is locked out after repeated failures. */
const LOCKOUT_WINDOW_MINUTES = 15;
const MAX_ATTEMPTS = 5;

async function requestContext() {
  const head = await headers();
  /* first hop in x-forwarded-for is the client; fall back to the direct peer */
  const forwarded = head.get("x-forwarded-for")?.split(",")[0]?.trim();
  return {
    ip: forwarded || head.get("x-real-ip") || null,
    userAgent: head.get("user-agent")?.slice(0, 300) ?? null,
  };
}

/* ------------------------------------------------------------ throttling */

/** Attempts against this email or IP inside the lockout window. */
export async function recentFailures(identifier: string) {
  const since = new Date(Date.now() - LOCKOUT_WINDOW_MINUTES * 60_000);
  const row = await db
    .select({ n: sql<number>`count(*)` })
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.identifier, identifier.toLowerCase()),
        eq(loginAttempts.successful, false),
        gte(loginAttempts.createdAt, since),
      ),
    )
    .get();
  return Number(row?.n ?? 0);
}

export async function recordAttempt(identifier: string, successful: boolean) {
  await db.insert(loginAttempts).values({
    identifier: identifier.toLowerCase(),
    scope: "admin",
    successful,
  });
  /* opportunistic sweep — nothing older than a day is useful */
  await db
    .delete(loginAttempts)
    .where(lt(loginAttempts.createdAt, new Date(Date.now() - 86_400_000)));
}

/** Clears the counter so a correct password immediately restores access. */
export async function clearAttempts(identifier: string) {
  await db.delete(loginAttempts).where(eq(loginAttempts.identifier, identifier.toLowerCase()));
}

export type Throttle = { blocked: boolean; remaining: number; retryInMinutes: number };

export async function throttleFor(email: string, ip: string | null): Promise<Throttle> {
  const counts = await Promise.all([
    recentFailures(email),
    ip ? recentFailures(`ip:${ip}`) : Promise.resolve(0),
  ]);
  const worst = Math.max(...counts);
  return {
    blocked: worst >= MAX_ATTEMPTS,
    remaining: Math.max(0, MAX_ATTEMPTS - worst),
    retryInMinutes: LOCKOUT_WINDOW_MINUTES,
  };
}

/* -------------------------------------------------------------- sessions */

export async function createAdminSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_HOURS * 3_600_000);
  const { ip, userAgent } = await requestContext();

  await db.insert(sessions).values({
    tokenHash: hashToken(token),
    userId,
    scope: "admin",
    expiresAt,
    ip,
    userAgent,
    lastSeenAt: new Date(),
  });
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));

  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    /* strict, not lax: no cross-site navigation should ever carry this */
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    expires: expiresAt,
  });
}

export async function destroyAdminSession() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  jar.delete({ name: ADMIN_COOKIE, path: "/admin" });
}

/** Signs every admin session for this user out — used after a role change. */
export async function revokeAdminSessions(userId: string) {
  await db
    .delete(sessions)
    .where(and(eq(sessions.userId, userId), eq(sessions.scope, "admin")));
}

export async function revokeSession(tokenHash: string, userId: string) {
  await db
    .delete(sessions)
    .where(and(eq(sessions.tokenHash, tokenHash), eq(sessions.userId, userId)));
}

export function listSessionsFor(userId: string) {
  return db
    .select()
    .from(sessions)
    .where(and(eq(sessions.userId, userId), eq(sessions.scope, "admin")))
    .all();
}

/* ------------------------------------------------------------- identity */

export const isStaffRole = (role: UserRole | undefined) =>
  role === "admin" || role === "coach";

/**
 * The signed-in staff member, or null. Validates three things independently:
 * the token is live, the session is admin-scoped, and the account still
 * holds a staff role — so demoting someone takes effect immediately.
 */
export async function getAdminUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const row = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        eq(sessions.scope, "admin"),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .get();

  if (!row || !isStaffRole(row.user.role)) return null;
  return row.user;
}

/** Guard for admin pages. Sends unauthenticated visitors to the admin sign-in. */
export async function requireAdmin(nextPath = "/admin"): Promise<User> {
  const user = await getAdminUser();
  if (!user) redirect(`/admin/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}

/** Guard for the sections only a full admin may touch (team, settings). */
export async function requireFullAdmin(nextPath = "/admin"): Promise<User> {
  const user = await requireAdmin(nextPath);
  if (user.role !== "admin") redirect("/admin?denied=1");
  return user;
}

/** Throws rather than redirects — the right shape inside a server action. */
export async function assertAdmin(): Promise<User> {
  const user = await getAdminUser();
  if (!user) throw new Error("Not authorised.");
  return user;
}

export async function assertFullAdmin(): Promise<User> {
  const user = await assertAdmin();
  if (user.role !== "admin") throw new Error("This action requires an admin.");
  return user;
}

export { requestContext, hashToken };

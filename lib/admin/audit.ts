import { desc, eq, like, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLog, type User } from "@/lib/db/schema";
import { requestContext } from "./auth";

/* Every state-changing admin action lands here. The actor's email and name are
   snapshotted alongside the id so the trail still reads correctly after an
   account is renamed or deleted. */

export type AuditAction =
  | "auth.login"
  | "auth.logout"
  | "auth.login_failed"
  | "invite.created"
  | "invite.revoked"
  | "invite.accepted"
  | "staff.role_changed"
  | "staff.sessions_revoked"
  | "product.created"
  | "product.updated"
  | "product.visibility"
  | "post.created"
  | "post.updated"
  | "order.updated"
  | "plan.approved"
  | "review.approved"
  | "review.deleted"
  | "customer.updated";

export async function record(input: {
  actor: User | null;
  action: AuditAction;
  entity?: string;
  entityId?: string | null;
  summary: string;
  meta?: Record<string, unknown>;
}) {
  const { ip } = await requestContext();
  await db.insert(auditLog).values({
    actorId: input.actor?.id ?? null,
    actorEmail: input.actor?.email ?? "",
    actorName: input.actor?.name ?? "",
    action: input.action,
    entity: input.entity ?? "",
    entityId: input.entityId ?? null,
    summary: input.summary,
    meta: input.meta,
    ip,
  });
}

export type AuditPage = {
  entries: (typeof auditLog.$inferSelect)[];
  total: number;
  pages: number;
};

export async function listAudit(options: {
  page?: number;
  perPage?: number;
  query?: string;
  action?: string;
} = {}): Promise<AuditPage> {
  const perPage = options.perPage ?? 40;
  const page = Math.max(1, options.page ?? 1);

  const filters = [];
  if (options.query) {
    const q = `%${options.query.toLowerCase()}%`;
    filters.push(
      or(
        like(sql`lower(${auditLog.actorEmail})`, q),
        like(sql`lower(${auditLog.summary})`, q),
        like(sql`lower(${auditLog.entity})`, q),
      ),
    );
  }
  if (options.action) filters.push(eq(auditLog.action, options.action));

  const where = filters.length ? filters.reduce((a, b) => sql`${a} and ${b}`) : undefined;

  const totalRow = await (where
    ? db.select({ n: sql<number>`count(*)` }).from(auditLog).where(where).get()
    : db.select({ n: sql<number>`count(*)` }).from(auditLog).get());
  const total = Number(totalRow?.n ?? 0);

  const base = db.select().from(auditLog);
  const entries = await (where ? base.where(where) : base)
    .orderBy(desc(auditLog.createdAt))
    .limit(perPage)
    .offset((page - 1) * perPage)
    .all();

  return { entries, total, pages: Math.max(1, Math.ceil(total / perPage)) };
}

/** Distinct actions present in the log, for the filter dropdown. */
export async function auditActions() {
  const rows = await db
    .selectDistinct({ action: auditLog.action })
    .from(auditLog)
    .orderBy(auditLog.action)
    .all();
  return rows.map((r) => r.action);
}

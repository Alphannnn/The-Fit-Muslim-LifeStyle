import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  planIntakes,
  plans,
  progressLogs,
  subscriptions,
  type Plan,
  type PlanIntake,
} from "@/lib/db/schema";

export type PlanWithIntake = Plan & { intake: PlanIntake | null };

export async function getUserPlans(userId: string): Promise<PlanWithIntake[]> {
  const rows = await db
    .select({ plan: plans, intake: planIntakes })
    .from(plans)
    .leftJoin(planIntakes, eq(planIntakes.id, plans.intakeId))
    .where(eq(plans.userId, userId))
    .orderBy(desc(plans.version))
    .all();

  return rows.map((r) => ({ ...r.plan, intake: r.intake }));
}

/** The plan the customer should be following — the newest delivered one. */
export async function getActivePlan(userId: string): Promise<PlanWithIntake | null> {
  const row = await db
    .select({ plan: plans, intake: planIntakes })
    .from(plans)
    .leftJoin(planIntakes, eq(planIntakes.id, plans.intakeId))
    .where(and(eq(plans.userId, userId), inArray(plans.status, ["approved", "delivered"])))
    .orderBy(desc(plans.version))
    .get();

  return row ? { ...row.plan, intake: row.intake } : null;
}

export async function getPlanForUser(
  planId: string,
  userId: string,
): Promise<PlanWithIntake | null> {
  const row = await db
    .select({ plan: plans, intake: planIntakes })
    .from(plans)
    .leftJoin(planIntakes, eq(planIntakes.id, plans.intakeId))
    .where(and(eq(plans.id, planId), eq(plans.userId, userId)))
    .get();

  return row ? { ...row.plan, intake: row.intake } : null;
}

export async function getSubscription(userId: string) {
  return (
    db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt))
      .get() ?? null
  );
}

export async function getProgress(userId: string, limit = 60) {
  return db
    .select()
    .from(progressLogs)
    .where(eq(progressLogs.userId, userId))
    .orderBy(desc(progressLogs.loggedOn))
    .limit(limit)
    .all();
}

export type ProgressSummary = {
  entries: number;
  latestWeightKg: number | null;
  weightChangeKg: number | null;
  workoutsLast7: number;
  prayersLast7: number;
  fastsLast7: number;
  /** consecutive days logged, counting back from the most recent entry */
  streak: number;
};

const isoDay = (date: Date) => date.toISOString().slice(0, 10);

export async function getProgressSummary(userId: string): Promise<ProgressSummary> {
  const logs = await getProgress(userId, 120);
  if (logs.length === 0) {
    return {
      entries: 0,
      latestWeightKg: null,
      weightChangeKg: null,
      workoutsLast7: 0,
      prayersLast7: 0,
      fastsLast7: 0,
      streak: 0,
    };
  }

  const weighed = logs.filter((l) => l.weightKg != null);
  const latestWeightKg = weighed[0]?.weightKg ?? null;
  const earliestWeight = weighed[weighed.length - 1]?.weightKg ?? null;

  const sevenDaysAgo = isoDay(new Date(Date.now() - 6 * 86_400_000));
  const recent = logs.filter((l) => l.loggedOn >= sevenDaysAgo);

  /* Walk back a day at a time from the newest entry; the first gap ends it. */
  let streak = 0;
  const logged = new Set(logs.map((l) => l.loggedOn));
  const cursor = new Date(`${logs[0].loggedOn}T00:00:00Z`);
  while (logged.has(isoDay(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return {
    entries: logs.length,
    latestWeightKg,
    weightChangeKg:
      latestWeightKg != null && earliestWeight != null && weighed.length > 1
        ? Math.round((latestWeightKg - earliestWeight) * 10) / 10
        : null,
    workoutsLast7: recent.reduce((n, l) => n + l.workouts, 0),
    prayersLast7: recent.reduce((n, l) => n + l.prayersOnTime, 0),
    fastsLast7: recent.filter((l) => l.fasted).length,
    streak,
  };
}

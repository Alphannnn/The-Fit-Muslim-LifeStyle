import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserPlans } from "@/lib/account";
import type { PlanStatus } from "@/lib/db/schema";

export const metadata: Metadata = {
  title: "Your Plans",
  robots: { index: false, follow: false },
};

const STATUS: Record<PlanStatus, { label: string; className: string; note: string }> = {
  draft: {
    label: "With your coach",
    className: "border-gold/45 bg-gold/8 text-gold-deep",
    note: "Drafted and queued for review. Nothing is sent until a coach approves it.",
  },
  approved: {
    label: "Approved",
    className: "border-green-500/40 bg-green-800/8 text-green-700",
    note: "Reviewed and approved by your coach.",
  },
  delivered: {
    label: "Delivered",
    className: "border-green-500/40 bg-green-800/8 text-green-700",
    note: "Yours to follow — open it any time.",
  },
};

export default async function AccountPlansPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const [{ submitted }, user] = await Promise.all([searchParams, getCurrentUser()]);
  if (!user) return null;

  const plans = await getUserPlans(user.id);

  return (
    <div className="space-y-6">
      {submitted && (
        <div className="rounded-lg border border-green-500/40 bg-green-800/6 px-5 py-4">
          <p className="font-serif text-lg text-green-800">Your intake is in</p>
          <p className="mt-1 text-[0.85rem] leading-relaxed text-ink-soft">
            A first draft has already been generated from your answers. A coach now
            reviews it — you&apos;ll have it within 48 hours, and nothing reaches you
            until it&apos;s approved.
          </p>
        </div>
      )}

      <div className="flex items-end justify-between">
        <h2 className="font-display text-xl font-semibold text-ink">Your plans</h2>
        <Link
          href="/plan"
          className="rounded-sm border border-gold/55 px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-gold-deep transition-colors hover:bg-gold/10"
        >
          New Intake
        </Link>
      </div>

      {plans.length === 0 ? (
        <div className="rounded-lg border border-linen bg-sand p-8 text-center">
          <p className="font-serif text-lg text-ink">No plans yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
            Answer four short screens and we&apos;ll build one around your body, your
            week, and your prayer times.
          </p>
          <Link
            href="/plan"
            className="mt-6 inline-block rounded-sm bg-green-800 px-7 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-ivory transition-colors hover:bg-green-900"
          >
            Start Your Plan
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {plans.map((plan) => {
            const status = STATUS[plan.status];
            const readable = plan.status !== "draft";
            return (
              <li
                key={plan.id}
                className="rounded-lg border border-linen bg-shell p-6 transition-colors hover:border-gold/45"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-display text-lg font-semibold text-ink">
                        {plan.title}
                      </h3>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.14em] ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[0.7rem] uppercase tracking-[0.14em] text-ink-muted">
                      Version {plan.version} ·{" "}
                      {plan.createdAt.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="mt-3 max-w-xl font-serif text-base leading-relaxed text-ink-soft">
                      {readable ? plan.summary : status.note}
                    </p>
                    {plan.coachNotes && readable && (
                      <p className="mt-3 border-l-2 border-gold/50 pl-3 font-serif text-[0.95rem] italic text-ink-soft">
                        “{plan.coachNotes}”
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="font-display text-2xl font-semibold text-green-800">
                      {plan.targetCalories}
                    </p>
                    <p className="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                      kcal / day
                    </p>
                  </div>
                </div>

                {readable && (
                  <Link
                    href={`/account/plans/${plan.id}`}
                    className="mt-5 inline-block rounded-sm bg-green-800 px-6 py-2.5 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-green-900"
                  >
                    Open Plan
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

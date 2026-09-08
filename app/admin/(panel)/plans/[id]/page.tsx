import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import PlanReviewForm from "@/components/admin/PlanReviewForm";
import { Badge, PageHeading } from "@/components/admin/ui/primitives";
import { db } from "@/lib/db";
import { planIntakes, plans, users } from "@/lib/db/schema";

export default async function AdminPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const row = await db
    .select({ plan: plans, intake: planIntakes, customer: users })
    .from(plans)
    .innerJoin(planIntakes, eq(planIntakes.id, plans.intakeId))
    .innerJoin(users, eq(users.id, plans.userId))
    .where(eq(plans.id, id))
    .get();

  if (!row) notFound();
  const { plan, intake, customer } = row;

  const intakeFacts: { k: string; v: string }[] = [
    { k: "Goal", v: intake.goal },
    { k: "Sex", v: intake.sex },
    { k: "Age", v: `${intake.age}` },
    { k: "Height", v: `${intake.heightCm} cm` },
    { k: "Weight", v: `${intake.weightKg} kg` },
    { k: "Target", v: intake.targetWeightKg ? `${intake.targetWeightKg} kg` : "—" },
    { k: "Activity", v: intake.activityLevel },
    { k: "Training days", v: `${intake.trainingDaysPerWeek}` },
    { k: "Diet", v: intake.dietaryStyle },
    { k: "City", v: intake.city ? `${intake.city}, ${intake.country ?? ""}` : "—" },
    { k: "Ramadan mode", v: intake.ramadanMode ? "Yes" : "No" },
    { k: "Mon/Thu fasts", v: intake.fastsMondayThursday ? "Yes" : "No" },
  ];

  return (
    <div className="space-y-8">
      <PageHeading
        breadcrumb={[{ label: "Plan queue", href: "/admin/plans" }, { label: customer.name }]}
        title={customer.name}
        description={`${customer.email} · version ${plan.version} · ${plan.targetCalories} kcal (BMR ${plan.bmr}, TDEE ${plan.tdee})`}
        action={
          <Badge tone={plan.status === "draft" ? "warning" : "success"} dot>
            {plan.status}
          </Badge>
        }
      />

      <div className="grid gap-8 lg:grid-cols-12">
        {/* intake + generated plan */}
        <div className="space-y-6 lg:col-span-7">
          <section className="rounded-lg border border-panel-border bg-panel-surface p-6">
            <h2 className="text-[0.95rem] font-semibold text-panel-ink">The intake</h2>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              {intakeFacts.map((f) => (
                <div key={f.k}>
                  <dt className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-panel-muted">
                    {f.k}
                  </dt>
                  <dd className="mt-0.5 text-[0.88rem] capitalize text-panel-ink">{f.v}</dd>
                </div>
              ))}
            </dl>

            {(intake.allergies.length > 0 || intake.avoid.length > 0) && (
              <div className="mt-5 border-t border-panel-border pt-4">
                <p className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-panel-muted">
                  Filtered out of the plan
                </p>
                <p className="mt-1 text-[0.88rem] text-panel-ink">
                  {[...intake.allergies, ...intake.avoid].join(", ")}
                </p>
              </div>
            )}

            {intake.medical.trim() && (
              <div className="mt-5 rounded-sm border border-danger/25 bg-danger-soft p-4">
                <p className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-danger">
                  Medical note — read before approving
                </p>
                <p className="mt-1.5 text-[0.9rem] leading-relaxed text-panel-ink">{intake.medical}</p>
              </div>
            )}

            {intake.notes.trim() && (
              <div className="mt-5 border-t border-panel-border pt-4">
                <p className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-panel-muted">
                  Their note
                </p>
                <p className="mt-1.5 text-[0.9rem] leading-relaxed text-panel-soft">
                  {intake.notes}
                </p>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-panel-border bg-panel-surface p-6">
            <h2 className="text-[0.95rem] font-semibold text-panel-ink">Generated meals</h2>
            <ul className="mt-4 space-y-3">
              {plan.meals.map((meal) => (
                <li key={meal.name} className="rounded-sm border border-panel-border bg-panel-raised p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-display text-[0.95rem] font-semibold text-panel-ink">
                      {meal.name}
                      <span className="ml-2 text-[0.7rem] font-medium text-green-700">
                        {meal.time}
                      </span>
                    </h3>
                    <span className="text-[0.7rem] text-panel-muted">
                      {meal.calories} kcal · {meal.protein}p / {meal.carbs}c / {meal.fat}f
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {meal.items.map((item) => (
                      <li key={item} className="text-[0.85rem] text-panel-soft">
                        · {item}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-panel-border bg-panel-surface p-6">
            <h2 className="text-[0.95rem] font-semibold text-panel-ink">Generated training</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {plan.training.map((day) => (
                <li key={day.day} className="rounded-sm border border-panel-border bg-panel-raised p-4">
                  <h3 className="font-display text-[0.9rem] font-semibold uppercase tracking-[0.08em] text-panel-ink">
                    {day.day}
                  </h3>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-gold-deep">
                    {day.focus}
                  </p>
                  <p className="mt-1 text-[0.72rem] text-panel-muted">{day.window}</p>
                  <ul className="mt-2 space-y-1">
                    {day.blocks.map((block) => (
                      <li key={block} className="text-[0.85rem] text-panel-soft">
                        · {block}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>

          {plan.guidance.length > 0 && (
            <section className="rounded-lg border border-panel-border bg-panel-surface p-6">
              <h2 className="text-[0.95rem] font-semibold text-panel-ink">Guidance notes</h2>
              <ul className="mt-3 space-y-2">
                {plan.guidance.map((note) => (
                  <li key={note} className="text-[0.88rem] leading-relaxed text-panel-soft">
                    · {note}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* the review form */}
        <div className="lg:col-span-5">
          <div className="sticky top-6">
            <PlanReviewForm
              plan={{
                id: plan.id,
                title: plan.title,
                summary: plan.summary,
                targetCalories: plan.targetCalories,
                proteinGrams: plan.proteinGrams,
                carbGrams: plan.carbGrams,
                fatGrams: plan.fatGrams,
                coachNotes: plan.coachNotes,
              }}
              readOnly={plan.status !== "draft"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

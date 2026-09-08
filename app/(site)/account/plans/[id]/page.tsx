import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PrintButton from "@/components/PrintButton";
import { getCurrentUser } from "@/lib/auth/session";
import { getPlanForUser } from "@/lib/account";

export const metadata: Metadata = {
  title: "Your Plan",
  robots: { index: false, follow: false },
};

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, user] = await Promise.all([params, getCurrentUser()]);
  if (!user) return null;

  const plan = await getPlanForUser(id, user.id);
  if (!plan) notFound();
  /* A draft belongs to the coach until it is approved. */
  if (plan.status === "draft") redirect("/account/plans");

  const macros = [
    { k: "Calories", v: `${plan.targetCalories}`, unit: "kcal" },
    { k: "Protein", v: `${plan.proteinGrams}`, unit: "g" },
    { k: "Carbs", v: `${plan.carbGrams}`, unit: "g" },
    { k: "Fat", v: `${plan.fatGrams}`, unit: "g" },
    { k: "Water", v: `${plan.hydrationLitres}`, unit: "L" },
  ];

  return (
    <article className="space-y-8">
      <header className="rounded-xl border border-linen bg-sand p-6 print-plain">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-gold-deep">
              Version {plan.version} · Approved by your coach
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-ink">{plan.title}</h1>
            <p className="mt-2 max-w-xl font-serif text-base leading-relaxed text-ink-soft">
              {plan.summary}
            </p>
          </div>
          <div className="flex gap-2 print:hidden">
            <PrintButton />
            <Link
              href="/account/plans"
              className="rounded-sm border border-linen px-4 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft transition-colors hover:border-gold hover:text-green-800"
            >
              All Plans
            </Link>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-linen pt-5 sm:grid-cols-5">
          {macros.map((m) => (
            <div key={m.k}>
              <dt className="text-[0.56rem] font-semibold uppercase tracking-[0.18em] text-ink-muted">
                {m.k}
              </dt>
              <dd className="mt-1 font-display text-xl font-semibold text-green-800">
                {m.v}
                <span className="ml-0.5 text-[0.7rem] font-medium text-ink-muted">{m.unit}</span>
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-4 text-[0.72rem] text-ink-muted">
          Resting rate {plan.bmr} kcal · maintenance {plan.tdee} kcal
        </p>
      </header>

      {plan.coachNotes && (
        <section className="rounded-lg border border-gold/45 bg-gold/6 p-6 print-plain">
          <h2 className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-gold-deep">
            From your coach
          </h2>
          <p className="mt-2 font-serif text-lg leading-relaxed text-ink">
            “{plan.coachNotes}”
          </p>
        </section>
      )}

      {/* meals */}
      <section>
        <h2 className="font-display text-xl font-semibold text-ink">Your day</h2>
        <p className="mt-1 text-[0.8rem] text-ink-muted">
          Times are anchored to your prayer times
          {plan.intake?.city ? ` in ${plan.intake.city}` : ""} — they move with the sun,
          not the clock.
        </p>

        <ul className="mt-5 space-y-4">
          {plan.meals.map((meal) => (
            <li
              key={meal.name}
              className="break-inside-avoid rounded-lg border border-linen bg-shell p-5 print-plain"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-semibold text-ink">{meal.name}</h3>
                  <p className="mt-0.5 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-green-700">
                    {meal.time}
                    {meal.anchor && meal.anchor !== meal.time && (
                      <span className="ml-2 font-medium text-ink-muted">· {meal.anchor}</span>
                    )}
                  </p>
                </div>
                <p className="text-[0.72rem] text-ink-muted">
                  <span className="font-display text-base font-semibold text-ink">
                    {meal.calories}
                  </span>{" "}
                  kcal · {meal.protein}p / {meal.carbs}c / {meal.fat}f
                </p>
              </div>

              <ul className="mt-3 space-y-1.5 border-t border-linen pt-3">
                {meal.items.map((item) => (
                  <li key={item} className="flex gap-2.5 font-serif text-[0.98rem] text-ink-soft">
                    <span className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-gold" />
                    {item}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      {/* training */}
      <section>
        <h2 className="font-display text-xl font-semibold text-ink">Your week</h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {plan.training.map((day) => (
            <li
              key={day.day}
              className="break-inside-avoid rounded-lg border border-linen bg-shell p-5 print-plain"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-display text-base font-semibold tracking-[0.06em] text-ink uppercase">
                  {day.day}
                </h3>
                <span className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-gold-deep">
                  {day.focus}
                </span>
              </div>
              <p className="mt-1.5 text-[0.72rem] text-ink-muted">{day.window}</p>
              <ol className="mt-3 space-y-1.5 border-t border-linen pt-3">
                {day.blocks.map((block, i) => (
                  <li key={block} className="flex gap-2.5 font-serif text-[0.95rem] text-ink-soft">
                    <span className="font-display text-[0.7rem] font-semibold text-ink-muted">
                      {i + 1}
                    </span>
                    {block}
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ul>
      </section>

      {/* guidance */}
      {plan.guidance.length > 0 && (
        <section className="rounded-lg border border-linen bg-sand p-6 print-plain">
          <h2 className="font-display text-lg font-semibold text-ink">Read this once a week</h2>
          <ul className="mt-4 space-y-3">
            {plan.guidance.map((note) => (
              <li key={note} className="flex gap-3 font-serif text-[1rem] leading-relaxed text-ink-soft">
                <svg viewBox="0 0 24 24" className="mt-1.5 h-4 w-4 shrink-0 text-green-700" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {note}
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="border-t border-linen pt-6 text-[0.75rem] leading-relaxed text-ink-muted">
        This plan was drafted by our engine from your intake and reviewed by a
        qualified coach before delivery. It is guidance, not medical advice — if you
        are pregnant, managing a condition, or taking medication, speak to your doctor
        first.
      </footer>
    </article>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useActionState, useState } from "react";
import { submitIntakeAction, type IntakeState } from "@/lib/plan/actions";
import { CITIES } from "@/lib/prayer/locations";

const initial: IntakeState = {};
const ease = [0.22, 0.61, 0.36, 1] as const;

const STEPS = ["Your goal", "Your body", "Your week", "Your deen"] as const;

const field =
  "mt-1.5 w-full rounded-sm border border-linen bg-shell px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-gold";
const labelText = "text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-ink-muted";

function Choice({
  name,
  value,
  checked,
  onChange,
  title,
  note,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  title: string;
  note?: string;
}) {
  return (
    <label
      className={`cursor-pointer rounded-lg border p-4 transition-all ${
        checked
          ? "border-green-700 bg-green-800/6 shadow-[0_10px_24px_-18px_rgba(13,40,28,0.8)]"
          : "border-linen bg-shell hover:border-gold/50"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      <span className={`block font-serif text-base ${checked ? "text-green-800" : "text-ink"}`}>
        {title}
      </span>
      {note && <span className="mt-1 block text-[0.78rem] leading-snug text-ink-muted">{note}</span>}
    </label>
  );
}

/* Every step stays mounted and is only hidden, so answers from earlier steps
   are still in the form when it submits (and survive going Back). */
function Step({
  index,
  current,
  children,
}: {
  index: number;
  current: number;
  children: React.ReactNode;
}) {
  const active = index === current;
  return (
    <motion.div
      data-step={index}
      hidden={!active}
      initial={false}
      animate={active ? { opacity: 1, x: 0 } : { opacity: 0, x: 18 }}
      transition={{ duration: 0.3, ease }}
    >
      {children}
    </motion.div>
  );
}

export default function PlanIntakeWizard({ signedIn }: { signedIn: boolean }) {
  const [state, action, pending] = useActionState(submitIntakeAction, initial);
  const [step, setStep] = useState(0);

  /* Radio groups are controlled so the summary and the highlight stay in sync
     across steps — the form itself still submits one flat FormData. */
  const [goal, setGoal] = useState("lose");
  const [sex, setSex] = useState("male");
  const [activityLevel, setActivityLevel] = useState("moderate");
  const [dietaryStyle, setDietaryStyle] = useState("balanced");
  const [trainingDays, setTrainingDays] = useState(3);

  const last = step === STEPS.length - 1;

  return (
    <form
      action={action}
      /* a field on a hidden step can't show its own validation message, so
         bring its step into view instead */
      onInvalidCapture={(event) => {
        const panel = event.currentTarget
          .querySelector(":invalid")
          ?.closest<HTMLElement>("[data-step]");
        if (panel) setStep(Number(panel.dataset.step));
      }}
      className="rounded-xl border border-linen bg-sand p-6 sm:p-8"
    >
      {/* progress */}
      <ol className="mb-8 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => setStep(i)}
              className={`flex w-full flex-col items-start gap-1.5 text-left ${
                i <= step ? "" : "opacity-55"
              }`}
            >
              <span className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                {label}
              </span>
              <span
                className={`h-1 w-full rounded-full ${
                  i <= step ? "bg-linear-to-r from-gold-deep to-gold" : "bg-linen"
                }`}
              />
            </button>
          </li>
        ))}
      </ol>

      <Step index={0} current={step}>
        <h3 className="font-display text-xl font-semibold text-ink">
          What are we aiming for?
        </h3>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Choice name="goal" value="lose" checked={goal === "lose"} onChange={setGoal} title="Lose fat" note="Keep the muscle you have" />
          <Choice name="goal" value="maintain" checked={goal === "maintain"} onChange={setGoal} title="Maintain" note="Recomposition, steady weight" />
          <Choice name="goal" value="gain" checked={goal === "gain"} onChange={setGoal} title="Build muscle" note="A controlled surplus" />
        </div>

        <h3 className="mt-8 font-display text-xl font-semibold text-ink">
          How do you train now?
        </h3>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Choice name="activityLevel" value="sedentary" checked={activityLevel === "sedentary"} onChange={setActivityLevel} title="Sedentary" note="Desk work, little walking" />
          <Choice name="activityLevel" value="light" checked={activityLevel === "light"} onChange={setActivityLevel} title="Lightly active" note="Some walking, 1–2 sessions" />
          <Choice name="activityLevel" value="moderate" checked={activityLevel === "moderate"} onChange={setActivityLevel} title="Moderately active" note="3–4 sessions a week" />
          <Choice name="activityLevel" value="active" checked={activityLevel === "active"} onChange={setActivityLevel} title="Very active" note="5+ sessions, physical job" />
          <Choice name="activityLevel" value="athlete" checked={activityLevel === "athlete"} onChange={setActivityLevel} title="Athlete" note="Twice daily or competing" />
        </div>
      </Step>

      <Step index={1} current={step}>
        <h3 className="font-display text-xl font-semibold text-ink">Your measurements</h3>
        <p className="mt-1.5 text-[0.85rem] text-ink-muted">
          Used for your resting rate and macros — nothing else.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Choice name="sex" value="male" checked={sex === "male"} onChange={setSex} title="Male" />
          <Choice name="sex" value="female" checked={sex === "female"} onChange={setSex} title="Female" />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelText}>Age</span>
            <input type="number" name="age" required min={14} max={90} defaultValue={28} className={field} />
          </label>
          <label className="block">
            <span className={labelText}>Height (cm)</span>
            <input type="number" name="heightCm" required min={120} max={230} step="0.5" defaultValue={175} className={field} />
          </label>
          <label className="block">
            <span className={labelText}>Weight (kg)</span>
            <input type="number" name="weightKg" required min={35} max={300} step="0.1" defaultValue={80} className={field} />
          </label>
          <label className="block">
            <span className={labelText}>Target weight (kg, optional)</span>
            <input type="number" name="targetWeightKg" min={35} max={300} step="0.1" placeholder="—" className={field} />
          </label>
        </div>
      </Step>

      <Step index={2} current={step}>
        <h3 className="font-display text-xl font-semibold text-ink">
          How many days can you really train?
        </h3>
        <p className="mt-1.5 text-[0.85rem] text-ink-muted">
          Answer honestly — a plan you follow beats a plan that impresses.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {[2, 3, 4, 5].map((n) => (
            <label
              key={n}
              className={`cursor-pointer rounded-full border px-6 py-3 text-sm font-semibold transition-all ${
                trainingDays === n
                  ? "border-green-700 bg-green-800 text-ivory"
                  : "border-linen bg-shell text-ink-soft hover:border-gold/50"
              }`}
            >
              <input
                type="radio"
                name="trainingDaysPerWeek"
                value={n}
                checked={trainingDays === n}
                onChange={() => setTrainingDays(n)}
                className="sr-only"
              />
              {n} days
            </label>
          ))}
        </div>

        <h3 className="mt-8 font-display text-xl font-semibold text-ink">How do you eat?</h3>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Choice name="dietaryStyle" value="balanced" checked={dietaryStyle === "balanced"} onChange={setDietaryStyle} title="Balanced" note="Everything, sensibly" />
          <Choice name="dietaryStyle" value="high-protein" checked={dietaryStyle === "high-protein"} onChange={setDietaryStyle} title="High protein" note="Leaner, protein-forward" />
          <Choice name="dietaryStyle" value="mediterranean" checked={dietaryStyle === "mediterranean"} onChange={setDietaryStyle} title="Mediterranean" note="Fish, olive oil, legumes" />
          <Choice name="dietaryStyle" value="vegetarian" checked={dietaryStyle === "vegetarian"} onChange={setDietaryStyle} title="Vegetarian" note="Dairy and eggs included" />
          <Choice name="dietaryStyle" value="vegan" checked={dietaryStyle === "vegan"} onChange={setDietaryStyle} title="Vegan" note="Entirely plant-based" />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelText}>Allergies</span>
            <input name="allergies" placeholder="peanuts, shellfish" className={field} />
          </label>
          <label className="block">
            <span className={labelText}>Foods to avoid</span>
            <input name="avoid" placeholder="liver, mushrooms" className={field} />
          </label>
        </div>

        <label className="mt-4 block">
          <span className={labelText}>Anything medical we should know?</span>
          <textarea
            name="medical"
            rows={3}
            maxLength={1000}
            placeholder="Injuries, conditions, medication. Your coach reads this before approving."
            className={`${field} resize-y`}
          />
        </label>
      </Step>

      <Step index={3} current={step}>
        <h3 className="font-display text-xl font-semibold text-ink">
          Where do you pray?
        </h3>
        <p className="mt-1.5 text-[0.85rem] text-ink-muted">
          Your meals and sessions are anchored to Fajr and Maghrib, so we need
          your city.
        </p>

        <label className="mt-5 block">
          <span className={labelText}>City</span>
          <select name="citySlug" defaultValue="london" className={`${field} cursor-pointer`}>
            {CITIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}, {c.country}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-6 space-y-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-linen bg-shell p-4 transition-colors hover:border-gold/50">
            <input
              type="checkbox"
              name="fastsMondayThursday"
              className="mt-1 h-4 w-4 accent-green-800"
            />
            <span>
              <span className="block font-serif text-base text-ink">
                I fast Mondays and Thursdays
              </span>
              <span className="mt-0.5 block text-[0.78rem] text-ink-muted">
                Those sessions move to the hour before Maghrib, and refuelling
                lands straight after.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-linen bg-shell p-4 transition-colors hover:border-gold/50">
            <input type="checkbox" name="ramadanMode" className="mt-1 h-4 w-4 accent-green-800" />
            <span>
              <span className="block font-serif text-base text-ink">
                Build this in Ramadan mode
              </span>
              <span className="mt-0.5 block text-[0.78rem] text-ink-muted">
                Suhoor and iftar meal split, halved training volume, same loads.
                Switches on automatically during Ramadan anyway.
              </span>
            </span>
          </label>
        </div>

        <label className="mt-5 block">
          <span className={labelText}>Anything else for your coach?</span>
          <textarea
            name="notes"
            rows={3}
            maxLength={1000}
            placeholder="Schedule constraints, what's worked before, what hasn't."
            className={`${field} resize-y`}
          />
        </label>
      </Step>

      {state.error && (
        <div className="mt-6 rounded-sm border border-gold/45 bg-gold/8 px-4 py-3 text-sm text-gold-deep">
          {state.error}
          {state.needsAccount && (
            <>
              {" "}
              <Link
                href="/signup?next=/plan"
                className="font-semibold text-green-700 underline decoration-gold/60"
              >
                Create an account
              </Link>{" "}
              or{" "}
              <Link
                href="/login?next=/plan"
                className="font-semibold text-green-700 underline decoration-gold/60"
              >
                sign in
              </Link>
              .
            </>
          )}
        </div>
      )}

      {/* navigation */}
      <div className="mt-8 flex items-center justify-between gap-3 border-t border-linen pt-6">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="cursor-pointer rounded-sm border border-linen px-6 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink-soft transition-colors hover:border-gold hover:text-green-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Back
        </button>

        {/* Distinct keys matter: reusing one <button> would flip it to
            type="submit" mid-click, and "Continue" on step three would submit
            the form before the last step is ever shown. */}
        {last ? (
          <button
            key="submit"
            type="submit"
            disabled={pending}
            className="group relative flex-1 cursor-pointer overflow-hidden rounded-sm bg-green-800 px-8 py-4 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-ivory transition-all hover:-translate-y-0.5 hover:bg-green-900 disabled:opacity-70 sm:flex-none sm:px-10"
          >
            <span className="relative z-10">
              {pending ? "Building your plan…" : signedIn ? "Build My Plan" : "Build My Plan — Free"}
            </span>
            <span className="absolute inset-0 -left-full z-0 h-full w-1/2 skew-x-[-20deg] bg-white/25 transition-all duration-700 group-hover:left-[150%]" />
          </button>
        ) : (
          <button
            key="next"
            type="button"
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            className="flex-1 cursor-pointer rounded-sm bg-green-800 px-8 py-4 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-ivory transition-all hover:-translate-y-0.5 hover:bg-green-900 sm:flex-none sm:px-10"
          >
            Continue
          </button>
        )}
      </div>
    </form>
  );
}

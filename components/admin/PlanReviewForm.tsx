"use client";

import { buttonClass } from "./ui/primitives";

import { useActionState } from "react";
import { approvePlanAction, type AdminState } from "@/lib/admin/actions";

const initial: AdminState = {};

const field = "admin-field";
const labelText = "admin-label";

export default function PlanReviewForm({
  plan,
  readOnly,
}: {
  plan: {
    id: string;
    title: string;
    summary: string;
    targetCalories: number;
    proteinGrams: number;
    carbGrams: number;
    fatGrams: number;
    coachNotes: string;
  };
  readOnly: boolean;
}) {
  const [state, action, pending] = useActionState(approvePlanAction, initial);

  if (readOnly) {
    return (
      <div className="rounded-lg border border-panel-border bg-panel-surface p-5">
        <h2 className="text-[0.95rem] font-semibold text-panel-ink">Already delivered</h2>
        <p className="mt-2 text-sm text-panel-soft">
          This plan has been approved and sent to the customer. Generate a new version
          from a fresh intake rather than editing a delivered plan.
        </p>
        {plan.coachNotes && (
          <p className="mt-4 border-l-2 border-gold/50 pl-3 font-serif text-[0.95rem] italic text-panel-soft">
            “{plan.coachNotes}”
          </p>
        )}
      </div>
    );
  }

  return (
    <form action={action} className="rounded-lg border border-panel-border bg-panel-surface p-5">
      <input type="hidden" name="planId" value={plan.id} />

      <h2 className="text-[0.95rem] font-semibold text-panel-ink">Your review</h2>
      <p className="mt-1 text-[0.78rem] text-panel-soft">
        Adjust anything that needs adjusting. Approving delivers the plan and emails
        the customer.
      </p>

      <label className="mt-5 block">
        <span className={labelText}>Title</span>
        <input name="title" required defaultValue={plan.title} maxLength={120} className={field} />
      </label>

      <label className="mt-4 block">
        <span className={labelText}>Summary</span>
        <textarea
          name="summary"
          rows={3}
          maxLength={600}
          defaultValue={plan.summary}
          className={`${field} resize-y`}
        />
      </label>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="block">
          <span className={labelText}>Calories</span>
          <input
            type="number"
            name="targetCalories"
            required
            min={1000}
            max={6000}
            defaultValue={plan.targetCalories}
            className={field}
          />
        </label>
        <label className="block">
          <span className={labelText}>Protein (g)</span>
          <input
            type="number"
            name="proteinGrams"
            required
            min={40}
            max={400}
            defaultValue={plan.proteinGrams}
            className={field}
          />
        </label>
        <label className="block">
          <span className={labelText}>Carbs (g)</span>
          <input
            type="number"
            name="carbGrams"
            required
            min={0}
            max={900}
            defaultValue={plan.carbGrams}
            className={field}
          />
        </label>
        <label className="block">
          <span className={labelText}>Fat (g)</span>
          <input
            type="number"
            name="fatGrams"
            required
            min={20}
            max={300}
            defaultValue={plan.fatGrams}
            className={field}
          />
        </label>
      </div>

      <label className="mt-4 block">
        <span className={labelText}>Note to the customer</span>
        <textarea
          name="coachNotes"
          rows={4}
          maxLength={1200}
          defaultValue={plan.coachNotes}
          placeholder="One or two sentences they'll read at the top of their plan — and in the email."
          className={`${field} resize-y`}
        />
      </label>

      {state.error && (
        <p className="mt-4 rounded-md border border-danger/25 bg-danger-soft px-3.5 py-2.5 text-[0.83rem] text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={`${buttonClass("primary")} mt-6 w-full`}
      >
        {pending ? "Delivering…" : "Approve & Deliver"}
      </button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { logProgressAction, type ProgressState } from "@/lib/progress/actions";

const initial: ProgressState = {};

const field =
  "mt-1.5 w-full rounded-sm border border-linen bg-shell px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-gold";
const labelText = "text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-ink-muted";

export default function ProgressLogger({ today }: { today: string }) {
  const [state, action, pending] = useActionState(logProgressAction, initial);

  return (
    <form action={action} className="rounded-lg border border-linen bg-sand p-6">
      <h2 className="font-display text-lg font-semibold text-ink">Log a day</h2>
      <p className="mt-1 text-[0.78rem] text-ink-muted">
        Logging the same date twice updates it rather than adding a second entry.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelText}>Date</span>
          <input type="date" name="loggedOn" required defaultValue={today} max={today} className={field} />
        </label>
        <label className="block">
          <span className={labelText}>Weight (kg)</span>
          <input type="number" name="weightKg" min={35} max={300} step="0.1" placeholder="—" className={field} />
        </label>
        <label className="block">
          <span className={labelText}>Waist (cm)</span>
          <input type="number" name="waistCm" min={40} max={200} step="0.5" placeholder="—" className={field} />
        </label>
        <label className="block">
          <span className={labelText}>Workouts today</span>
          <select name="workouts" defaultValue="0" className={`${field} cursor-pointer`}>
            <option value="0">None</option>
            <option value="1">One</option>
            <option value="2">Two</option>
            <option value="3">Three</option>
          </select>
        </label>
        <label className="block">
          <span className={labelText}>Salah on time</span>
          <select name="prayersOnTime" defaultValue="5" className={`${field} cursor-pointer`}>
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} of 5
              </option>
            ))}
          </select>
        </label>
        <label className="flex cursor-pointer items-center gap-3 self-end rounded-sm border border-linen bg-shell px-3.5 py-2.5">
          <input type="checkbox" name="fasted" className="h-4 w-4 accent-green-800" />
          <span className="text-sm text-ink">I fasted today</span>
        </label>
      </div>

      <label className="mt-4 block">
        <span className={labelText}>Notes</span>
        <input name="notes" maxLength={500} placeholder="How did it feel?" className={field} />
      </label>

      {state.error && <p className="mt-3 text-sm text-red-700">{state.error}</p>}
      {state.ok && <p className="mt-3 text-sm text-green-700">Saved — jazāk Allāhu khayran.</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 w-full cursor-pointer rounded-sm bg-green-800 px-8 py-3.5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-ivory transition-colors hover:bg-green-900 disabled:opacity-70"
      >
        {pending ? "Saving…" : "Save Entry"}
      </button>
    </form>
  );
}

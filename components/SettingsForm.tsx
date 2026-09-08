"use client";

import { useActionState } from "react";
import { updateProfileAction, type SettingsState } from "@/lib/account-actions";
import { CITIES } from "@/lib/prayer/locations";

const initial: SettingsState = {};

const field =
  "mt-1.5 w-full rounded-sm border border-linen bg-shell px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-gold";
const labelText = "text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-ink-muted";

export default function SettingsForm({
  name,
  email,
  citySlug,
}: {
  name: string;
  email: string;
  citySlug: string;
}) {
  const [state, action, pending] = useActionState(updateProfileAction, initial);

  return (
    <form action={action} className="rounded-lg border border-linen bg-sand p-6">
      <h2 className="font-display text-lg font-semibold text-ink">Your details</h2>

      <label className="mt-5 block">
        <span className={labelText}>Name</span>
        <input name="name" required defaultValue={name} minLength={2} maxLength={80} className={field} />
      </label>

      <label className="mt-4 block">
        <span className={labelText}>Email</span>
        <input value={email} readOnly disabled className={`${field} cursor-not-allowed opacity-70`} />
        <span className="mt-1.5 block text-[0.72rem] text-ink-muted">
          Email changes need a verification step — contact us and we&apos;ll move it.
        </span>
      </label>

      <label className="mt-4 block">
        <span className={labelText}>Home city (for prayer times)</span>
        <select name="citySlug" defaultValue={citySlug} className={`${field} cursor-pointer`}>
          <option value="">Not set — guess from my browser</option>
          {CITIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}, {c.country}
            </option>
          ))}
        </select>
        <span className="mt-1.5 block text-[0.72rem] text-ink-muted">
          Your plan anchors its meals and sessions to the prayer times here.
        </span>
      </label>

      {state.error && <p className="mt-4 text-sm text-red-700">{state.error}</p>}
      {state.ok && <p className="mt-4 text-sm text-green-700">Saved.</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 cursor-pointer rounded-sm bg-green-800 px-7 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-ivory transition-colors hover:bg-green-900 disabled:opacity-70"
      >
        {pending ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}

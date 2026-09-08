"use client";

import { useActionState, useState } from "react";
import { acceptInviteAction, type AdminAuthState } from "@/lib/admin/auth-actions";

const initial: AdminAuthState = {};

const RULES = [
  { label: "At least 12 characters", test: (v: string) => v.length >= 12 },
  { label: "One capital letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "One number", test: (v: string) => /\d/.test(v) },
  { label: "One symbol", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

const fieldClass =
  "w-full rounded-md border border-white/15 bg-white/5 px-3.5 py-2.5 text-[0.9rem] text-white outline-none transition-colors placeholder:text-white/30 focus:border-gold-bright focus:bg-white/8";

export default function AcceptInviteForm({
  token,
  email,
  role,
}: {
  token: string;
  email: string;
  role: string;
}) {
  const [state, action, pending] = useActionState(acceptInviteAction, initial);
  const [password, setPassword] = useState("");

  /* Advisory only — the server re-validates length before creating anything. */
  const met = RULES.filter((r) => r.test(password)).length;
  const strength = password.length === 0 ? 0 : (met / RULES.length) * 100;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <div>
        <span className="admin-label text-white/70">Email</span>
        <p className="rounded-md border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-[0.9rem] text-white/60">
          {email}
          <span className="ml-2 rounded-full border border-gold-bright/40 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-gold-bright">
            {role}
          </span>
        </p>
      </div>

      <div>
        <label htmlFor="join-name" className="admin-label text-white/70">
          Your name
        </label>
        <input
          id="join-name"
          name="name"
          required
          minLength={2}
          maxLength={80}
          autoFocus
          autoComplete="name"
          placeholder="Bilal Ahmed"
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="join-password" className="admin-label text-white/70">
          Choose a password
        </label>
        <input
          id="join-password"
          type="password"
          name="password"
          required
          minLength={12}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={fieldClass}
        />

        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full transition-all duration-300 ${
              strength < 50 ? "bg-red-400" : strength < 100 ? "bg-gold-bright" : "bg-green-500"
            }`}
            style={{ width: `${strength}%` }}
          />
        </div>
        <ul className="mt-2 grid grid-cols-2 gap-1">
          {RULES.map((rule) => {
            const ok = rule.test(password);
            return (
              <li
                key={rule.label}
                className={`flex items-center gap-1.5 text-[0.7rem] ${ok ? "text-green-400" : "text-white/35"}`}
              >
                <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {rule.label}
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <label htmlFor="join-confirm" className="admin-label text-white/70">
          Confirm password
        </label>
        <input
          id="join-confirm"
          type="password"
          name="confirm"
          required
          autoComplete="new-password"
          className={fieldClass}
        />
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-md border border-red-400/30 bg-red-500/10 px-3.5 py-2.5 text-[0.82rem] leading-snug text-red-200"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full cursor-pointer rounded-md bg-gold-bright px-6 py-2.5 text-[0.82rem] font-semibold text-rail transition-colors hover:bg-gold-soft disabled:opacity-60"
      >
        {pending ? "Creating your account…" : "Create account & sign in"}
      </button>
    </form>
  );
}

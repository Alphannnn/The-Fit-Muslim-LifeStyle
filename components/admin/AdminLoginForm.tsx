"use client";

import { useActionState, useState } from "react";
import { adminLoginAction, type AdminAuthState } from "@/lib/admin/auth-actions";

const initial: AdminAuthState = {};

export default function AdminLoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(adminLoginAction, initial);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}

      <div>
        <label htmlFor="admin-email" className="admin-label text-white/70">
          Work email
        </label>
        <input
          id="admin-email"
          type="email"
          name="email"
          required
          autoComplete="username"
          autoFocus
          placeholder="you@thefitmuslim.co"
          className="w-full rounded-md border border-white/15 bg-white/5 px-3.5 py-2.5 text-[0.9rem] text-white outline-none transition-colors placeholder:text-white/30 focus:border-gold-bright focus:bg-white/8"
        />
      </div>

      <div>
        <label htmlFor="admin-password" className="admin-label text-white/70">
          Password
        </label>
        <div className="relative">
          <input
            id="admin-password"
            type={showPassword ? "text" : "password"}
            name="password"
            required
            autoComplete="current-password"
            placeholder="••••••••••••"
            className="w-full rounded-md border border-white/15 bg-white/5 px-3.5 py-2.5 pr-11 text-[0.9rem] text-white outline-none transition-colors placeholder:text-white/30 focus:border-gold-bright focus:bg-white/8"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 cursor-pointer place-items-center rounded text-white/40 transition-colors hover:text-white/80"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
              {showPassword ? (
                <path d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.8 2.8M9.4 5.3A9.5 9.5 0 0 1 12 5c5 0 9 4.5 9 7 0 .9-.7 2.2-1.8 3.4M6.2 6.7C4 8.2 3 10.2 3 12c0 2.5 4 7 9 7 1.2 0 2.3-.2 3.3-.6" strokeLinecap="round" />
              ) : (
                <>
                  <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z" />
                  <circle cx="12" cy="12" r="2.5" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {state.error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-md border border-red-400/30 bg-red-500/10 px-3.5 py-2.5 text-[0.82rem] leading-snug text-red-200"
        >
          <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 8v5m0 3.5h.01M12 3l9 16H3l9-16Z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full cursor-pointer rounded-md bg-gold-bright px-6 py-2.5 text-[0.82rem] font-semibold text-rail transition-colors hover:bg-gold-soft disabled:opacity-60"
      >
        {pending ? "Verifying…" : "Sign in"}
      </button>
    </form>
  );
}

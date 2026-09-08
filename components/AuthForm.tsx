"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, signupAction, type AuthState } from "@/lib/auth/actions";

const initial: AuthState = {};

const field =
  "mt-1.5 w-full rounded-sm border border-linen bg-shell px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-gold";
const labelText = "text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-ink-muted";

export default function AuthForm({
  mode,
  next,
}: {
  mode: "login" | "signup";
  next?: string;
}) {
  const isSignup = mode === "signup";
  const [state, action, pending] = useActionState(
    isSignup ? signupAction : loginAction,
    initial,
  );

  return (
    <form action={action} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}

      {isSignup && (
        <label className="block">
          <span className={labelText}>Your name</span>
          <input
            name="name"
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
            placeholder="Ibrahim"
            className={field}
          />
        </label>
      )}

      <label className="block">
        <span className={labelText}>Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className={field}
        />
      </label>

      <label className="block">
        <span className={labelText}>Password</span>
        <input
          type="password"
          name="password"
          required
          minLength={isSignup ? 8 : 1}
          autoComplete={isSignup ? "new-password" : "current-password"}
          placeholder={isSignup ? "At least 8 characters" : "••••••••"}
          className={field}
        />
      </label>

      {state.error && (
        <p className="rounded-sm border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full cursor-pointer rounded-sm bg-green-800 px-8 py-3.5 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-ivory transition-all hover:-translate-y-0.5 hover:bg-green-900 disabled:opacity-70"
      >
        {pending ? "One moment…" : isSignup ? "Create Account" : "Sign In"}
      </button>

      <p className="pt-2 text-center text-[0.8rem] text-ink-muted">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link
              href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
              className="font-semibold text-green-700 underline decoration-gold/50"
            >
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link
              href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
              className="font-semibold text-green-700 underline decoration-gold/50"
            >
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

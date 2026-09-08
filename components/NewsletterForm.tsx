"use client";

import { useActionState } from "react";
import { subscribeAction, type NewsletterState } from "@/lib/newsletter/actions";

const initial: NewsletterState = {};

export default function NewsletterForm({ source = "footer" }: { source?: string }) {
  const [state, action, pending] = useActionState(subscribeAction, initial);

  return (
    <div className="md:ml-auto">
      <form action={action} className="mt-6 flex max-w-sm gap-2 md:ml-auto">
        <input type="hidden" name="source" value={source} />
        <input
          type="email"
          name="email"
          required
          placeholder="Your email"
          aria-label="Email address"
          className="w-full rounded-sm border border-linen bg-shell px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-gold"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 cursor-pointer rounded-sm bg-green-800 px-5 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-ivory transition-all hover:-translate-y-0.5 hover:bg-green-900 disabled:opacity-70"
        >
          {pending ? "…" : "Subscribe"}
        </button>
      </form>

      {state.message && (
        <p
          className={`mt-2.5 max-w-sm text-[0.78rem] md:ml-auto md:text-right ${
            state.ok ? "text-green-700" : "text-red-700"
          }`}
        >
          {state.message}
        </p>
      )}
    </div>
  );
}

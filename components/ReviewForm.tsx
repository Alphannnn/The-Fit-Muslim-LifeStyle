"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { submitReviewAction, type ReviewState } from "@/lib/reviews/actions";
import { isSignedInAction } from "@/lib/auth/actions";

const initial: ReviewState = {};

export default function ReviewForm({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState(submitReviewAction, initial);
  const [rating, setRating] = useState(5);
  /* Asked for on the client so the product page itself stays static. */
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    isSignedInAction()
      .then((value) => active && setSignedIn(value))
      .catch(() => active && setSignedIn(false));
    return () => {
      active = false;
    };
  }, []);

  if (signedIn === null) {
    return (
      <div className="h-40 animate-pulse rounded-lg border border-linen bg-sand" aria-hidden />
    );
  }

  if (!signedIn) {
    return (
      <div className="rounded-lg border border-linen bg-sand p-6 text-center">
        <p className="font-serif text-lg text-ink">Bought this?</p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-soft">
          Sign in to leave a review — purchases are verified automatically, so your
          review publishes straight away.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-block rounded-sm bg-green-800 px-7 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-ivory transition-colors hover:bg-green-900"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (state.ok) {
    return (
      <div className="rounded-lg border border-green-500/35 bg-green-800/6 p-6 text-center">
        <p className="font-serif text-lg text-green-800">Jazāk Allāhu khayran</p>
        <p className="mt-1.5 text-sm text-ink-soft">
          {state.error ?? "Your review is live — thank you for helping others choose well."}
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="rounded-lg border border-linen bg-sand p-6">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />

      <h3 className="font-display text-lg font-semibold text-ink">Write a review</h3>

      <fieldset className="mt-4">
        <legend className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-ink-muted">
          Your rating
        </legend>
        <div className="mt-2 flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              aria-pressed={rating === n}
              className="cursor-pointer transition-transform hover:scale-110"
            >
              <svg viewBox="0 0 20 20" className="h-6 w-6">
                <path
                  d="M10 1.6l2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z"
                  fill={n <= rating ? "var(--color-gold)" : "var(--color-linen)"}
                />
              </svg>
            </button>
          ))}
        </div>
      </fieldset>

      <label className="mt-5 block">
        <span className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-ink-muted">
          Headline
        </span>
        <input
          name="title"
          maxLength={120}
          placeholder="Sums it up in a line"
          className="mt-1.5 w-full rounded-sm border border-linen bg-ivory px-4 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-gold"
        />
      </label>

      <label className="mt-4 block">
        <span className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-ink-muted">
          Your review
        </span>
        <textarea
          name="body"
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          placeholder="What did you actually think? What would you tell a friend?"
          className="mt-1.5 w-full resize-y rounded-sm border border-linen bg-ivory px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-gold"
        />
      </label>

      {state.error && <p className="mt-3 text-sm text-red-700">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 w-full cursor-pointer rounded-sm bg-green-800 px-8 py-3.5 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-ivory transition-colors hover:bg-green-900 disabled:opacity-70"
      >
        {pending ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  );
}

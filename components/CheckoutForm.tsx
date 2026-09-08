"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";

type Props = {
  defaultEmail: string;
  defaultName: string;
  needsAddress: boolean;
  stripeReady: boolean;
};

export default function CheckoutForm({
  defaultEmail,
  defaultName,
  needsAddress,
  stripeReady,
}: Props) {
  const { cart } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const payload = {
      email: String(form.get("email") ?? ""),
      name: String(form.get("name") ?? ""),
      address: needsAddress
        ? {
            line1: String(form.get("line1") ?? ""),
            line2: String(form.get("line2") ?? ""),
            city: String(form.get("city") ?? ""),
            postalCode: String(form.get("postalCode") ?? ""),
            country: String(form.get("country") ?? ""),
          }
        : undefined,
    };

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      /* Leaves the SPA entirely — either to Stripe or to our own settlement. */
      window.location.assign(data.url);
    } catch {
      setError("We couldn't reach the server. Please check your connection.");
      setSubmitting(false);
    }
  }

  const field =
    "mt-1.5 w-full rounded-sm border border-linen bg-shell px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-gold";
  const labelText = "text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-ink-muted";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <fieldset className="rounded-lg border border-linen bg-shell p-6">
        <legend className="px-2 font-display text-sm font-semibold tracking-[0.14em] text-ink uppercase">
          Your details
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelText}>Full name</span>
            <input name="name" required defaultValue={defaultName} minLength={2} maxLength={80} className={field} />
          </label>
          <label className="block">
            <span className={labelText}>Email</span>
            <input
              type="email"
              name="email"
              required
              defaultValue={defaultEmail}
              placeholder="you@example.com"
              className={field}
            />
          </label>
        </div>
        <p className="mt-3 text-[0.72rem] text-ink-muted">
          Your receipt and any digital downloads go to this address.
        </p>
      </fieldset>

      {needsAddress && (
        <fieldset className="rounded-lg border border-linen bg-shell p-6">
          <legend className="px-2 font-display text-sm font-semibold tracking-[0.14em] text-ink uppercase">
            Delivery address
          </legend>
          <div className="grid gap-4">
            <label className="block">
              <span className={labelText}>Address line 1</span>
              <input name="line1" required maxLength={120} className={field} />
            </label>
            <label className="block">
              <span className={labelText}>Address line 2 (optional)</span>
              <input name="line2" maxLength={120} className={field} />
            </label>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className={labelText}>City</span>
                <input name="city" required maxLength={80} className={field} />
              </label>
              <label className="block">
                <span className={labelText}>Postcode</span>
                <input name="postalCode" required maxLength={24} className={field} />
              </label>
              <label className="block">
                <span className={labelText}>Country</span>
                <input name="country" required maxLength={60} defaultValue="United Kingdom" className={field} />
              </label>
            </div>
          </div>
        </fieldset>
      )}

      {error && (
        <p className="rounded-sm border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || cart.count === 0}
        className="group relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-sm bg-green-800 px-8 py-4 text-[0.74rem] font-semibold uppercase tracking-[0.2em] text-ivory shadow-[0_16px_36px_-18px_rgba(13,40,28,0.85)] transition-all hover:-translate-y-0.5 hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="relative z-10">
          {submitting
            ? "Taking you to payment…"
            : stripeReady
              ? "Pay Securely"
              : "Place Order"}
        </span>
        <span className="absolute inset-0 -left-full z-0 h-full w-1/2 skew-x-[-20deg] bg-white/25 transition-all duration-700 group-hover:left-[150%]" />
      </button>

      <p className="text-center text-[0.72rem] text-ink-muted">
        {stripeReady
          ? "Payment is handled by Stripe. We never see your card details."
          : "No payment provider is connected yet — this order will settle in test mode."}
      </p>
    </form>
  );
}

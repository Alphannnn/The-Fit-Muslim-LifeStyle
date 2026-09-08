import Stripe from "stripe";

/* Stripe is optional at runtime. With no key configured the checkout falls
   back to a clearly-labelled test settlement (see lib/orders.ts) so the whole
   purchase flow stays exercisable in development. */

let cached: Stripe | null = null;

export function stripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  cached ??= new Stripe(key, { typescript: true });
  return cached;
}

export const stripeEnabled = (): boolean => Boolean(process.env.STRIPE_SECRET_KEY);

export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

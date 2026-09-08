export const CURRENCY = "USD";

const SYMBOLS: Record<string, string> = { USD: "$", GBP: "£", EUR: "€" };

const symbolFor = (currency: string) => SYMBOLS[currency] ?? `${currency} `;

function parts(cents: number) {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.round(cents));
  const whole = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return { sign, whole, fraction: (abs % 100).toString().padStart(2, "0") };
}

/** Storefront pricing — a whole amount drops the `.00` ("$24", "$44.95"). */
export function formatMoney(cents: number, currency = CURRENCY) {
  const { sign, whole, fraction } = parts(cents);
  const body = fraction === "00" ? whole : `${whole}.${fraction}`;
  return `${sign}${symbolFor(currency)}${body}`;
}

/** Receipts, order totals and emails — always two decimal places. */
export function formatMoneyExact(cents: number, currency = CURRENCY) {
  const { sign, whole, fraction } = parts(cents);
  return `${sign}${symbolFor(currency)}${whole}.${fraction}`;
}

export function discountPercent(priceCents: number, compareAtCents?: number | null) {
  if (!compareAtCents || compareAtCents <= priceCents) return 0;
  return Math.round((1 - priceCents / compareAtCents) * 100);
}

/* ------------------------------- shipping ------------------------------- */

export const FREE_SHIPPING_OVER_CENTS = 5000;
export const FLAT_SHIPPING_CENTS = 595;

/** Digital-only baskets never pay delivery. */
export function shippingFor(subtotalCents: number, hasPhysical: boolean) {
  if (!hasPhysical || subtotalCents === 0) return 0;
  return subtotalCents >= FREE_SHIPPING_OVER_CENTS ? 0 : FLAT_SHIPPING_CENTS;
}

/* --------------------------------- totals -------------------------------- */

export type Totals = {
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
};

/* Tax is left at zero by default: Stripe Tax computes the real figure at
   checkout from the customer's address, which is the only correct place to do
   it. Set TAX_RATE_BPS (basis points) to charge a flat rate instead. */
const taxRateBps = () => Number(process.env.TAX_RATE_BPS ?? 0);

export function totalsFor(
  lines: { lineTotalCents: number }[],
  hasPhysical: boolean,
): Totals {
  const subtotalCents = lines.reduce((sum, l) => sum + l.lineTotalCents, 0);
  const shippingCents = shippingFor(subtotalCents, hasPhysical);
  const taxCents = Math.round(((subtotalCents + shippingCents) * taxRateBps()) / 10_000);
  return {
    subtotalCents,
    shippingCents,
    taxCents,
    totalCents: subtotalCents + shippingCents + taxCents,
  };
}

/** How much more the basket needs for free delivery — 0 once unlocked. */
export const freeShippingRemaining = (subtotalCents: number) =>
  Math.max(0, FREE_SHIPPING_OVER_CENTS - subtotalCents);

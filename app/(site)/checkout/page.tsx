import type { Metadata } from "next";
import Link from "next/link";
import CheckoutForm from "@/components/CheckoutForm";
import { getCurrentUser } from "@/lib/auth/session";
import { readCart } from "@/lib/cart/server";
import { formatMoney } from "@/lib/money";
import { stripeEnabled } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const [{ cancelled }, cart, user] = await Promise.all([
    searchParams,
    readCart(),
    getCurrentUser(),
  ]);

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-6 pt-40 pb-32 text-center">
        <h1 className="font-display text-3xl font-semibold text-ink">Your cart is empty</h1>
        <p className="mt-4 font-serif text-lg text-ink-soft">
          Add something worth having, then come back.
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-block rounded-sm bg-green-800 px-8 py-3.5 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-ivory transition-colors hover:bg-green-900"
        >
          Browse the Store
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 pt-32 pb-24 md:pt-40">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 text-center">
          <p className="mb-4 text-[0.66rem] font-semibold uppercase tracking-[0.32em] text-gold-deep">
            Secure Checkout
          </p>
          <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
            Almost <span className="text-gold-gradient">yours</span>
          </h1>
        </header>

        {cancelled && (
          <p className="mx-auto mb-8 max-w-xl rounded-sm border border-gold/45 bg-gold/8 px-4 py-3 text-center text-sm text-gold-deep">
            Payment was cancelled — nothing has been charged. Your cart is untouched.
          </p>
        )}

        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <CheckoutForm
              defaultEmail={user?.email ?? ""}
              defaultName={user?.name ?? ""}
              needsAddress={cart.hasPhysical}
              stripeReady={stripeEnabled()}
            />

            {!user && (
              <p className="mt-6 text-center text-[0.78rem] text-ink-muted">
                Have an account?{" "}
                <Link
                  href="/login?next=/checkout"
                  className="font-semibold text-green-700 underline decoration-gold/50"
                >
                  Sign in
                </Link>{" "}
                so this order appears in your history.
              </p>
            )}
          </div>

          {/* order summary */}
          <aside className="lg:col-span-5">
            <div className="sticky top-28 rounded-lg border border-linen bg-sand p-6">
              <h2 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-ink">
                Order summary
              </h2>

              <ul className="mt-5 divide-y divide-linen">
                {cart.lines.map((line) => (
                  <li key={line.productId} className="flex gap-4 py-4">
                    <div className="grid h-20 w-16 shrink-0 place-items-center overflow-hidden rounded-sm border border-linen bg-ivory">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={line.image}
                        alt=""
                        className="h-full w-full object-contain p-1.5"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-serif text-base text-ink">{line.name}</p>
                      <p className="text-[0.6rem] font-medium uppercase tracking-[0.18em] text-ink-muted">
                        {line.subtitle}
                      </p>
                      <p className="mt-1.5 text-[0.72rem] text-ink-muted">
                        {line.kind === "subscription"
                          ? "Monthly subscription"
                          : `Qty ${line.qty}`}
                      </p>
                    </div>
                    <span className="font-display text-sm font-semibold text-ink">
                      {formatMoney(line.lineTotalCents, cart.currency)}
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="mt-5 space-y-2 border-t border-linen pt-5 text-[0.82rem]">
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Subtotal</dt>
                  <dd className="font-semibold text-ink">
                    {formatMoney(cart.totals.subtotalCents, cart.currency)}
                  </dd>
                </div>
                {cart.hasPhysical && (
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">Delivery</dt>
                    <dd className={cart.totals.shippingCents === 0 ? "font-semibold text-green-700" : "text-ink"}>
                      {cart.totals.shippingCents === 0
                        ? "Free"
                        : formatMoney(cart.totals.shippingCents, cart.currency)}
                    </dd>
                  </div>
                )}
                {cart.totals.taxCents > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">Tax</dt>
                    <dd className="text-ink">
                      {formatMoney(cart.totals.taxCents, cart.currency)}
                    </dd>
                  </div>
                )}
                <div className="flex items-baseline justify-between border-t border-linen pt-3">
                  <dt className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-ink-muted">
                    Total
                  </dt>
                  <dd className="font-display text-2xl font-semibold text-ink">
                    {formatMoney(cart.totals.totalCents, cart.currency)}
                  </dd>
                </div>
              </dl>

              <p className="mt-5 border-t border-linen pt-4 text-[0.72rem] leading-relaxed text-ink-muted">
                Prices are recalculated on our server at this step, so what you see here
                is exactly what is charged.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

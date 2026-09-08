"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "./CartProvider";
import { FREE_SHIPPING_OVER_CENTS, formatMoney } from "@/lib/money";

const ease = [0.22, 0.61, 0.36, 1] as const;

export default function CartDrawer() {
  const { cart, count, pending, setQty, remove, isOpen, closeCart } = useCart();
  const { totals, hasPhysical } = cart;

  const remaining = Math.max(0, FREE_SHIPPING_OVER_CENTS - totals.subtotalCents);
  const progress = Math.min(100, (totals.subtotalCents / FREE_SHIPPING_OVER_CENTS) * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-60">
          {/* backdrop */}
          <motion.button
            type="button"
            aria-label="Close cart"
            onClick={closeCart}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease }}
            className="absolute inset-0 h-full w-full cursor-default bg-ink/35 backdrop-blur-[2px]"
          />

          {/* panel */}
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.5, ease }}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-linen bg-ivory shadow-[0_0_60px_-10px_rgba(21,24,21,0.35)]"
          >
            {/* header */}
            <header className="flex items-center justify-between border-b border-linen px-6 py-5">
              <div>
                <h2 className="font-display text-xl font-semibold text-ink">Your Cart</h2>
                <p className="mt-0.5 text-[0.62rem] font-medium uppercase tracking-[0.24em] text-ink-muted">
                  {count === 0 ? "Empty" : `${count} item${count > 1 ? "s" : ""}`}
                </p>
              </div>
              <button
                type="button"
                onClick={closeCart}
                aria-label="Close cart"
                className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-linen text-ink-soft transition-colors hover:border-gold hover:text-green-800"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </header>

            {/* free-delivery progress — only meaningful when something ships */}
            {count > 0 && hasPhysical && (
              <div className="border-b border-linen bg-sand px-6 py-4">
                <p className="text-[0.7rem] text-ink-soft">
                  {remaining > 0 ? (
                    <>
                      You&apos;re <strong className="text-ink">{formatMoney(remaining)}</strong>{" "}
                      away from free delivery
                    </>
                  ) : (
                    <span className="font-semibold text-green-700">Free delivery unlocked</span>
                  )}
                </p>
                <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-linen">
                  <motion.div
                    className="h-full rounded-full bg-linear-to-r from-gold-deep to-gold"
                    initial={false}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6, ease }}
                  />
                </div>
              </div>
            )}

            {/* lines */}
            <div className="flex-1 overflow-y-auto px-6">
              {count === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                  <svg viewBox="0 0 48 48" className="h-12 w-12 text-gold/50">
                    <path
                      d="M12 16h24l-2.5 22h-19L12 16Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinejoin="round"
                    />
                    <path d="M18 16a6 6 0 0 1 12 0" fill="none" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                  <p className="mt-5 font-serif text-lg text-ink">Your cart is empty</p>
                  <p className="mt-1.5 max-w-[16rem] text-sm text-ink-muted">
                    Nothing here yet — start with the planner your children will actually
                    reach for.
                  </p>
                  <Link
                    href="/shop"
                    onClick={closeCart}
                    className="mt-6 cursor-pointer rounded-sm bg-green-800 px-7 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-ivory transition-colors hover:bg-green-900"
                  >
                    Browse the Store
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-linen">
                  <AnimatePresence initial={false}>
                    {cart.lines.map((line) => (
                      <motion.li
                        key={line.productId}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.35, ease }}
                        className="flex gap-4 py-5"
                      >
                        <Link
                          href={`/product/${line.slug}`}
                          onClick={closeCart}
                          className="grid h-24 w-20 shrink-0 place-items-center overflow-hidden rounded-sm border border-linen bg-sand"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={line.image}
                            alt={`${line.name} ${line.subtitle}`}
                            className="h-full w-full object-contain p-1.5"
                          />
                        </Link>

                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <Link
                                href={`/product/${line.slug}`}
                                onClick={closeCart}
                                className="truncate font-serif text-base text-ink transition-colors hover:text-green-800"
                              >
                                {line.name}
                              </Link>
                              <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-ink-muted">
                                {line.subtitle}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => remove(line.productId)}
                              aria-label={`Remove ${line.name} from cart`}
                              className="cursor-pointer text-ink-muted transition-colors hover:text-green-800"
                            >
                              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                              </svg>
                            </button>
                          </div>

                          {/* subscriptions and digital goods are one-per-cart */}
                          <div className="mt-auto flex items-center justify-between pt-3">
                            {line.kind === "physical" ? (
                              <div className="flex items-center rounded-sm border border-linen bg-shell">
                                <button
                                  type="button"
                                  onClick={() => setQty(line.productId, line.qty - 1)}
                                  aria-label="Decrease quantity"
                                  className="cursor-pointer px-3 py-1.5 text-base leading-none text-ink-soft transition-colors hover:text-green-800"
                                >
                                  −
                                </button>
                                <span className="w-7 text-center text-sm font-semibold text-ink">
                                  {line.qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setQty(line.productId, line.qty + 1)}
                                  disabled={line.stock !== null && line.qty >= line.stock}
                                  aria-label="Increase quantity"
                                  className="cursor-pointer px-3 py-1.5 text-base leading-none text-ink-soft transition-colors hover:text-green-800 disabled:cursor-not-allowed disabled:text-linen"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <span className="rounded-full border border-linen bg-sand px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                                {line.kind === "digital" ? "Digital" : "Monthly"}
                              </span>
                            )}
                            <span className="font-display text-base font-semibold text-ink">
                              {formatMoney(line.lineTotalCents, cart.currency)}
                            </span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {/* footer */}
            {count > 0 && (
              <footer className="border-t border-linen bg-sand px-6 py-5">
                <dl className="space-y-1.5 text-[0.78rem]">
                  <div className="flex items-baseline justify-between">
                    <dt className="text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-ink-muted">
                      Subtotal
                    </dt>
                    <dd className="font-semibold text-ink">
                      {formatMoney(totals.subtotalCents, cart.currency)}
                    </dd>
                  </div>
                  {hasPhysical && (
                    <div className="flex items-baseline justify-between">
                      <dt className="text-ink-muted">Delivery</dt>
                      <dd className={totals.shippingCents === 0 ? "font-semibold text-green-700" : "text-ink"}>
                        {totals.shippingCents === 0
                          ? "Free"
                          : formatMoney(totals.shippingCents, cart.currency)}
                      </dd>
                    </div>
                  )}
                  {totals.taxCents > 0 && (
                    <div className="flex items-baseline justify-between">
                      <dt className="text-ink-muted">Tax</dt>
                      <dd className="text-ink">{formatMoney(totals.taxCents, cart.currency)}</dd>
                    </div>
                  )}
                  <div className="flex items-baseline justify-between border-t border-linen pt-2.5">
                    <dt className="text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-ink-muted">
                      Total
                    </dt>
                    <dd className="font-display text-2xl font-semibold text-ink">
                      {formatMoney(totals.totalCents, cart.currency)}
                    </dd>
                  </div>
                </dl>

                <Link
                  href="/checkout"
                  onClick={closeCart}
                  aria-disabled={pending}
                  className="group relative mt-5 flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-sm bg-green-800 px-8 py-4 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-ivory transition-colors hover:bg-green-900"
                >
                  <span className="relative z-10">
                    Checkout · {formatMoney(totals.totalCents, cart.currency)}
                  </span>
                  <span className="absolute inset-0 -left-full z-0 h-full w-1/2 skew-x-[-20deg] bg-white/25 transition-all duration-700 group-hover:left-[150%]" />
                </Link>

                <button
                  type="button"
                  onClick={closeCart}
                  className="mt-3 w-full cursor-pointer text-center text-[0.68rem] font-medium uppercase tracking-[0.18em] text-ink-muted transition-colors hover:text-green-800"
                >
                  Continue Shopping
                </button>
              </footer>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

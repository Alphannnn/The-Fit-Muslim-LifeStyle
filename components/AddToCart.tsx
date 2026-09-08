"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";
import { formatMoney } from "@/lib/money";
import type { ProductKind } from "@/lib/db/schema";

/**
 * Quantity + add-to-cart. The price shown here is only ever a preview — the
 * amount charged is recomputed from the products table at checkout.
 */
export default function AddToCart({
  productId,
  priceCents,
  currency,
  kind,
  stock,
  layout = "full",
}: {
  productId: string;
  priceCents: number;
  currency: string;
  kind: ProductKind;
  stock: number | null;
  layout?: "full" | "compact";
}) {
  const { add, pending } = useCart();
  const [qty, setQty] = useState(1);

  const soldOut = stock !== null && stock <= 0;
  const ceiling = stock === null ? 9 : Math.min(9, stock);
  const showQty = kind === "physical" && layout === "full";

  if (soldOut) {
    return (
      <button
        type="button"
        disabled
        className={`flex w-full cursor-not-allowed items-center justify-center rounded-sm border border-linen bg-sand font-semibold uppercase tracking-[0.2em] text-ink-muted ${
          layout === "compact" ? "px-5 py-2.5 text-[0.64rem]" : "px-8 py-4 text-[0.72rem]"
        }`}
      >
        {layout === "compact" ? "Sold Out" : "Sold Out — Restocking Soon"}
      </button>
    );
  }

  /* On a card there is no room for the price — it is already displayed
     right above the button. */
  const label =
    layout === "compact"
      ? kind === "subscription"
        ? "Start Your Plan"
        : "Add to Cart"
      : kind === "subscription"
        ? `Start Your Plan — ${formatMoney(priceCents, currency)}/mo`
        : `Add to Cart — ${formatMoney(priceCents * qty, currency)}`;

  return (
    <div className={layout === "full" ? "flex flex-col gap-3 sm:flex-row sm:items-stretch" : ""}>
      {showQty && (
        <div className="flex items-center rounded-sm border border-linen bg-shell">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            className="h-full cursor-pointer px-4 py-3.5 text-lg leading-none text-ink-soft transition-colors hover:text-green-800"
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-semibold text-ink">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(ceiling, q + 1))}
            aria-label="Increase quantity"
            className="h-full cursor-pointer px-4 py-3.5 text-lg leading-none text-ink-soft transition-colors hover:text-green-800 disabled:text-linen"
            disabled={qty >= ceiling}
          >
            +
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => add(productId, kind === "physical" ? qty : 1)}
        disabled={pending}
        className={`group/btn relative flex flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-sm bg-green-800 font-semibold uppercase tracking-[0.2em] text-ivory shadow-[0_14px_34px_-16px_rgba(13,40,28,0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-green-900 hover:shadow-[0_18px_40px_-16px_rgba(13,40,28,0.9)] disabled:opacity-70 ${
          layout === "compact"
            ? "w-full px-5 py-2.5 text-[0.64rem]"
            : "px-8 py-4 text-[0.72rem]"
        }`}
      >
        <span className="relative z-10">{pending ? "Adding…" : label}</span>
        <span className="absolute inset-0 -left-full z-0 h-full w-1/2 skew-x-[-20deg] bg-white/25 transition-all duration-700 group-hover/btn:left-[150%]" />
      </button>
    </div>
  );
}

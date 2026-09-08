import Link from "next/link";
import AddToCart from "./AddToCart";
import type { ProductWithRating } from "@/lib/catalog";
import { discountPercent, formatMoney } from "@/lib/money";
import Stars from "./ui/Stars";
import { HalalPill } from "./ui/HalalBadge";

const KIND_LABEL: Record<string, string> = {
  digital: "Instant download",
  subscription: "Monthly",
};

export default function ProductCard({ product }: { product: ProductWithRating }) {
  const save = discountPercent(product.priceCents, product.compareAtCents);
  const soldOut = product.stock !== null && product.stock <= 0;
  const lowStock = product.stock !== null && product.stock > 0 && product.stock <= 12;

  /* The whole card is clickable via an overlay link rather than by wrapping
     everything in an anchor — that keeps the quick-add button a real sibling
     button instead of an invalid button-inside-a-link. */
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-linen bg-shell shadow-[0_2px_10px_-6px_rgba(21,24,21,0.16)] transition-all duration-500 focus-within:border-gold/60 hover:-translate-y-1.5 hover:border-gold/45 hover:shadow-[0_26px_50px_-24px_rgba(21,24,21,0.35)]">
      <div className="relative aspect-4/3 overflow-hidden border-b border-linen bg-sand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={`${product.name} — ${product.subtitle}`}
          loading="lazy"
          className="h-full w-full object-contain p-4 transition-transform duration-700 ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover:scale-[1.06]"
        />

        {/* a gold wash that only appears on hover, to lift the image */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(80% 70% at 50% 100%, rgba(169,127,34,0.10), transparent 70%)",
          }}
        />

        <div className="pointer-events-none absolute left-4 top-4 flex flex-col items-start gap-2">
          {save > 0 && (
            <span className="rounded-full bg-green-800 px-3 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-ivory shadow-[0_6px_16px_-8px_rgba(13,40,28,0.9)]">
              Save {save}%
            </span>
          )}
          {KIND_LABEL[product.kind] && (
            <span className="rounded-full border border-gold/50 bg-ivory/90 px-3 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-gold-deep backdrop-blur-sm">
              {KIND_LABEL[product.kind]}
            </span>
          )}
        </div>

        {soldOut && (
          <span className="pointer-events-none absolute right-4 top-4 rounded-full bg-ink/80 px-3 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-ivory">
            Sold out
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="text-[0.58rem] font-semibold uppercase tracking-[0.26em] text-green-700">
          {product.subtitle}
        </p>

        <h3 className="mt-1.5 font-display text-xl font-semibold leading-snug text-ink transition-colors group-hover:text-green-800">
          {/* the overlay link — covers the card, but sits under the button */}
          <Link href={`/product/${product.slug}`} className="after:absolute after:inset-0 after:z-0">
            {product.name}
          </Link>
        </h3>

        <p className="mt-2.5 flex-1 font-serif text-[0.95rem] leading-relaxed text-ink-soft">
          {product.tagline}
        </p>

        {product.rating && product.rating.count > 0 && (
          <div className="mt-4 flex items-center gap-2">
            <Stars value={product.rating.average} id={product.id} />
            <span className="text-[0.7rem] text-ink-muted">
              {product.rating.average} · {product.rating.count}{" "}
              {product.rating.count === 1 ? "review" : "reviews"}
            </span>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <HalalPill product={product} />
          {lowStock && (
            <span className="rounded-full border border-gold/40 bg-gold/8 px-2.5 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-gold-deep">
              Only {product.stock} left
            </span>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-linen pt-4">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-xl font-semibold text-ink">
              {formatMoney(product.priceCents, product.currency)}
              {product.kind === "subscription" && (
                <span className="text-[0.7rem] font-medium text-ink-muted">/mo</span>
              )}
            </span>
            {product.compareAtCents && (
              <span className="font-display text-sm text-ink-muted line-through">
                {formatMoney(product.compareAtCents, product.currency)}
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-green-700 transition-all group-hover:gap-2.5">
            View
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>

        {/* Quick add. Sits above the overlay link, and stays reachable by
            keyboard even though it only becomes visible on hover. */}
        <div className="relative z-10 mt-3 opacity-0 transition-all duration-300 group-focus-within:opacity-100 group-hover:opacity-100 max-lg:opacity-100">
          <AddToCart
            productId={product.id}
            priceCents={product.priceCents}
            currency={product.currency}
            kind={product.kind}
            stock={product.stock}
            layout="compact"
          />
        </div>
      </div>
    </article>
  );
}

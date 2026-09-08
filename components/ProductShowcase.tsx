import Link from "next/link";
import AddToCart from "./AddToCart";
import ProductMedia from "./ProductMedia";
import Reveal, { SectionEyebrow } from "./Reveal";
import Stars from "./ui/Stars";
import type { ProductWithRating } from "@/lib/catalog";
import { FREE_SHIPPING_OVER_CENTS, discountPercent, formatMoney } from "@/lib/money";

/* Reassurance belongs here as one quiet line. Iconed badges turned the panel
   into a second focal point and pulled the eye away from the price. */
const TRUST = ["Scholar-reviewed", "Ships worldwide", "Secure checkout"];

/* The full pillar list wraps to two rows of chips and reads as clutter; three
   set as a single line says the same thing in a quarter of the space. */
const PILLARS_SHOWN = 3;

/** The landing page's hero product, read from the catalogue. */
export default function ProductShowcase({ product }: { product: ProductWithRating }) {
  const save = discountPercent(product.priceCents, product.compareAtCents);
  const soldOut = product.stock !== null && product.stock <= 0;

  return (
    <section id="product" className="relative px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mb-14 text-center">
          <SectionEyebrow>The Collection</SectionEyebrow>
          <h2 className="font-display text-4xl font-bold tracking-[-0.02em] text-ink sm:text-5xl">
            Curated for <span className="text-gold-deep">Body &amp; Deen</span>
          </h2>
        </Reveal>

        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <Reveal className="lg:col-span-7">
            <ProductMedia
              image={product.image}
              alt={`${product.name} — ${product.subtitle}`}
              video={product.video}
              poster={product.videoPoster}
            />
          </Reveal>

          <Reveal delay={0.12} className="lg:col-span-5">
            {/* Eyebrow and rating share a row — two separate lines of meta above
                the title made the panel feel top-heavy. */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.3em] text-green-700">
                For Little Muslims
              </p>
              {product.rating && product.rating.count > 0 && (
                <span className="flex items-center gap-2">
                  <Stars value={product.rating.average} id={product.id} />
                  <span className="text-[0.7rem] text-ink-muted">
                    {product.rating.average} · {product.rating.count} reviews
                  </span>
                </span>
              )}
            </div>

            <h3 className="mt-4 font-display text-[2.7rem] font-bold leading-[1.02] tracking-[-0.025em] text-ink sm:text-5xl">
              <Link href={`/product/${product.slug}`} className="transition-colors hover:text-green-800">
                {product.name}
              </Link>
              <br />
              <span className="text-gold-deep">{product.subtitle}</span>
            </h3>

            <p className="mt-5 font-serif text-xl leading-snug text-ink-soft">
              {product.tagline}
            </p>

            {product.pillars.length > 0 && (
              <p className="mt-4 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-ink-muted">
                {product.pillars.slice(0, PILLARS_SHOWN).join("  ·  ")}
              </p>
            )}

            <div className="mt-8 flex flex-wrap items-baseline gap-3 border-t border-linen pt-8">
              <span className="font-display text-4xl font-bold tracking-[-0.02em] text-ink">
                {formatMoney(product.priceCents, product.currency)}
              </span>
              {product.compareAtCents && (
                <>
                  <span className="font-display text-lg text-ink-muted line-through">
                    {formatMoney(product.compareAtCents, product.currency)}
                  </span>
                  <span className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-gold-deep">
                    Save {save}%
                  </span>
                </>
              )}
            </div>

            <p className="mt-2 flex items-center gap-2 text-[0.72rem] text-ink-muted">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  soldOut ? "bg-ink-muted" : "bg-green-500"
                }`}
              />
              {soldOut
                ? "Out of stock — restocking soon"
                : `In stock · free delivery over ${formatMoney(FREE_SHIPPING_OVER_CENTS)}`}
            </p>

            <div className="mt-6">
              <AddToCart
                productId={product.id}
                priceCents={product.priceCents}
                currency={product.currency}
                kind={product.kind}
                stock={product.stock}
              />
            </div>

            {/* The detail page is a quiet second step, not a rival to the buy
                button — a text link keeps one clear action in the panel. */}
            <Link
              href={`/product/${product.slug}`}
              className="mt-5 inline-block text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-ink-muted underline decoration-gold/50 underline-offset-[6px] transition-colors hover:text-gold-deep"
            >
              See the full detail
            </Link>

            {product.specs.length > 0 && (
              <dl className="mt-9 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-linen pt-8">
                {product.specs.slice(0, 4).map((s) => (
                  <div key={s.k}>
                    <dt className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-ink-muted">
                      {s.k}
                    </dt>
                    <dd className="mt-1.5 font-serif text-base text-ink">{s.v}</dd>
                  </div>
                ))}
              </dl>
            )}

            <p className="mt-8 border-t border-linen pt-6 text-[0.68rem] uppercase tracking-[0.16em] text-ink-muted">
              {TRUST.join("  ·  ")}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

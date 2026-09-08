import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import AddToCart from "@/components/AddToCart";
import JsonLd from "@/components/JsonLd";
import ProductCard from "@/components/ProductCard";
import ProductMedia from "@/components/ProductMedia";
import Reveal, { SectionEyebrow } from "@/components/Reveal";
import ReviewForm from "@/components/ReviewForm";
import HalalBadge from "@/components/ui/HalalBadge";
import Stars from "@/components/ui/Stars";
import { getProductBySlug, getProductReviews, getProducts } from "@/lib/catalog";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { renderMarkdown } from "@/lib/markdown";
import { FREE_SHIPPING_OVER_CENTS, discountPercent, formatMoney } from "@/lib/money";
import { SITE, siteOrigin } from "@/lib/site";

export const revalidate = 300;

export async function generateStaticParams() {
  const rows = await db
    .select({ slug: products.slug })
    .from(products)
    .where(eq(products.active, true))
    .all();
  return rows.map((r) => ({ slug: r.slug }));
}

/** Absolute URL for social cards — relative paths are ignored by crawlers. */
const absolute = (path: string) =>
  path.startsWith("http") ? path : `${siteOrigin()}${path}`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Not found" };

  const title = `${product.name} — ${product.subtitle}`;
  const description = product.tagline || product.description.slice(0, 155);

  return {
    title,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${title} · ${SITE.name}`,
      description,
      url: `${siteOrigin()}/product/${product.slug}`,
      images: [{ url: absolute(product.image), alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${SITE.name}`,
      description,
      images: [absolute(product.image)],
    },
  };
}

const TRUST = [
  {
    label: "Scholar-reviewed",
    icon: (
      <path
        d="M12 3l3 2h4v4l2 3-2 3v4h-4l-3 2-3-2H5v-4l-2-3 2-3V5h4l3-2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    ),
  },
  {
    label: "Ships worldwide",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        />
      </>
    ),
  },
  {
    label: "Secure checkout",
    icon: (
      <>
        <rect x="5" y="10" width="14" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </>
    ),
  },
];

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [reviews, everything] = await Promise.all([
    getProductReviews(product.id),
    getProducts(),
  ]);

  const related = everything.filter((p) => p.id !== product.id).slice(0, 3);
  const save = discountPercent(product.priceCents, product.compareAtCents);
  const soldOut = product.stock !== null && product.stock <= 0;
  const origin = siteOrigin();

  const stockLine = soldOut
    ? "Out of stock — restocking soon"
    : product.kind === "digital"
      ? "Delivered instantly to your account"
      : product.kind === "subscription"
        ? "Cancel any time · coach-reviewed monthly"
        : product.stock !== null && product.stock <= 12
          ? `Only ${product.stock} left · ships in 2–3 days`
          : "In stock · ships in 2–3 days";

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: `${product.name} ${product.subtitle}`.trim(),
          description: product.tagline || product.description.slice(0, 300),
          image: [absolute(product.image)],
          sku: product.slug,
          brand: { "@type": "Brand", name: SITE.name },
          offers: {
            "@type": "Offer",
            url: `${origin}/product/${product.slug}`,
            priceCurrency: product.currency,
            price: (product.priceCents / 100).toFixed(2),
            availability: soldOut
              ? "https://schema.org/OutOfStock"
              : "https://schema.org/InStock",
          },
          ...(product.rating && product.rating.count > 0
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: product.rating.average,
                  reviewCount: product.rating.count,
                },
              }
            : {}),
          ...(reviews.length > 0
            ? {
                review: reviews.slice(0, 8).map((r) => ({
                  "@type": "Review",
                  author: { "@type": "Person", name: r.authorName },
                  datePublished: r.createdAt.toISOString().slice(0, 10),
                  reviewRating: { "@type": "Rating", ratingValue: r.rating },
                  name: r.title || undefined,
                  reviewBody: r.body,
                })),
              }
            : {}),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: origin },
            { "@type": "ListItem", position: 2, name: "The Store", item: `${origin}/shop` },
            {
              "@type": "ListItem",
              position: 3,
              name: `${product.name} ${product.subtitle}`.trim(),
              item: `${origin}/product/${product.slug}`,
            },
          ],
        }}
      />

      <section className="px-6 pt-28 pb-16 md:pt-36">
        <div className="mx-auto max-w-6xl">
          <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-[0.66rem] font-medium uppercase tracking-[0.16em] text-ink-muted">
            <Link href="/" className="transition-colors hover:text-green-800">
              Home
            </Link>
            <span aria-hidden>·</span>
            <Link href="/shop" className="transition-colors hover:text-green-800">
              The Store
            </Link>
            <span aria-hidden>·</span>
            <span className="text-ink">{product.name}</span>
          </nav>

          <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-14">
            <Reveal className="lg:col-span-7">
              <ProductMedia
                image={product.image}
                alt={`${product.name} — ${product.subtitle}`}
                video={product.video}
                poster={product.videoPoster}
              />
            </Reveal>

            <Reveal delay={0.12} className="lg:col-span-5">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.3em] text-green-700">
                {SITE.name} · {product.subtitle}
              </p>

              <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.05] text-ink sm:text-[2.9rem]">
                {product.name}
                <br />
                <span className="italic text-gold-gradient">{product.subtitle}</span>
              </h1>

              {product.rating && product.rating.count > 0 && (
                <div className="mt-4 flex items-center gap-3">
                  <Stars value={product.rating.average} id={product.id} />
                  <span className="text-[0.72rem] text-ink-muted">
                    {product.rating.average} · {product.rating.count}{" "}
                    {product.rating.count === 1 ? "review" : "reviews"}
                  </span>
                </div>
              )}

              <p className="mt-5 font-serif text-lg leading-relaxed text-ink-soft">
                {product.tagline}
              </p>

              {product.pillars.length > 0 && (
                <ul className="mt-6 flex flex-wrap gap-2">
                  {product.pillars.map((p) => (
                    <li
                      key={p}
                      className="rounded-full border border-linen bg-sand px-3.5 py-1.5 text-[0.66rem] font-medium uppercase tracking-[0.14em] text-ink-soft"
                    >
                      {p}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-8 flex flex-wrap items-baseline gap-3">
                <span className="font-display text-3xl font-semibold text-ink">
                  {formatMoney(product.priceCents, product.currency)}
                  {product.kind === "subscription" && (
                    <span className="text-base font-medium text-ink-muted">/month</span>
                  )}
                </span>
                {product.compareAtCents && (
                  <>
                    <span className="font-display text-lg text-ink-muted line-through">
                      {formatMoney(product.compareAtCents, product.currency)}
                    </span>
                    <span className="rounded-full bg-green-800 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-ivory">
                      Save {save}%
                    </span>
                  </>
                )}
              </div>

              <p className="mt-2 flex flex-wrap items-center gap-2 text-[0.72rem] text-ink-muted">
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${
                    soldOut ? "bg-ink-muted" : "bg-green-500"
                  }`}
                />
                {stockLine}
                {product.kind === "physical" && (
                  <> · Free delivery over {formatMoney(FREE_SHIPPING_OVER_CENTS)}</>
                )}
              </p>

              <div className="mt-7">
                <AddToCart
                  productId={product.id}
                  priceCents={product.priceCents}
                  currency={product.currency}
                  kind={product.kind}
                  stock={product.stock}
                />
              </div>

              {product.kind === "subscription" && (
                <Link
                  href="/plan"
                  className="mt-3 flex w-full items-center justify-center rounded-sm border border-gold/55 px-8 py-3.5 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-gold-deep transition-all hover:border-gold hover:bg-gold/10"
                >
                  See How the Plan Works
                </Link>
              )}

              {product.specs.length > 0 && (
                <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-linen pt-7">
                  {product.specs.map((s) => (
                    <div key={s.k}>
                      <dt className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-ink-muted">
                        {s.k}
                      </dt>
                      <dd className="mt-1 font-serif text-base text-ink">{s.v}</dd>
                    </div>
                  ))}
                </dl>
              )}

              <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-3 border-t border-linen pt-6">
                {TRUST.map((t) => (
                  <li key={t.label} className="flex items-center gap-2 text-[0.7rem] text-ink-soft">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-green-700">
                      {t.icon}
                    </svg>
                    {t.label}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* description + halal transparency */}
      <section className="border-y border-linen bg-sand px-6 py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <SectionEyebrow>The Detail</SectionEyebrow>
            <div
              className="prose-tfm mt-2"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(product.description) }}
            />
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-5">
            <HalalBadge product={product} />
          </Reveal>
        </div>
      </section>

      {/* reviews */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mb-12 text-center">
            <SectionEyebrow>What Buyers Say</SectionEyebrow>
            <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              {reviews.length === 0 ? (
                <>Be the first to review this</>
              ) : (
                <>
                  {product.rating?.average} out of 5{" "}
                  <span className="text-gold-gradient">
                    from {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                  </span>
                </>
              )}
            </h2>
          </Reveal>

          <div className="grid gap-8 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-7">
              {reviews.length === 0 ? (
                <p className="font-serif text-lg text-ink-soft">
                  No reviews yet. If you&apos;ve bought this, your words will help the next
                  family decide.
                </p>
              ) : (
                reviews.map((review, i) => (
                  <Reveal
                    as="article"
                    key={review.id}
                    delay={Math.min(i, 4) * 0.06}
                    className="rounded-lg border border-linen bg-shell p-6"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Stars value={review.rating} id={review.id} />
                        <span className="text-sm font-semibold text-ink">{review.authorName}</span>
                        {review.verifiedPurchase && (
                          <span className="rounded-full border border-green-500/40 bg-green-800/8 px-2.5 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.14em] text-green-700">
                            Verified buyer
                          </span>
                        )}
                      </div>
                      <time
                        dateTime={review.createdAt.toISOString()}
                        className="text-[0.66rem] uppercase tracking-[0.14em] text-ink-muted"
                      >
                        {review.createdAt.toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </time>
                    </div>
                    {review.title && (
                      <h3 className="mt-3 font-serif text-lg text-ink">{review.title}</h3>
                    )}
                    <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-soft">
                      {review.body}
                    </p>
                  </Reveal>
                ))
              )}
            </div>

            <div className="lg:col-span-5">
              <ReviewForm productId={product.id} />
            </div>
          </div>
        </div>
      </section>

      {/* related */}
      {related.length > 0 && (
        <section className="border-t border-linen bg-sand px-6 py-16 md:py-24">
          <div className="mx-auto max-w-6xl">
            <Reveal className="mb-12 text-center">
              <SectionEyebrow>Complete the Set</SectionEyebrow>
              <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
                Others reach for <span className="text-gold-gradient">these too</span>
              </h2>
            </Reveal>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p, i) => (
                <Reveal key={p.id} delay={i * 0.08} className="h-full">
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

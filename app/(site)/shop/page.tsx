import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import PageHeader from "@/components/PageHeader";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { getCollections, getProducts } from "@/lib/catalog";
import { SITE, siteOrigin } from "@/lib/site";

export const revalidate = 300;

const COLLECTION_LABELS: Record<string, string> = {
  planners: "Planners",
  "for-children": "For Children",
  nutrition: "Nutrition",
  worship: "Worship",
  training: "Training",
  ramadan: "Ramadan",
  bundles: "Bundles",
  digital: "Digital",
  programs: "Programs",
};

const label = (slug: string) =>
  COLLECTION_LABELS[slug] ??
  slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const metadata: Metadata = {
  title: "The Store — Faith & Fitness Essentials",
  description:
    "Halal-certified nutrition, worship essentials, planners and coach-reviewed programs. Every ingredient listed, every certificate named.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ collection?: string }>;
}) {
  const { collection } = await searchParams;
  const [products, collections] = await Promise.all([
    getProducts(collection ? { collection } : {}),
    getCollections(),
  ]);

  const origin = siteOrigin();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: collection ? `${label(collection)} — ${SITE.name}` : `The Store — ${SITE.name}`,
          url: `${origin}/shop${collection ? `?collection=${collection}` : ""}`,
          isPartOf: { "@type": "WebSite", name: SITE.name, url: origin },
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: products.length,
            itemListElement: products.map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${origin}/product/${p.slug}`,
              name: `${p.name} ${p.subtitle}`.trim(),
            })),
          },
        }}
      />

      <PageHeader
        eyebrow="The Collection"
        title="Curated for"
        highlight="Body & Deen"
        intro="Nothing here exists to fill a category. Each piece is made properly, sourced honestly, and named in full — certificate numbers included."
      />

      <section className="px-6 py-14 md:py-20">
        <div className="mx-auto max-w-6xl">
          {/* collection filter */}
          <Reveal className="mb-10 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/shop"
              className={`rounded-full border px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.16em] transition-colors ${
                collection
                  ? "border-linen bg-shell text-ink-soft hover:border-gold hover:text-green-800"
                  : "border-green-800 bg-green-800 text-ivory"
              }`}
            >
              Everything
            </Link>
            {collections.map((slug) => (
              <Link
                key={slug}
                href={`/shop?collection=${slug}`}
                className={`rounded-full border px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.16em] transition-colors ${
                  collection === slug
                    ? "border-green-800 bg-green-800 text-ivory"
                    : "border-linen bg-shell text-ink-soft hover:border-gold hover:text-green-800"
                }`}
              >
                {label(slug)}
              </Link>
            ))}
          </Reveal>

          {products.length === 0 ? (
            <p className="py-16 text-center font-serif text-lg text-ink-soft">
              Nothing in this collection yet.{" "}
              <Link href="/shop" className="text-green-700 underline decoration-gold/50">
                See everything
              </Link>
              .
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product, i) => (
                <Reveal key={product.id} delay={Math.min(i, 5) * 0.08} className="h-full">
                  <ProductCard product={product} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

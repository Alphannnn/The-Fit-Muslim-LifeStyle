import Link from "next/link";
import Hero from "@/components/Hero";
import Pillars from "@/components/Pillars";
import ProductShowcase from "@/components/ProductShowcase";
import ProductCard from "@/components/ProductCard";
import DietPlanFlow from "@/components/DietPlanFlow";
import Journal from "@/components/Journal";
import JsonLd from "@/components/JsonLd";
import Reveal, { SectionEyebrow } from "@/components/Reveal";
import { getFeaturedProducts, getHeadlineProduct, getPosts } from "@/lib/catalog";
import { SITE, siteOrigin } from "@/lib/site";

export const revalidate = 300;

export default async function Home() {
  const [headline, featured, posts] = await Promise.all([
    getHeadlineProduct(),
    getFeaturedProducts(6),
    getPosts(3),
  ]);

  const origin = siteOrigin();
  /* don't show the headline product twice on the same page */
  const others = featured.filter((p) => p.id !== headline?.id).slice(0, 3);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: SITE.name,
          url: origin,
          logo: `${origin}/logo.png`,
          slogan: SITE.tagline,
          description: SITE.description,
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE.name,
          url: origin,
          potentialAction: {
            "@type": "SearchAction",
            target: `${origin}/shop?collection={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }}
      />

      <Hero />
      <Pillars />
      {headline && <ProductShowcase product={headline} />}

      {others.length > 0 && (
        <section className="border-y border-linen bg-sand px-6 py-24 md:py-28">
          <div className="mx-auto max-w-6xl">
            <Reveal className="mb-14 text-center">
              <SectionEyebrow>The Rest of the Shelf</SectionEyebrow>
              <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
                Sourced honestly, <span className="text-gold-gradient">named in full</span>
              </h2>
              <p className="mx-auto mt-5 max-w-xl font-serif text-lg text-ink-soft">
                Every certificate number published. Every ingredient listed. No
                proprietary blends hiding behind a label.
              </p>
            </Reveal>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((product, i) => (
                <Reveal key={product.id} delay={i * 0.1} className="h-full">
                  <ProductCard product={product} />
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.2} className="mt-14 text-center">
              <Link
                href="/shop"
                className="group inline-flex items-center gap-2 rounded-sm border border-gold/55 px-9 py-4 text-[0.74rem] font-semibold uppercase tracking-[0.18em] text-gold-deep transition-all hover:-translate-y-0.5 hover:border-gold hover:bg-gold/10"
              >
                Browse the Whole Store
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 transition-transform group-hover:translate-x-1">
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      <DietPlanFlow />
      <Journal posts={posts} />
    </>
  );
}

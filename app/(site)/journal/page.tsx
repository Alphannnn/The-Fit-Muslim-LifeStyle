import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import { getPosts } from "@/lib/catalog";
import { SITE, siteOrigin } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "The Journal — Faith & Fitness, Written Well",
  description:
    "Training, halal nutrition and mindset grounded in the deen. Practical guidance for the body and the soul.",
  alternates: { canonical: "/journal" },
};

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const all = await getPosts();
  const categories = [...new Set(all.map((p) => p.category))].sort();
  const posts = category ? all.filter((p) => p.category === category) : all;
  const origin = siteOrigin();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: `The Journal — ${SITE.name}`,
          url: `${origin}/journal`,
          blogPost: all.map((p) => ({
            "@type": "BlogPosting",
            headline: p.title,
            url: `${origin}/journal/${p.slug}`,
            datePublished: (p.publishedAt ?? p.createdAt).toISOString(),
            author: { "@type": "Organization", name: p.author },
          })),
        }}
      />

      <PageHeader
        eyebrow="From the Journal"
        title="Faith & Fitness,"
        highlight="Written Well"
        intro="Guidance for the body and the soul — training, nutrition, and mindset grounded in the deen."
      />

      <section className="px-6 py-14 md:py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mb-10 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/journal"
              className={`rounded-full border px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.16em] transition-colors ${
                category
                  ? "border-linen bg-shell text-ink-soft hover:border-gold hover:text-green-800"
                  : "border-green-800 bg-green-800 text-ivory"
              }`}
            >
              Everything
            </Link>
            {categories.map((c) => (
              <Link
                key={c}
                href={`/journal?category=${encodeURIComponent(c)}`}
                className={`rounded-full border px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.16em] transition-colors ${
                  category === c
                    ? "border-green-800 bg-green-800 text-ivory"
                    : "border-linen bg-shell text-ink-soft hover:border-gold hover:text-green-800"
                }`}
              >
                {c}
              </Link>
            ))}
          </Reveal>

          <div className="grid gap-6 md:grid-cols-3">
            {posts.map((post, i) => (
              <Reveal as="article" key={post.id} delay={Math.min(i, 5) * 0.1}>
                <Link
                  href={`/journal/${post.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-lg border border-linen bg-shell shadow-[0_2px_10px_-6px_rgba(21,24,21,0.16)] transition-all duration-500 hover:-translate-y-1.5 hover:border-gold/45 hover:shadow-[0_26px_50px_-24px_rgba(21,24,21,0.35)]"
                >
                  <div className="relative aspect-16/10 overflow-hidden border-b border-linen bg-sand">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.coverImage}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span
                      aria-hidden
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(180deg,rgba(252,250,246,0.55) 0%,rgba(252,250,246,0.05) 38%,transparent 100%)",
                      }}
                    />
                    <span className="absolute left-4 top-4 rounded-full border border-gold/50 bg-ivory/90 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-gold-deep backdrop-blur-sm">
                      {post.category}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="font-serif text-xl leading-snug text-ink transition-colors group-hover:text-green-800">
                      {post.title}
                    </h2>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">
                      {post.excerpt}
                    </p>
                    <div className="mt-5 flex items-center justify-between border-t border-linen pt-4">
                      <span className="text-[0.66rem] font-medium uppercase tracking-[0.18em] text-ink-muted">
                        {post.readMinutes} min read
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-green-700 transition-all group-hover:gap-2.5">
                        Read
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                          <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

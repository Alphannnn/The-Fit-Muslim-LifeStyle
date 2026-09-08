import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import JsonLd from "@/components/JsonLd";
import Reveal, { SectionEyebrow } from "@/components/Reveal";
import { getPostBySlug, getRelatedPosts } from "@/lib/catalog";
import { db } from "@/lib/db";
import { journalPosts } from "@/lib/db/schema";
import { renderMarkdown } from "@/lib/markdown";
import { SITE, siteOrigin } from "@/lib/site";

export const revalidate = 300;

export async function generateStaticParams() {
  const rows = await db
    .select({ slug: journalPosts.slug })
    .from(journalPosts)
    .where(eq(journalPosts.published, true))
    .all();
  return rows.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Not found" };

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/journal/${post.slug}` },
    openGraph: {
      type: "article",
      title: `${post.title} · ${SITE.name}`,
      description: post.excerpt,
      url: `${siteOrigin()}/journal/${post.slug}`,
      publishedTime: (post.publishedAt ?? post.createdAt).toISOString(),
      images: post.coverImage ? [{ url: post.coverImage, alt: post.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} · ${SITE.name}`,
      description: post.excerpt,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

export default async function JournalPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const related = await getRelatedPosts(post.slug, post.category, 2);
  const published = post.publishedAt ?? post.createdAt;
  const origin = siteOrigin();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.excerpt,
          image: post.coverImage ? [post.coverImage] : undefined,
          datePublished: published.toISOString(),
          dateModified: published.toISOString(),
          author: { "@type": "Organization", name: post.author, url: origin },
          publisher: {
            "@type": "Organization",
            name: SITE.name,
            logo: { "@type": "ImageObject", url: `${origin}/logo.png` },
          },
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `${origin}/journal/${post.slug}`,
          },
          articleSection: post.category,
        }}
      />

      <article>
        <header className="border-b border-linen bg-sand px-6 pt-32 pb-14 md:pt-40">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="mb-5 flex items-center justify-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-gold-deep">
              <span className="h-px w-8 bg-linear-to-r from-transparent to-gold/70" />
              {post.category}
              <span className="h-px w-8 bg-linear-to-l from-transparent to-gold/70" />
            </p>
            <h1 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl md:text-5xl">
              {post.title}
            </h1>
            <p className="mx-auto mt-5 max-w-xl font-serif text-lg leading-relaxed text-ink-soft">
              {post.excerpt}
            </p>
            <p className="mt-6 flex items-center justify-center gap-3 text-[0.66rem] font-medium uppercase tracking-[0.18em] text-ink-muted">
              <time dateTime={published.toISOString()}>
                {published.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
              <span aria-hidden>·</span>
              <span>{post.readMinutes} min read</span>
            </p>
          </Reveal>
        </header>

        {post.coverImage && (
          <div className="px-6 py-10 md:py-14">
            <Reveal className="mx-auto max-w-4xl">
              <div className="relative aspect-16/9 overflow-hidden rounded-xl border border-linen bg-sand shadow-[0_30px_60px_-34px_rgba(21,24,21,0.45)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.coverImage}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <span className="pointer-events-none absolute inset-3 rounded-lg border border-gold/25" />
              </div>
            </Reveal>
          </div>
        )}

        <div className="px-6 pb-16 md:pb-24">
          <Reveal className="mx-auto max-w-2xl">
            <div
              className="prose-tfm"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }}
            />

            <footer className="mt-14 border-t border-linen pt-8">
              <p className="font-arabic text-2xl leading-loose text-green-800" dir="rtl">
                وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَىٰ
              </p>
              <p className="mt-1 font-serif text-base italic text-ink-soft">
                “And that man can have nothing but what he strives for.” — 53:39
              </p>
            </footer>
          </Reveal>
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-linen bg-sand px-6 py-16 md:py-20">
          <div className="mx-auto max-w-4xl">
            <Reveal className="mb-10 text-center">
              <SectionEyebrow>Keep Reading</SectionEyebrow>
            </Reveal>
            <div className="grid gap-6 sm:grid-cols-2">
              {related.map((r, i) => (
                <Reveal key={r.id} delay={i * 0.1}>
                  <Link
                    href={`/journal/${r.slug}`}
                    className="group flex h-full flex-col rounded-lg border border-linen bg-shell p-6 transition-all duration-500 hover:-translate-y-1 hover:border-gold/45"
                  >
                    <span className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-gold-deep">
                      {r.category}
                    </span>
                    <h3 className="mt-2 flex-1 font-serif text-lg leading-snug text-ink transition-colors group-hover:text-green-800">
                      {r.title}
                    </h3>
                    <span className="mt-4 text-[0.66rem] font-medium uppercase tracking-[0.18em] text-ink-muted">
                      {r.readMinutes} min read
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

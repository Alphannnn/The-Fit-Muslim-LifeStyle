import Link from "next/link";
import Reveal, { SectionEyebrow } from "./Reveal";
import type { JournalPost } from "@/lib/db/schema";

export default function Journal({ posts }: { posts: JournalPost[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="relative px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mb-16 text-center">
          <SectionEyebrow>From the Journal</SectionEyebrow>
          <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl md:text-5xl">
            Faith &amp; Fitness, <span className="text-gold-gradient">Written Well</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl font-serif text-lg text-ink-soft">
            Guidance for the body and the soul — training, nutrition, and mindset
            grounded in the deen.
          </p>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3">
          {posts.map((post, i) => (
            <Reveal as="article" key={post.id} delay={i * 0.12}>
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
                  <h3 className="font-serif text-xl leading-snug text-ink transition-colors group-hover:text-green-800">
                    {post.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">{post.excerpt}</p>
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

        <Reveal delay={0.3} className="mt-14 text-center">
          <Link
            href="/journal"
            className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-green-700 transition-colors hover:text-green-900"
          >
            Read the whole journal →
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

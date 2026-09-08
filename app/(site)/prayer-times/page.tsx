import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import PrayerMonth from "@/components/PrayerMonth";
import ProductCard from "@/components/ProductCard";
import Reveal, { SectionEyebrow } from "@/components/Reveal";
import { getProducts } from "@/lib/catalog";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Prayer Times & Fasting Windows",
  description:
    "Thirty days of prayer times computed from solar geometry for your city, with fasting windows, Hijri dates and the training windows that fit between them.",
  alternates: { canonical: "/prayer-times" },
};

const WINDOWS = [
  {
    title: "After Fajr",
    body: "The most protected hour of the day — nothing competes for it. Best if your evenings belong to family or work.",
  },
  {
    title: "Between Dhuhr and ʿAsr",
    body: "Long in summer, tight in winter. Good for a 45-minute session if your workday allows it.",
  },
  {
    title: "Between Maghrib and ʿIshā",
    body: "The most popular and most compressed — realistically 50 minutes. Have the session written down before you arrive.",
  },
];

export default async function PrayerTimesPage() {
  const ramadanPicks = await getProducts({ collection: "ramadan", limit: 3 });

  return (
    <>
      <PageHeader
        eyebrow="Anchored to the Sun"
        title="Prayer times, and the training"
        highlight="that fits between them"
        intro="Thirty days for your city, computed from solar geometry rather than fetched from an API — so it works offline and never rate-limits."
      />

      <section className="px-6 py-14 md:py-20">
        <div className="mx-auto max-w-5xl">
          <PrayerMonth />
        </div>
      </section>

      {/* training windows */}
      <section className="border-y border-linen bg-sand px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <Reveal className="mb-12 text-center">
            <SectionEyebrow>The Three Windows</SectionEyebrow>
            <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              Anchor sessions to prayers, <span className="text-gold-gradient">not to the clock</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl font-serif text-lg text-ink-soft">
              “Gym at 6pm” breaks in December. “Gym after ʿAsr, home for Maghrib” works
              in every season, because it moves with the sun the way your day already
              does.
            </p>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-3">
            {WINDOWS.map((w, i) => (
              <Reveal key={w.title} delay={i * 0.1}>
                <div className="h-full rounded-lg border border-linen bg-shell p-6">
                  <h3 className="font-display text-lg font-semibold text-ink">{w.title}</h3>
                  <p className="mt-3 font-serif text-[1rem] leading-relaxed text-ink-soft">
                    {w.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.3} className="mt-12 text-center">
            <Link
              href="/plan"
              className="group inline-flex items-center gap-2 rounded-sm bg-green-800 px-9 py-4 text-[0.74rem] font-semibold uppercase tracking-[0.16em] text-ivory shadow-[0_16px_36px_-18px_rgba(13,40,28,0.85)] transition-all hover:-translate-y-0.5 hover:bg-green-900"
            >
              Build a Plan Around These Times
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 transition-transform group-hover:translate-x-1">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </Reveal>
        </div>
      </section>

      {ramadanPicks.length > 0 && (
        <section className="px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <Reveal className="mb-12 text-center">
              <SectionEyebrow>For the Fasting Month</SectionEyebrow>
              <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
                What people reach for <span className="text-gold-gradient">in Ramadan</span>
              </h2>
            </Reveal>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {ramadanPicks.map((product, i) => (
                <Reveal key={product.id} delay={i * 0.08} className="h-full">
                  <ProductCard product={product} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

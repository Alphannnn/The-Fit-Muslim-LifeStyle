import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import PageHeader from "@/components/PageHeader";
import PlanIntakeWizard from "@/components/PlanIntakeWizard";
import Reveal, { SectionEyebrow } from "@/components/Reveal";
import { getCurrentUser } from "@/lib/auth/session";
import { getProductBySlug } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import { SITE, siteOrigin } from "@/lib/site";

export const metadata: Metadata = {
  title: "Your Personalised Plan — Coach Reviewed",
  description:
    "A nutrition and training plan built from your metrics and your prayer times, drafted in seconds and approved by a qualified coach before it reaches you.",
  alternates: { canonical: "/plan" },
};

const STEPS = [
  {
    n: "01",
    title: "Tell Us About You",
    body: "Four short screens: your goal, your measurements, the days you can genuinely train, and where you pray. Two minutes, no account needed to start.",
  },
  {
    n: "02",
    title: "We Draft It Instantly",
    body: "Our engine computes your resting rate, your macros, and a meal and training schedule anchored to your Fajr and Maghrib — not to a generic clock.",
  },
  {
    n: "03",
    title: "A Coach Approves It",
    body: "Every plan is read by a qualified coach, adjusted where it needs adjusting, and approved by hand. Nothing reaches you until a human has signed it off.",
  },
];

const FAQ = [
  {
    q: "What makes this different from a macro calculator?",
    a: "A calculator gives you four numbers. This gives you meals at times that fit your prayers, a training split for the days you actually have, halved volume in Ramadan, and a coach who reads your medical notes before approving any of it.",
  },
  {
    q: "How does Ramadan work?",
    a: "Your plan switches to a suhoor/iftar split automatically during Ramadan. Training volume halves while loads stay the same — you keep your strength instead of chasing records. You can also switch it on early to prepare.",
  },
  {
    q: "What if I fast Mondays and Thursdays?",
    a: "Tell us in the intake and those sessions move to the hour before Maghrib, with refuelling straight after. The rest of the week is unaffected.",
  },
  {
    q: "Is the food halal?",
    a: "Every food suggested is halal by default, and anything you list as an allergy or a food to avoid is filtered out of your plan entirely before a coach ever sees it.",
  },
  {
    q: "Can I cancel?",
    a: "Any time, and we action it the same day. No retention scripts, no hoops.",
  },
];

export default async function PlanPage() {
  const [user, product] = await Promise.all([
    getCurrentUser(),
    getProductBySlug("personalised-diet-plan"),
  ]);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: "The Personalised Plan",
          serviceType: "Nutrition and training planning",
          provider: { "@type": "Organization", name: SITE.name, url: siteOrigin() },
          description:
            "A nutrition and training plan built from your metrics and prayer times, reviewed and approved by a qualified coach.",
          ...(product
            ? {
                offers: {
                  "@type": "Offer",
                  price: (product.priceCents / 100).toFixed(2),
                  priceCurrency: product.currency,
                  url: `${siteOrigin()}/product/${product.slug}`,
                },
              }
            : {}),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }}
      />

      <PageHeader
        eyebrow="Your Plan, Approved"
        title="A plan built"
        highlight="around you"
        intro="Not a template. A personalised, expert-reviewed plan that honours your body and your deen — approved before it ever reaches you."
      />

      {/* how it works */}
      <section id="how-it-works" className="px-6 py-20 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="relative grid gap-10 md:grid-cols-3 md:gap-6">
            <div
              aria-hidden
              className="absolute left-0 right-0 top-7 hidden h-px bg-linear-to-r from-transparent via-gold/40 to-transparent md:block"
            />
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={i * 0.14} className="relative text-center">
                <div className="relative z-10 mx-auto mb-6 grid h-14 w-14 place-items-center rounded-full border border-gold/40 bg-ivory font-display text-sm font-bold text-green-800 shadow-[0_12px_28px_-20px_rgba(21,24,21,0.6)]">
                  {step.n}
                </div>
                <h3 className="font-display text-lg font-semibold tracking-[0.06em] text-ink">
                  {step.title}
                </h3>
                <p className="mx-auto mt-3 max-w-xs font-serif text-[1.02rem] leading-relaxed text-ink-soft">
                  {step.body}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* the wizard */}
      <section className="border-y border-linen bg-sand px-6 py-20 md:py-24">
        <div className="mx-auto max-w-3xl">
          <Reveal className="mb-10 text-center">
            <SectionEyebrow>Two Minutes</SectionEyebrow>
            <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              Start with the <span className="text-gold-gradient">intake</span>
            </h2>
            {!user && (
              <p className="mx-auto mt-5 max-w-lg font-serif text-lg text-ink-soft">
                Fill it in now — you&apos;ll be asked to create an account at the end so
                the plan has somewhere to live.
              </p>
            )}
          </Reveal>

          <Reveal delay={0.1}>
            <PlanIntakeWizard signedIn={Boolean(user)} />
          </Reveal>

          {product && (
            <Reveal delay={0.2} className="mt-8 text-center">
              <p className="text-[0.85rem] text-ink-soft">
                The first draft and the coach review are included.{" "}
                <Link
                  href={`/product/${product.slug}`}
                  className="font-semibold text-green-700 underline decoration-gold/50"
                >
                  Ongoing monthly revisions
                </Link>{" "}
                are {formatMoney(product.priceCents, product.currency)} a month, cancel
                any time.
              </p>
            </Reveal>
          )}
        </div>
      </section>

      {/* faq */}
      <section className="px-6 py-20 md:py-24">
        <div className="mx-auto max-w-3xl">
          <Reveal className="mb-12 text-center">
            <SectionEyebrow>Before You Ask</SectionEyebrow>
            <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              The honest <span className="text-gold-gradient">answers</span>
            </h2>
          </Reveal>

          <dl className="divide-y divide-linen">
            {FAQ.map((item, i) => (
              <Reveal key={item.q} delay={Math.min(i, 4) * 0.06} className="py-6">
                <dt className="font-display text-lg font-semibold text-ink">{item.q}</dt>
                <dd className="mt-2.5 font-serif text-[1.05rem] leading-relaxed text-ink-soft">
                  {item.a}
                </dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}

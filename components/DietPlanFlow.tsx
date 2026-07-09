import Reveal, { SectionEyebrow } from "./Reveal";

const STEPS = [
  {
    n: "01",
    title: "Tell Us About You",
    body: "Share your goals, body metrics, activity, and dietary needs in a two-minute intake — halal preferences included.",
    icon: (
      <>
        <circle cx="24" cy="17" r="7" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M11 38c0-7 6-11 13-11s13 4 13 11" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
  },
  {
    n: "02",
    title: "We Craft Your Plan",
    body: "A tailored nutrition & training plan is built around your body, your schedule, and the rhythm of your prayers and fasts.",
    icon: (
      <>
        <path d="M14 10h20v28H14z" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M19 18h10M19 24h10M19 30h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
  },
  {
    n: "03",
    title: "Expert-Approved & Delivered",
    body: "Every plan is reviewed and approved by our team before it reaches you — so you train on guidance you can trust.",
    icon: (
      <>
        <path d="M24 8l4 4h6v6l4 4-4 4v6h-6l-4 4-4-4h-6v-6l-4-4 4-4v-6h6z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M19 24l4 4 7-8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
];

export default function DietPlanFlow() {
  return (
    <section className="relative overflow-hidden border-y border-gold/10 px-6 py-24 md:py-32">
      {/* subtle green wash to set this signature section apart */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(90% 80% at 50% 0%, rgba(20,68,47,0.35), rgba(5,6,4,0) 70%)",
        }}
      />

      <div className="mx-auto max-w-6xl">
        <Reveal className="mb-16 text-center">
          <SectionEyebrow>Your Plan, Approved</SectionEyebrow>
          <h2 className="font-display text-3xl font-bold tracking-tight text-cream sm:text-4xl md:text-5xl">
            A Diet Plan Built <span className="text-gold-gradient">Around You</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl font-serif text-lg text-ink">
            Not a template. A personalised, expert-reviewed plan that honours
            your body and your deen — approved before it ever reaches you.
          </p>
        </Reveal>

        <div className="relative grid gap-10 md:grid-cols-3 md:gap-6">
          {/* connecting line on desktop */}
          <div
            aria-hidden
            className="absolute left-0 right-0 top-9 hidden h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent md:block"
          />
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.15} className="relative flex flex-col items-center text-center">
              <div className="relative z-10 mb-6 grid h-[72px] w-[72px] place-items-center rounded-full border border-gold/30 bg-obsidian text-gold-soft">
                <svg viewBox="0 0 48 48" className="h-8 w-8">
                  {s.icon}
                </svg>
                <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-gold text-[0.6rem] font-bold text-obsidian">
                  {s.n}
                </span>
              </div>
              <h3 className="font-display text-lg font-semibold tracking-[0.1em] text-cream">
                {s.title}
              </h3>
              <p className="mt-3 max-w-xs font-serif text-lg leading-relaxed text-ink">{s.body}</p>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.25} className="mt-16 text-center">
          <a
            href="#"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-sm border border-gold-soft px-9 py-4 text-[0.8rem] font-medium uppercase tracking-[0.16em] text-[#1a1206] transition-transform hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(180deg, #f6e6b4, #d4af37 45%, #b8860b)",
              boxShadow: "0 10px 30px rgba(212,175,55,0.25)",
            }}
          >
            <span className="relative z-10">Start Your Plan — It&apos;s Free</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="absolute inset-0 -left-full z-0 h-full w-1/2 skew-x-[-20deg] bg-white/50 transition-all duration-700 group-hover:left-[150%]" />
          </a>
        </Reveal>
      </div>
    </section>
  );
}

import Reveal from "./Reveal";

const PILLARS = [
  {
    title: "Faith",
    body: "Every rep, every meal, every rest — an act of gratitude for the body entrusted to you.",
    icon: (
      <path
        d="M24 6c-4 4-10 5-10 5v9c0 8 10 14 10 14s10-6 10-14v-9s-6-1-10-5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Discipline",
    body: "Structure that outlasts motivation. Plans, tracking, and accountability rooted in the Sunnah.",
    icon: (
      <>
        <circle cx="24" cy="24" r="15" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M24 15v9l6 4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
  },
  {
    title: "Strength",
    body: "Train the body, fortify the soul. Halal fuel, honest effort, and community that lifts you.",
    icon: (
      <path
        d="M12 20h4v8h-4zM32 20h4v8h-4zM16 23h16v2H16zM8 22h4v4H8zM36 22h4v4h-4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    ),
  },
];

export default function Pillars() {
  return (
    <section className="relative border-y border-linen bg-sand px-6 py-24 md:py-32">
      <div className="mx-auto grid max-w-6xl gap-14 md:grid-cols-3 md:gap-8">
        {PILLARS.map((p, i) => (
          <Reveal key={p.title} delay={i * 0.12} className="flex flex-col items-center text-center">
            <div className="mb-6 grid h-16 w-16 place-items-center rounded-full border border-gold/40 bg-ivory text-gold-deep shadow-[0_10px_24px_-18px_rgba(21,24,21,0.5)]">
              <svg viewBox="0 0 48 48" className="h-8 w-8">
                {p.icon}
              </svg>
            </div>
            <h3 className="font-display text-xl font-semibold tracking-[0.14em] text-ink">
              {p.title}
            </h3>
            <div className="my-4 h-px w-8 bg-gold/60" />
            <p className="max-w-xs font-serif text-lg leading-relaxed text-ink-soft">{p.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

import Reveal, { SectionEyebrow } from "./Reveal";

const POSTS = [
  {
    category: "Training",
    title: "Building Strength While Fasting in Ramadan",
    excerpt: "How to preserve muscle, time your training, and fuel smartly around suhoor and iftar.",
    read: "6 min read",
  },
  {
    category: "Nutrition",
    title: "Halal Nutrition 101: Fuel That Honours the Body",
    excerpt: "A practical guide to protein, macros, and clean halal eating for real, sustainable results.",
    read: "8 min read",
  },
  {
    category: "Mindset",
    title: "The Sunnah of Strength & Discipline",
    excerpt: "What the Prophet ﷺ taught us about caring for the body as an amanah — and staying consistent.",
    read: "5 min read",
  },
];

export default function Journal() {
  return (
    <section className="relative px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mb-16 text-center">
          <SectionEyebrow>From the Journal</SectionEyebrow>
          <h2 className="font-display text-3xl font-bold tracking-tight text-cream sm:text-4xl md:text-5xl">
            Faith &amp; Fitness, <span className="text-gold-gradient">Written Well</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl font-serif text-lg text-ink">
            Guidance for the body and the soul — training, nutrition, and mindset
            grounded in the deen.
          </p>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3">
          {POSTS.map((post, i) => (
            <Reveal as="article" key={post.title} delay={i * 0.12}>
              <a
                href="#"
                className="group flex h-full flex-col overflow-hidden rounded-lg border border-gold/12 bg-obsidian-2/60 transition-all duration-500 hover:-translate-y-1.5 hover:border-gold/40"
              >
                {/* cover */}
                <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden">
                  <div
                    className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(15,51,36,0.9), rgba(5,6,4,0.95)), radial-gradient(circle at 70% 20%, rgba(212,175,55,0.18), transparent 60%)",
                    }}
                  />
                  <span className="absolute left-4 top-4 rounded-full border border-gold/40 bg-obsidian/60 px-3 py-1 text-[0.6rem] uppercase tracking-[0.2em] text-gold-soft">
                    {post.category}
                  </span>
                  <svg viewBox="0 0 48 48" className="relative h-12 w-12 text-gold-soft/40">
                    <path d="M12 10h18l6 6v22H12z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                    <path d="M18 22h12M18 28h12M18 34h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </div>
                {/* body */}
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-serif text-xl leading-snug text-cream transition-colors group-hover:text-gold-soft">
                    {post.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-ink">{post.excerpt}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-gold/10 pt-4">
                    <span className="text-[0.66rem] uppercase tracking-[0.18em] text-ink">{post.read}</span>
                    <span className="inline-flex items-center gap-1.5 text-[0.7rem] uppercase tracking-[0.16em] text-gold-soft/80 transition-all group-hover:gap-2.5">
                      Read
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                        <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

import Reveal, { SectionEyebrow } from "./Reveal";

type Product = {
  name: string;
  category: string;
  price: string;
  tag?: string;
  icon: React.ReactNode;
};

const PRODUCTS: Product[] = [
  {
    name: "Heritage Prayer Mat",
    category: "Worship Essentials",
    price: "$49",
    tag: "Bestseller",
    icon: (
      <path d="M16 46V18c0-5 3.6-8 8-8s8 3 8 8v28" fill="none" stroke="currentColor" strokeWidth="1.4" />
    ),
  },
  {
    name: "Halal Whey Isolate",
    category: "Performance Nutrition",
    price: "$39",
    icon: (
      <path d="M18 12h12l-1 6a7 7 0 0 1 3 6v14a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4V24a7 7 0 0 1 3-6Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    ),
  },
  {
    name: "Modest Performance Tee",
    category: "Athletic Apparel",
    price: "$34",
    tag: "New",
    icon: (
      <path d="M18 12l-7 5 3 5 4-2v16h12V25l4 2 3-5-7-5-3 3h-6l-3-3Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    ),
  },
  {
    name: "Brass Tasbih Counter",
    category: "Accessories",
    price: "$24",
    icon: (
      <>
        <circle cx="24" cy="24" r="12" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="24" cy="12" r="2.4" fill="currentColor" />
      </>
    ),
  },
];

function ProductCard({ p, delay }: { p: Product; delay: number }) {
  return (
    <Reveal as="article" delay={delay}>
      <a
        href="#"
        className="group block overflow-hidden rounded-lg border border-gold/12 bg-gradient-to-b from-green-900/40 to-obsidian-2 transition-all duration-500 hover:-translate-y-1.5 hover:border-gold/45 hover:shadow-[0_24px_50px_-20px_rgba(212,175,55,0.25)]"
      >
        {/* image / icon panel */}
        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 40%, rgba(20,68,47,0.55), rgba(5,6,4,0.9))",
            }}
          />
          <svg viewBox="0 0 48 48" className="relative h-16 w-16 text-gold-soft/70 transition-transform duration-500 group-hover:scale-110">
            {p.icon}
          </svg>
          {p.tag && (
            <span className="absolute left-4 top-4 rounded-full border border-gold/40 bg-obsidian/60 px-3 py-1 text-[0.6rem] uppercase tracking-[0.2em] text-gold-soft">
              {p.tag}
            </span>
          )}
        </div>
        {/* meta */}
        <div className="p-5">
          <p className="text-[0.62rem] uppercase tracking-[0.24em] text-ink">{p.category}</p>
          <h3 className="mt-1.5 font-serif text-xl text-cream transition-colors group-hover:text-gold-soft">
            {p.name}
          </h3>
          <div className="mt-4 flex items-center justify-between">
            <span className="font-display text-lg font-semibold text-gold">{p.price}</span>
            <span className="inline-flex items-center gap-1.5 text-[0.7rem] uppercase tracking-[0.16em] text-gold-soft/80 transition-all group-hover:gap-2.5">
              View
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </div>
      </a>
    </Reveal>
  );
}

export default function FeaturedProducts() {
  return (
    <section className="relative px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mb-16 text-center">
          <SectionEyebrow>The Collection</SectionEyebrow>
          <h2 className="font-display text-3xl font-bold tracking-tight text-cream sm:text-4xl md:text-5xl">
            Curated for <span className="text-gold-gradient">Body &amp; Deen</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl font-serif text-lg text-ink">
            Halal-certified nutrition, worship essentials, and athletic wear —
            chosen for quality, purpose, and barakah.
          </p>
        </Reveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCTS.map((p, i) => (
            <ProductCard key={p.name} p={p} delay={i * 0.1} />
          ))}
        </div>

        <Reveal delay={0.2} className="mt-14 text-center">
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-sm border border-gold/40 px-8 py-4 text-[0.8rem] font-medium uppercase tracking-[0.16em] text-gold-soft transition-all hover:-translate-y-0.5 hover:border-gold hover:bg-gold/10"
          >
            Browse the Full Shop
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </Reveal>
      </div>
    </section>
  );
}

const COLUMNS = [
  { heading: "Shop", links: ["Nutrition", "Apparel", "Worship Essentials", "Accessories", "New Arrivals"] },
  { heading: "Programs", links: ["Diet Plans", "Training", "Ramadan Prep", "Coaching"] },
  { heading: "Learn", links: ["The Journal", "Nutrition Guides", "Faith & Fitness", "FAQ"] },
  { heading: "Company", links: ["About", "Contact", "Shipping", "Privacy"] },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-gold/15 bg-obsidian-2 px-6 pt-20 pb-10">
      <div className="mx-auto max-w-6xl">
        {/* top: brand + newsletter */}
        <div className="grid gap-12 pb-14 md:grid-cols-2">
          <div className="max-w-sm">
            <p className="font-display text-lg font-bold tracking-[0.22em] text-gold-gradient">
              THE FIT MUSLIM
            </p>
            <p className="mt-3 text-[0.66rem] uppercase tracking-[0.34em] text-ink">
              Faith · Discipline · Strength
            </p>
            <div className="mt-6 font-arabic text-2xl leading-loose text-gold-soft" dir="rtl">
              وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَىٰ
            </div>
            <p className="mt-2 font-serif text-base italic text-ink">
              “And that man can have nothing but what he strives for.” — 53:39
            </p>
          </div>

          <div className="md:justify-self-end md:text-right">
            <h4 className="font-display text-sm font-semibold tracking-[0.18em] text-cream">
              Join the Community
            </h4>
            <p className="mt-3 max-w-xs font-serif text-lg text-ink md:ml-auto">
              Weekly guidance on training, halal nutrition, and the deen. No noise.
            </p>
            <form className="mt-6 flex max-w-sm gap-2 md:ml-auto">
              <input
                type="email"
                placeholder="Your email"
                className="w-full rounded-sm border border-gold/25 bg-obsidian/60 px-4 py-3 text-sm text-cream outline-none transition-colors placeholder:text-ink/60 focus:border-gold"
              />
              <button
                type="submit"
                className="shrink-0 rounded-sm px-5 py-3 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-[#1a1206] transition-transform hover:-translate-y-0.5"
                style={{ background: "linear-gradient(180deg, #f6e6b4, #d4af37 45%, #b8860b)" }}
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* link columns */}
        <div className="grid gap-8 border-t border-gold/10 py-12 sm:grid-cols-2 md:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h5 className="mb-4 text-[0.7rem] uppercase tracking-[0.24em] text-gold-soft">
                {col.heading}
              </h5>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-ink transition-colors hover:text-cream">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-gold/10 pt-8 sm:flex-row">
          <p className="text-xs text-ink">
            © {"2026"} The Fit Muslim. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {["Instagram", "YouTube", "TikTok", "X"].map((s) => (
              <a
                key={s}
                href="#"
                aria-label={s}
                className="grid h-9 w-9 place-items-center rounded-full border border-gold/20 text-gold-soft/80 transition-all hover:-translate-y-0.5 hover:border-gold hover:text-gold"
              >
                <span className="text-[0.6rem] font-semibold">{s[0]}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

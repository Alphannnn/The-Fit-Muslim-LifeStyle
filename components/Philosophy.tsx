import Reveal from "./Reveal";

/* ---- build a receding corridor of pointed Islamic arches ---- */
function archPath(w: number, baseY = 300, cx = 200) {
  const sy = baseY - w * 0.55; // spring line
  const apexY = sy - w * 1.12; // apex
  const r = 2 * w;
  const lx = cx - w;
  const rx = cx + w;
  return `M${lx} ${baseY} L${lx} ${sy} A${r} ${r} 0 0 1 ${cx} ${apexY} A${r} ${r} 0 0 1 ${rx} ${sy} L${rx} ${baseY}`;
}
const ARCHES = [176, 140, 110, 84, 62, 44];

/* ---- premium curved-text wax seal ---- */
function Seal() {
  return (
    <svg viewBox="0 0 140 140" className="h-full w-full" aria-hidden>
      <defs>
        <path id="sealArc" d="M70 70 m-52,0 a52,52 0 1,1 104,0 a52,52 0 1,1 -104,0" />
      </defs>
      <circle cx="70" cy="70" r="64" fill="var(--color-ivory)" stroke="var(--color-gold)" strokeWidth="1" strokeOpacity="0.7" />
      <circle cx="70" cy="70" r="54" fill="none" stroke="var(--color-gold)" strokeWidth="0.6" strokeOpacity="0.5" />
      <text
        fill="var(--color-gold-deep)"
        style={{ fontSize: "9.5px", letterSpacing: "3.4px", fontFamily: "var(--font-sans)" }}
      >
        <textPath href="#sealArc" startOffset="0">
          FAITH · DISCIPLINE · STRENGTH · EST. 2025 ·
        </textPath>
      </text>
      {/* crescent + star */}
      <g transform="translate(70 72)">
        <path d="M9 -14a16 16 0 1 0 7 30 13 13 0 0 1-7-30Z" fill="var(--color-gold)" />
        <path d="M14 -11l1.4 3.4 3.6.3-2.7 2.4.8 3.5-3.1-1.9-3.1 1.9.8-3.5-2.7-2.4 3.6-.3z" fill="var(--color-gold-bright)" />
      </g>
    </svg>
  );
}

export default function Philosophy() {
  return (
    <section className="relative px-6 py-24 md:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2 md:gap-16">
        {/* ---------- text ---------- */}
        <Reveal className="order-2 md:order-1">
          <div className="mb-6 flex items-center gap-4">
            <span className="h-px w-12 bg-gold/60" />
            <span className="text-[0.66rem] font-semibold uppercase tracking-[0.42em] text-gold-deep">
              Our Philosophy
            </span>
          </div>

          <h2 className="font-display text-4xl font-semibold leading-[1.08] text-ink sm:text-5xl md:text-[3.4rem]">
            More Than Fitness.
            <br />
            <span className="italic text-gold-gradient">A Way of Life.</span>
          </h2>

          <p className="mt-7 max-w-md font-serif text-xl leading-relaxed text-ink-soft">
            The Fit Muslim is built on the belief that true strength begins with
            character. Every product we curate and every plan we craft is a
            reminder of your purpose, your discipline, and your Deen.
          </p>

          <p className="mt-4 max-w-md font-serif text-xl leading-relaxed text-ink-soft">
            We don&apos;t sell a lifestyle. We help you honour the one already
            written for you — body and soul.
          </p>

          <a
            href="#"
            className="group relative mt-9 inline-flex items-center gap-3 overflow-hidden border border-gold/60 px-8 py-4 text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-gold-deep transition-colors duration-500 hover:text-ivory"
          >
            <span className="relative z-10">Our Mission</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="relative z-10 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="absolute inset-0 z-0 origin-left scale-x-0 bg-linear-to-r from-green-700 via-green-800 to-green-900 transition-transform duration-500 ease-out group-hover:scale-x-100" />
          </a>
        </Reveal>

        {/* ---------- visual panel ---------- */}
        <Reveal delay={0.15} className="order-1 md:order-2">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm sm:aspect-[5/5]">
            {/* base gradient */}
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, #0a2419 0%, #0a0c09 55%, #050604 100%)" }}
            />
            {/* warm light glow at the end of the corridor */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(45% 40% at 50% 42%, rgba(232,199,102,0.42) 0%, rgba(212,175,55,0.16) 35%, transparent 68%)",
              }}
            />
            {/* arched corridor */}
            <svg
              viewBox="0 0 400 300"
              preserveAspectRatio="xMidYMax slice"
              className="absolute inset-0 h-full w-full"
              aria-hidden
            >
              <defs>
                <radialGradient id="doorway" cx="50%" cy="45%" r="55%">
                  <stop offset="0%" stopColor="#f6e6b4" stopOpacity="0.9" />
                  <stop offset="55%" stopColor="#d4af37" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
                </radialGradient>
              </defs>
              {/* the light doorway */}
              <path d={archPath(30)} fill="url(#doorway)" />
              {/* receding arches */}
              {ARCHES.map((w, i) => (
                <path
                  key={w}
                  d={archPath(w)}
                  fill="none"
                  stroke="#d4af37"
                  strokeWidth={1}
                  strokeOpacity={0.14 + i * 0.09}
                />
              ))}
              {/* floor reflection */}
              <ellipse cx="200" cy="298" rx="120" ry="14" fill="url(#doorway)" opacity="0.5" />
            </svg>
            {/* mashrabiya lattice, faint on the edges */}
            <div
              className="absolute inset-0 opacity-[0.10]"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'><g fill='none' stroke='%23d4af37' stroke-width='1'><path d='M30 2 46 30 30 58 14 30Z'/><path d='M2 30 30 14 58 30 30 46Z'/><circle cx='30' cy='30' r='7'/></g></svg>\")",
                backgroundSize: "56px 56px",
                WebkitMaskImage:
                  "linear-gradient(90deg, #000 0%, transparent 28%, transparent 72%, #000 100%)",
                maskImage:
                  "linear-gradient(90deg, #000 0%, transparent 28%, transparent 72%, #000 100%)",
              }}
            />
            {/* optional real photo overlay — drop /philosophy.jpg in /public to use */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url(/philosophy.jpg)" }}
            />
            {/* depth + grain */}
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, transparent 55%, rgba(5,6,4,0.65) 100%)" }}
            />
            <div
              className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
              }}
            />
            {/* ornamental gold frame */}
            <div className="pointer-events-none absolute inset-3 rounded-sm border border-gold/30">
              <span className="absolute inset-1.5 rounded-sm border border-gold/12" />
            </div>
          </div>
        </Reveal>
      </div>

      {/* floating wax seal straddling the columns */}
      <Reveal
        delay={0.35}
        className="pointer-events-none relative mx-auto -mt-16 hidden h-28 w-28 max-w-6xl md:block"
      >
        <div className="absolute left-1/2 h-28 w-28 -translate-x-[calc(50%+1px)] drop-shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
          <Seal />
        </div>
      </Reveal>
    </section>
  );
}

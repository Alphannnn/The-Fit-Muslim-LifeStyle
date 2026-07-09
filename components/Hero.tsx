"use client";

import { motion, type Variants } from "framer-motion";

const ease = [0.22, 0.61, 0.36, 1] as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } },
};
const rise: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.95, ease } },
};

/* soft out-of-focus lantern lights — warm interior mood, no people */
const BOKEH = [
  { top: "18%", left: "70%", size: 130, o: 0.28 },
  { top: "34%", left: "88%", size: 90, o: 0.35 },
  { top: "52%", left: "66%", size: 70, o: 0.22 },
  { top: "28%", left: "58%", size: 46, o: 0.3 },
  { top: "62%", left: "82%", size: 110, o: 0.2 },
  { top: "12%", left: "82%", size: 60, o: 0.25 },
  { top: "72%", left: "60%", size: 40, o: 0.28 },
];

export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden">
      {/* ============ ATMOSPHERIC BACKGROUND (right-weighted, no humans) ============ */}
      {/* base */}
      <div
        aria-hidden
        className="absolute inset-0 -z-50"
        style={{ background: "linear-gradient(105deg,#050604 0%,#080a07 42%,#0c0f0a 100%)" }}
      />
      {/* warm interior glow on the right */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 1.08 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2.2, ease }}
        className="absolute inset-0 -z-40"
        style={{
          background:
            "radial-gradient(50% 65% at 82% 42%, rgba(200,150,60,0.4) 0%, rgba(120,85,30,0.18) 34%, transparent 66%)",
        }}
      />
      {/* faint architectural arch on the right wall */}
      <svg
        aria-hidden
        viewBox="0 0 400 500"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-y-0 right-0 -z-40 h-full w-[62%]"
      >
        <path
          d="M120 500 L120 250 A130 130 0 0 1 380 250 L380 500"
          fill="none"
          stroke="#d4af37"
          strokeOpacity="0.16"
          strokeWidth="1.2"
        />
        <path
          d="M170 500 L170 280 A80 80 0 0 1 330 280 L330 500"
          fill="none"
          stroke="#d4af37"
          strokeOpacity="0.1"
          strokeWidth="1"
        />
      </svg>
      {/* lantern bokeh */}
      <div aria-hidden className="absolute inset-0 -z-40">
        {BOKEH.map((b, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              top: b.top,
              left: b.left,
              width: b.size,
              height: b.size,
              background: `radial-gradient(circle, rgba(246,230,180,${b.o}) 0%, rgba(212,175,55,${b.o * 0.4}) 40%, transparent 70%)`,
              filter: "blur(2px)",
            }}
            animate={{ opacity: [b.o, b.o * 1.6, b.o], scale: [1, 1.06, 1] }}
            transition={{ duration: 5 + i, repeat: Infinity, ease }}
          />
        ))}
      </div>
      {/* marble floor sheen */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-40 h-1/3"
        style={{ background: "radial-gradient(60% 100% at 78% 100%, rgba(212,175,55,0.12), transparent 70%)" }}
      />
      {/* mashrabiya lattice, faint on the far right */}
      <div
        aria-hidden
        className="absolute inset-0 -z-40 opacity-[0.08]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'><g fill='none' stroke='%23d4af37' stroke-width='1'><path d='M32 2 50 32 32 62 14 32Z'/><path d='M2 32 32 14 62 32 32 50Z'/><circle cx='32' cy='32' r='8'/></g></svg>\")",
          backgroundSize: "60px 60px",
          WebkitMaskImage: "linear-gradient(90deg,transparent 55%,#000 100%)",
          maskImage: "linear-gradient(90deg,transparent 55%,#000 100%)",
        }}
      />
      {/* real photograph — warm lantern glow on black (no people); swap freely */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 1.06 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2.4, ease }}
        className="absolute inset-0 -z-30 bg-cover"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1596093019686-550d740a2870?fm=jpg&q=75&w=2400&auto=format&fit=crop')",
          backgroundPosition: "72% center",
        }}
      />
      {/* left-side scrim so the copy always reads cleanly */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20"
        style={{ background: "linear-gradient(90deg,#050604 0%,rgba(5,6,4,0.9) 30%,rgba(5,6,4,0.5) 55%,rgba(5,6,4,0.15) 100%)" }}
      />
      <div aria-hidden className="absolute inset-0 -z-20" style={{ background: "linear-gradient(180deg,rgba(5,6,4,0.6) 0%,transparent 20%,transparent 75%,rgba(5,6,4,0.85) 100%)" }} />
      {/* grain */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* ============ CONTENT ============ */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto w-full max-w-7xl px-6 md:px-10"
      >
        <div className="max-w-2xl">
          <motion.p
            variants={rise}
            className="mb-8 text-[0.66rem] uppercase tracking-[0.5em] text-gold-soft"
          >
            Est. MMXXVI &middot; Deen &amp; Discipline
          </motion.p>

          <motion.h1
            variants={rise}
            className="font-display text-[3rem] font-medium leading-[1.02] tracking-tight text-cream sm:text-6xl md:text-7xl lg:text-[5.6rem]"
          >
            A life of <span className="italic text-gold-gradient">iron</span>
            <br />
            and <span className="italic text-gold-gradient">faith</span>.
          </motion.h1>

          <motion.p
            variants={rise}
            className="mt-8 max-w-lg font-serif text-xl leading-relaxed text-parchment/85 sm:text-2xl"
          >
            Curated products, personalised plans, and writings for the modern
            Muslim — sister and brother alike — who trains the body as a trust
            and tends the soul as a garden.
          </motion.p>

          <motion.div variants={rise} className="mt-11 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
            <a
              href="#"
              className="group relative inline-flex items-center justify-center overflow-hidden px-9 py-4 text-[0.72rem] uppercase tracking-[0.24em] text-obsidian"
              style={{ background: "linear-gradient(180deg,#f6e6b4,#d4af37 45%,#b8860b)" }}
            >
              <span className="relative z-10">Enter the Store</span>
              <span className="absolute inset-0 -left-full z-0 h-full w-1/2 skew-x-[-20deg] bg-white/50 transition-all duration-700 group-hover:left-[150%]" />
            </a>
            <a
              href="#"
              className="group inline-flex items-center justify-center border border-gold/45 px-9 py-4 text-[0.72rem] uppercase tracking-[0.24em] text-gold-soft transition-all duration-300 hover:border-gold hover:bg-gold/10"
            >
              Become a Member
            </a>
          </motion.div>
        </div>
      </motion.div>

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 1 }}
        className="absolute bottom-9 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3 text-ink"
      >
        <span className="text-[0.55rem] uppercase tracking-[0.4em]">Scroll</span>
        <motion.span
          animate={{ height: [12, 30, 12], opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease }}
          className="block w-px bg-gradient-to-b from-gold to-transparent"
        />
      </motion.div>
    </section>
  );
}

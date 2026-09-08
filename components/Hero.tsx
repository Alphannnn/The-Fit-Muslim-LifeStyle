"use client";

import Link from "next/link";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

const ease = [0.22, 0.61, 0.36, 1] as const;

/** How long each hero background stays before it changes. */
export const SLIDE_INTERVAL = 15_000;

/* Hero backgrounds — one per slide.
   Swap the `src` values freely; anything wide and dark-toned works. */
const SLIDES = [
  {
    label: "Strength",
    eyebrow: "Fitness · Modest Activewear",
    titleTop: "Strong Body.",
    titleBottom: "Stronger Imaan.",
    copy: "Modest activewear, halal nutrition, and expert-approved training — built to train with discipline and intention.",
    src: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?fm=jpg&q=80&w=2400&auto=format&fit=crop",
    position: "center center",
  },
  {
    label: "Discipline",
    eyebrow: "Training · Expert Approved",
    titleTop: "Train Hard.",
    titleBottom: "Stay Humble.",
    copy: "Personalised plans engineered around your prayer times, your fast, and the life you actually live.",
    src: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?fm=jpg&q=80&w=2400&auto=format&fit=crop",
    position: "center 40%",
  },
  {
    label: "Nutrition",
    eyebrow: "Halal · Clean Fuel",
    titleTop: "Halal Fuel.",
    titleBottom: "Real Results.",
    copy: "Certified halal nutrition and whole-food guidance — no shortcuts, no doubtful ingredients, ever.",
    src: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?fm=jpg&q=80&w=2400&auto=format&fit=crop",
    position: "center center",
  },
  {
    label: "Ramadan",
    eyebrow: "Ramadan · Train Through It",
    titleTop: "Fast Strong.",
    titleBottom: "Finish Stronger.",
    copy: "Ramadan-ready programming, suhoor nutrition and iftar recovery — so thirty days of fasting build you instead of breaking you.",
    src: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?fm=jpg&q=80&w=2400&auto=format&fit=crop",
    position: "center 60%",
  },
];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};
const rise: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
};

const STATS = [
  { value: "12K+", label: "Members" },
  { value: "100%", label: "Halal Certified" },
  { value: "4.9★", label: "Rated" },
];

export default function Hero() {
  const [[index, dir], setSlide] = useState<[number, number]>([0, 1]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* (re)start the 15s clock — also called on arrow / dot clicks so the
     new slide always gets a full turn on screen. */
  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(
      () => setSlide(([i]) => [(i + 1) % SLIDES.length, 1]),
      SLIDE_INTERVAL,
    );
  }, []);

  useEffect(() => {
    schedule();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [index, schedule]);

  /* warm the cache so a slide never pops in half-loaded */
  useEffect(() => {
    SLIDES.forEach((s) => {
      const img = new window.Image();
      img.src = s.src;
    });
  }, []);

  const goTo = (i: number, d: number) => {
    setSlide([(i + SLIDES.length) % SLIDES.length, d]);
    schedule();
  };
  const next = () => goTo(index + 1, 1);
  const prev = () => goTo(index - 1, -1);

  const active = SLIDES[index];

  return (
    /* `isolate` keeps every layer below in one stacking context, so nothing
       can paint over the slideshow. */
    <section id="site-hero" className="relative isolate flex min-h-[92svh] items-center overflow-hidden bg-green-900 md:min-h-screen">
      {/* ============ SLIDING BACKGROUND ============ */}
      <div aria-hidden className="absolute inset-0 z-0 overflow-hidden">
        <AnimatePresence initial={false} custom={dir}>
          {/* slide + crossfade together: the two layers overlap, so there is
             never a hard seam between the outgoing and incoming photograph */}
          <motion.div
            key={index}
            custom={dir}
            initial={{ x: `${dir * 8}%`, opacity: 0 }}
            animate={{ x: "0%", opacity: 1 }}
            exit={{ x: `${dir * -8}%`, opacity: 0 }}
            transition={{ duration: 1.4, ease }}
            className="absolute inset-y-0 inset-x-[-12%]"
          >
            {/* slow Ken Burns drift for the whole 15s the slide is up */}
            <motion.div
              initial={{ scale: 1.04 }}
              animate={{ scale: 1.12 }}
              transition={{ duration: SLIDE_INTERVAL / 1000 + 2, ease: "linear" }}
              className="h-full w-full bg-cover bg-no-repeat"
              style={{
                backgroundImage: `url('${active.src}')`,
                backgroundPosition: active.position,
              }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* dark scrims — heavy on the left so the headline stays legible
         no matter which photograph is up */}
      <div
        aria-hidden
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(90deg,rgba(9,20,14,0.92) 0%,rgba(9,20,14,0.82) 34%,rgba(9,20,14,0.62) 55%,rgba(9,20,14,0.38) 75%,rgba(9,20,14,0.3) 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(180deg,rgba(9,20,14,0.55) 0%,transparent 30%,transparent 60%,rgba(9,20,14,0.75) 100%)",
        }}
      />

      {/* ============ CONTENT ============ */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pt-28 pb-28 sm:px-6 sm:pt-32 md:px-10 md:pt-36 md:pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            variants={container}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: -12, transition: { duration: 0.4, ease } }}
            className="max-w-2xl"
          >
            <motion.p
              variants={rise}
              className="mb-6 flex items-center gap-3 text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-gold-bright sm:mb-7 sm:gap-4 sm:text-[0.66rem] sm:tracking-[0.42em]"
            >
              <span className="h-px w-7 shrink-0 bg-gold-bright/70 sm:w-10" />
              {active.eyebrow}
            </motion.p>

            <motion.h1
              variants={rise}
              className="font-display text-[2.15rem] font-bold uppercase leading-[0.98] tracking-[-0.01em] text-ivory sm:text-5xl sm:leading-[0.95] md:text-6xl lg:text-7xl xl:text-[5.2rem]"
            >
              {active.titleTop}
              <br />
              <span className="text-gold-bright">{active.titleBottom}</span>
            </motion.h1>

            <motion.p
              variants={rise}
              className="mt-6 max-w-lg text-base leading-relaxed text-ivory/75 sm:mt-8 sm:text-lg md:text-xl"
            >
              {active.copy}
            </motion.p>

            <motion.div
              variants={rise}
              className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center sm:gap-5"
            >
              <Link
                href="/shop"
                className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-sm bg-gold-bright px-7 py-4 text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-green-900 sm:px-9 sm:text-[0.72rem] sm:tracking-[0.24em] shadow-[0_14px_34px_-16px_rgba(0,0,0,0.9)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-soft"
              >
                <span className="relative z-10">Shop the Collection</span>
                <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
                <span className="absolute inset-0 -left-full z-0 h-full w-1/2 skew-x-[-20deg] bg-white/30 transition-all duration-700 group-hover:left-[150%]" />
              </Link>
              <Link
                href="/plan"
                className="inline-flex items-center justify-center rounded-sm border border-ivory/40 px-7 py-4 text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-ivory sm:px-9 sm:text-[0.72rem] sm:tracking-[0.24em] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-bright hover:bg-ivory/10"
              >
                Training Plans
              </Link>
            </motion.div>

            {/* ============ STATS ============ */}
            <motion.div variants={rise} className="mt-10 max-w-xl sm:mt-14">
              <span className="mb-5 block h-px w-full bg-ivory/20 sm:mb-6" />
              <dl className="flex flex-wrap items-start gap-x-5 gap-y-4 sm:gap-x-12">
                {STATS.map((s, i) => (
                  <div
                    key={s.label}
                    className={
                      i > 0
                        ? "border-l border-ivory/20 pl-5 sm:pl-12"
                        : undefined
                    }
                  >
                    <dt className="font-display text-xl font-bold text-ivory sm:text-2xl md:text-[1.75rem]">
                      {s.value}
                    </dt>
                    <dd className="mt-1 text-[0.52rem] font-medium uppercase tracking-[0.2em] text-ivory/55 sm:text-[0.6rem] sm:tracking-[0.28em]">
                      {s.label}
                    </dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ============ ARROWS ============ */}
      <button
        type="button"
        onClick={prev}
        aria-label="Previous background"
        className="absolute left-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-ivory/30 text-ivory/80 transition-all duration-300 hover:border-gold-bright hover:bg-ivory/10 hover:text-ivory md:flex"
      >
        <span aria-hidden className="text-lg leading-none">
          ‹
        </span>
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Next background"
        className="absolute right-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-ivory/30 text-ivory/80 transition-all duration-300 hover:border-gold-bright hover:bg-ivory/10 hover:text-ivory md:flex"
      >
        <span aria-hidden className="text-lg leading-none">
          ›
        </span>
      </button>

      {/* ============ SLIDE CONTROLS ============ */}
      <div className="absolute bottom-6 left-5 z-20 flex items-center gap-4 sm:left-6 sm:gap-5 md:bottom-8 md:left-10">
        <AnimatePresence mode="wait">
          <motion.span
            key={active.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.45, ease }}
            className="hidden h-9 items-center justify-center rounded-full border border-ivory/25 px-3 text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-ivory/80 sm:flex"
          >
            {active.label}
          </motion.span>
        </AnimatePresence>

        <div className="flex items-center gap-2.5">
          {SLIDES.map((s, i) => (
            <button
              key={s.label}
              type="button"
              onClick={() => goTo(i, i > index ? 1 : -1)}
              aria-label={`Show ${s.label} background`}
              aria-current={i === index}
              className="group relative h-6 w-9 cursor-pointer"
            >
              <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-ivory/30 transition-colors group-hover:bg-ivory/60" />
              {i === index && (
                <motion.span
                  key={`bar-${index}`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: SLIDE_INTERVAL / 1000, ease: "linear" }}
                  className="absolute inset-x-0 top-1/2 h-0.5 origin-left -translate-y-1/2 bg-gold-bright"
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";
import { NAV } from "@/lib/site";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { count, ready, openCart } = useCart();
  const pathname = usePathname();

  /* The mobile sheet is stored as "open for this route", so navigating away
     closes it by derivation rather than through an effect. */
  const [openForPath, setOpenForPath] = useState<string | null>(null);
  const menuOpen = openForPath === pathname;
  const setMenuOpen = (open: boolean) => setOpenForPath(open ? pathname : null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Pages that open on a dark photographic hero mark it with #site-hero.
     The bar stays inverted for the whole height of that hero — not just the
     first 24px — and only turns ivory once the hero has scrolled past the
     bar. Routes without a hero fall back to the plain scroll threshold. */
  /* Stored against the route it was measured on, so navigating to a page with
     no hero falls back by derivation instead of through a reset effect. Only
     the observer callback — a genuine external subscription — sets state. */
  const [heroSeen, setHeroSeen] = useState<{ path: string; over: boolean } | null>(null);
  const overHero = heroSeen?.path === pathname ? heroSeen.over : pathname === "/";

  useEffect(() => {
    const hero = document.getElementById("site-hero");
    if (!hero) return;
    const io = new IntersectionObserver(
      ([entry]) => setHeroSeen({ path: pathname, over: entry.isIntersecting }),
      /* the negative top margin is the bar's own height, so the switch
         happens exactly as the hero's bottom edge slides under it */
      { rootMargin: "-72px 0px 0px 0px", threshold: 0 },
    );
    io.observe(hero);
    return () => io.disconnect();
  }, [pathname]);

  const onDark = overHero && !menuOpen;
  const solid = menuOpen || (!overHero && scrolled);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 0.61, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 print:hidden ${
        solid
          ? "border-b border-linen bg-ivory/90 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      {/* readability scrim — only while the bar floats over the dark hero,
         so the links never sit directly on a busy photograph */}
      {onDark && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full"
          style={{
            background:
              "linear-gradient(180deg,rgba(9,20,14,0.78) 0%,rgba(9,20,14,0.45) 60%,transparent 100%)",
          }}
        />
      )}

      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6 sm:py-4 md:px-10 md:py-5">
        {/* Logo + Wordmark */}
        <Link href="/" className="group flex min-w-0 items-center gap-2.5 sm:flex-1 sm:gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="The Fit Muslim"
            className="h-9 w-9 shrink-0 select-none object-contain transition-transform duration-500 group-hover:scale-105 sm:h-11 sm:w-11 md:h-12 md:w-12"
          />
          <span
            className={`hidden truncate font-display text-base font-semibold tracking-[0.12em] transition-colors sm:inline md:text-lg ${
              onDark ? "text-ivory" : "text-green-900"
            }`}
          >
            The Fit Muslim
          </span>
        </Link>

        {/* Center links */}
        <ul className="hidden items-center gap-7 lg:flex xl:gap-9">
          {NAV.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`group relative whitespace-nowrap text-[0.72rem] font-medium uppercase tracking-[0.2em] transition-colors ${
                  onDark
                    ? isActive(link.href)
                      ? "text-gold-bright"
                      : "text-ivory/85 hover:text-gold-bright"
                    : isActive(link.href)
                      ? "text-green-800"
                      : "text-ink-soft hover:text-green-800"
                }`}
              >
                {link.label}
                <span
                  className={`absolute -bottom-1.5 left-0 h-px transition-all duration-300 group-hover:w-full ${
                    onDark
                      ? "bg-gold-bright"
                      : "bg-linear-to-r from-gold to-gold-soft"
                  } ${isActive(link.href) ? "w-full" : "w-0"}`}
                />
              </Link>
            </li>
          ))}
        </ul>

        {/* Account + cart */}
        <div className="flex shrink-0 items-center justify-end gap-2 sm:flex-1">
          <Link
            href="/account"
            aria-label="Your account"
            className={`hidden h-10 w-10 place-items-center rounded-full border transition-colors sm:grid ${
              onDark
                ? "border-ivory/35 text-ivory hover:border-gold-bright hover:bg-ivory/10"
                : "border-linen text-ink-soft hover:border-gold hover:text-green-800"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="8.5" r="3.5" />
              <path d="M5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5" strokeLinecap="round" />
            </svg>
          </Link>

          <button
            type="button"
            onClick={openCart}
            aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
            className={`group relative inline-flex cursor-pointer items-center gap-2 rounded-sm border px-3 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.22em] transition-all hover:-translate-y-0.5 sm:gap-2.5 sm:px-5 ${
              onDark
                ? "border-gold-bright/60 text-gold-bright hover:border-gold-bright hover:bg-ivory/10"
                : "border-gold/50 text-gold-deep hover:border-gold hover:bg-gold/10"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 8h12l-1.2 11.2a1.5 1.5 0 0 1-1.5 1.3H8.7a1.5 1.5 0 0 1-1.5-1.3L6 8Z" strokeLinejoin="round" />
              <path d="M9 8a3 3 0 0 1 6 0" />
            </svg>
            <span className="hidden sm:inline">Cart</span>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={ready ? count : "loading"}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
                className={`grid h-5 min-w-5 place-items-center rounded-full px-1 text-[0.6rem] font-bold ${
                  count > 0
                    ? "bg-green-800 text-ivory"
                    : onDark
                      ? "bg-ivory/20 text-ivory"
                      : "bg-linen text-ink-muted"
                }`}
              >
                {ready ? count : "·"}
              </motion.span>
            </AnimatePresence>
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className={`grid h-10 w-10 cursor-pointer place-items-center rounded-full border transition-colors lg:hidden ${
              onDark
                ? "border-ivory/35 text-ivory hover:border-gold-bright hover:bg-ivory/10"
                : "border-linen text-ink-soft hover:border-gold hover:text-green-800"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* mobile sheet */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
            className="overflow-hidden border-t border-linen bg-ivory lg:hidden"
          >
            <ul className="mx-auto max-h-[70vh] max-w-7xl overflow-y-auto px-5 py-3 sm:px-6">
              {[...NAV, { label: "Your Account", href: "/account" }].map((link) => (
                <li key={link.href} className="border-b border-linen/70 last:border-0">
                  <Link
                    href={link.href}
                    className={`block py-3.5 text-[0.74rem] font-semibold uppercase tracking-[0.18em] transition-colors ${
                      isActive(link.href) ? "text-green-800" : "text-ink-soft"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

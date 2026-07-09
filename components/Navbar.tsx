"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const LINKS = ["Home", "The Store", "The Journal", "Community"];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 0.61, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        scrolled
          ? "backdrop-blur-md bg-obsidian/75 border-b border-gold/10"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10">
        {/* Logo + Wordmark */}
        <a href="#" className="group flex flex-1 items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="The Fit Muslim"
            className="h-11 w-11 select-none object-contain transition-transform duration-500 group-hover:scale-105 sm:h-12 sm:w-12"
          />
          <span className="hidden font-display text-lg font-semibold tracking-[0.14em] text-gold-gradient sm:inline">
            The Fit Muslim
          </span>
        </a>

        {/* Center links */}
        <ul className="hidden items-center gap-10 md:flex">
          {LINKS.map((l) => (
            <li key={l}>
              <a
                href="#"
                className="group relative text-[0.72rem] uppercase tracking-[0.2em] text-cream/70 transition-colors hover:text-gold-soft"
              >
                {l}
                <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-gradient-to-r from-gold to-gold-bright transition-all duration-300 group-hover:w-full" />
              </a>
            </li>
          ))}
        </ul>

        {/* Cart */}
        <div className="flex flex-1 items-center justify-end">
          <a
            href="#"
            className="inline-flex items-center rounded-sm border border-gold/40 px-5 py-2.5 text-[0.68rem] uppercase tracking-[0.22em] text-gold-soft transition-all hover:-translate-y-0.5 hover:border-gold hover:bg-gold/10"
          >
            Cart (0)
          </a>
        </div>
      </nav>
    </motion.header>
  );
}

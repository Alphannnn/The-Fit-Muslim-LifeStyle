"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const ease = [0.22, 0.61, 0.36, 1] as const;

const variants: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.85, ease } },
};

/** Fade + rise into view once, with optional stagger delay. */
export default function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article" | "header";
}) {
  const MotionTag = motion[as];
  return (
    <MotionTag
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

/** A small heraldic section label: rule · eyebrow · rule */
export function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-5 flex items-center justify-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.42em] text-gold-deep">
      <span className="h-px w-10 bg-linear-to-r from-transparent to-gold/70" />
      {children}
      <span className="h-px w-10 bg-linear-to-l from-transparent to-gold/70" />
    </p>
  );
}

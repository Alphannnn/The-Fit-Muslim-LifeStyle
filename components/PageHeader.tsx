import type { ReactNode } from "react";
import Reveal, { SectionEyebrow } from "./Reveal";

/** The standard page opener: eyebrow, display heading, serif intro. */
export default function PageHeader({
  eyebrow,
  title,
  highlight,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  /** trailing words rendered in the gold gradient */
  highlight?: string;
  intro?: string;
  children?: ReactNode;
}) {
  return (
    <header className="border-b border-linen bg-sand px-6 pt-32 pb-16 md:pt-40 md:pb-20">
      <Reveal className="mx-auto max-w-3xl text-center">
        <SectionEyebrow>{eyebrow}</SectionEyebrow>
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl md:text-5xl">
          {title}
          {highlight && <> <span className="text-gold-gradient">{highlight}</span></>}
        </h1>
        {intro && (
          <p className="mx-auto mt-5 max-w-xl font-serif text-lg leading-relaxed text-ink-soft">
            {intro}
          </p>
        )}
        {children}
      </Reveal>
    </header>
  );
}

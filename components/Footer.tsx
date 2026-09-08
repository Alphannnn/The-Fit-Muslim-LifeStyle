import Link from "next/link";
import NewsletterForm from "./NewsletterForm";
import { FOOTER_COLUMNS, SITE } from "@/lib/site";

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "YouTube", href: "https://youtube.com" },
  { label: "TikTok", href: "https://tiktok.com" },
  { label: "X", href: "https://x.com" },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-linen bg-sand px-6 pt-20 pb-10 print:hidden">
      <div className="mx-auto max-w-6xl">
        {/* top: brand + newsletter */}
        <div className="grid gap-12 pb-14 md:grid-cols-2">
          <div className="max-w-sm">
            <p className="font-display text-lg font-bold tracking-[0.22em] text-gold-gradient">
              THE FIT MUSLIM
            </p>
            <p className="mt-3 text-[0.66rem] font-medium uppercase tracking-[0.34em] text-ink-muted">
              {SITE.tagline}
            </p>
            <div className="mt-6 font-arabic text-2xl leading-loose text-green-800" dir="rtl">
              وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَىٰ
            </div>
            <p className="mt-2 font-serif text-base italic text-ink-soft">
              “And that man can have nothing but what he strives for.” — 53:39
            </p>
          </div>

          <div className="md:justify-self-end md:text-right">
            <h4 className="font-display text-sm font-semibold tracking-[0.18em] text-ink">
              Join the Community
            </h4>
            <p className="mt-3 max-w-xs font-serif text-lg text-ink-soft md:ml-auto">
              Weekly guidance on training, halal nutrition, and the deen. No noise.
            </p>
            <NewsletterForm />
          </div>
        </div>

        {/* link columns */}
        <div className="grid gap-8 border-t border-linen py-12 sm:grid-cols-2 md:grid-cols-4">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <h5 className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-gold-deep">
                {col.heading}
              </h5>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-soft transition-colors hover:text-green-800"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-linen pt-8 sm:flex-row">
          <p className="text-xs text-ink-muted">
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                rel="noopener noreferrer"
                target="_blank"
                className="grid h-9 w-9 place-items-center rounded-full border border-gold/35 text-gold-deep transition-all hover:-translate-y-0.5 hover:border-gold hover:bg-gold/10"
              >
                <span className="text-[0.6rem] font-semibold">{s.label[0]}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

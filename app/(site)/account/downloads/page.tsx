import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { purchasedDownloads } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Your Downloads",
  robots: { index: false, follow: false },
};

export default async function DownloadsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const downloads = await purchasedDownloads(user.id);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">Your downloads</h2>
        <p className="mt-1.5 text-[0.85rem] text-ink-soft">
          Every digital item you&apos;ve paid for, re-downloadable as often as you need.
        </p>
      </div>

      {downloads.length === 0 ? (
        <div className="rounded-lg border border-linen bg-sand p-8 text-center">
          <p className="font-serif text-lg text-ink">Nothing here yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
            Digital purchases unlock the moment payment clears — no waiting, no email
            to dig out.
          </p>
          <Link
            href="/shop?collection=digital"
            className="mt-6 inline-block rounded-sm bg-green-800 px-7 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-ivory transition-colors hover:bg-green-900"
          >
            See Digital Products
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {downloads.map((item) => (
            <li key={`${item.orderNumber}-${item.path}`}>
              <a
                href={item.path}
                download
                className="flex items-center justify-between gap-4 rounded-lg border border-linen bg-shell px-5 py-4 transition-all hover:-translate-y-0.5 hover:border-gold/50"
              >
                <div>
                  <p className="font-serif text-lg text-ink">{item.name}</p>
                  <p className="text-[0.6rem] font-medium uppercase tracking-[0.16em] text-ink-muted">
                    {item.subtitle} · Order {item.orderNumber}
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-2 rounded-sm bg-green-800 px-5 py-2.5 text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-ivory">
                  Download
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import SettingsForm from "@/components/SettingsForm";
import { getCurrentUser } from "@/lib/auth/session";
import { getSubscription } from "@/lib/account";
import { formatMoneyExact } from "@/lib/money";
import { CITIES } from "@/lib/prayer/locations";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const subscription = await getSubscription(user.id);
  const citySlug = CITIES.find((c) => c.name === user.city)?.slug ?? "";

  return (
    <div className="space-y-6">
      <SettingsForm name={user.name} email={user.email} citySlug={citySlug} />

      <section className="rounded-lg border border-linen bg-shell p-6">
        <h2 className="font-display text-lg font-semibold text-ink">Subscription</h2>
        {subscription ? (
          <div className="mt-3">
            <p className="font-serif text-base text-ink-soft">
              {formatMoneyExact(subscription.priceCents)} per {subscription.interval} ·{" "}
              <span
                className={
                  subscription.status === "active"
                    ? "font-semibold text-green-700"
                    : "font-semibold text-ink-muted"
                }
              >
                {subscription.status}
              </span>
            </p>
            {subscription.currentPeriodEnd && (
              <p className="mt-1 text-[0.78rem] text-ink-muted">
                {subscription.cancelAtPeriodEnd ? "Ends" : "Renews"} on{" "}
                {subscription.currentPeriodEnd.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
            <p className="mt-4 text-[0.78rem] leading-relaxed text-ink-muted">
              To cancel or change your billing, email us and we&apos;ll action it the
              same day — no retention scripts, no hoops.
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-ink-soft">
            You don&apos;t have an active subscription. Plans are also available as a
            one-off if you prefer.
          </p>
        )}
      </section>

      <section className="rounded-lg border border-linen bg-shell p-6">
        <h2 className="font-display text-lg font-semibold text-ink">Your data</h2>
        <p className="mt-3 text-[0.85rem] leading-relaxed text-ink-soft">
          We store what your plan needs and nothing more: your name, email, the metrics
          you entered, your progress log, and your order history. We never sell it.
          Ask us and we&apos;ll export or delete all of it.
        </p>
      </section>
    </div>
  );
}

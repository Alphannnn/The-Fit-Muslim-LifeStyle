import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Create an account to get a coach-reviewed plan, track your progress, and keep your downloads in one place.",
};

const BENEFITS = [
  "A personalised, coach-reviewed nutrition and training plan",
  "Meal windows that move with your prayer times",
  "Every order, receipt and download in one place",
  "Weight, waist, workouts and salah tracked week by week",
];

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [{ next }, user] = await Promise.all([searchParams, getCurrentUser()]);
  if (user) redirect(next && next.startsWith("/") ? next : "/account");

  return (
    <div className="px-6 pt-32 pb-24 md:pt-40">
      <div className="mx-auto grid max-w-3xl gap-10 md:grid-cols-2 md:items-start">
        <div>
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.32em] text-gold-deep">
            Join us
          </p>
          <h1 className="mt-4 font-display text-3xl font-semibold leading-tight text-ink">
            Start your <span className="text-gold-gradient">journey</span>
          </h1>
          <p className="mt-4 font-serif text-lg leading-relaxed text-ink-soft">
            One account for your plan, your progress and your orders.
          </p>

          <ul className="mt-7 space-y-3">
            {BENEFITS.map((b) => (
              <li key={b} className="flex gap-3 text-[0.92rem] leading-relaxed text-ink-soft">
                <svg viewBox="0 0 24 24" className="mt-1 h-4 w-4 shrink-0 text-green-700" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {b}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-linen bg-sand p-6">
          <AuthForm mode="signup" next={next} />
        </div>
      </div>
    </div>
  );
}

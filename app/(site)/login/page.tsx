import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to reach your plans, orders and downloads.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [{ next }, user] = await Promise.all([searchParams, getCurrentUser()]);
  if (user) redirect(next && next.startsWith("/") ? next : "/account");

  return (
    <div className="px-6 pt-32 pb-24 md:pt-40">
      <div className="mx-auto max-w-sm">
        <header className="text-center">
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.32em] text-gold-deep">
            Welcome back
          </p>
          <h1 className="mt-4 font-display text-3xl font-semibold text-ink">
            Sign <span className="text-gold-gradient">in</span>
          </h1>
          <p className="mt-3 font-serif text-base text-ink-soft">
            Your plans, orders and downloads, all in one place.
          </p>
        </header>

        <div className="mt-8 rounded-lg border border-linen bg-sand p-6">
          <AuthForm mode="login" next={next} />
        </div>
      </div>
    </div>
  );
}

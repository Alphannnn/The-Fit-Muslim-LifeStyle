import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import { getAdminUser } from "@/lib/admin/auth";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; signedOut?: string }>;
}) {
  const [{ next, signedOut }, user] = await Promise.all([searchParams, getAdminUser()]);
  if (user) redirect(next?.startsWith("/admin") ? next : "/admin");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-rail px-5 py-12">
      {/* quiet atmosphere, nothing that competes with the form */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 55% at 50% 0%, rgba(44,125,87,0.22), transparent 70%), radial-gradient(50% 40% at 80% 100%, rgba(169,127,34,0.14), transparent 70%)",
        }}
      />

      <main className="relative w-full max-w-[25rem]">
        <div className="mb-7 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="The Fit Muslim"
            className="mx-auto h-14 w-14 object-contain"
          />
          <h1 className="mt-5 text-[1.35rem] font-semibold tracking-[-0.01em] text-white">
            Control Panel
          </h1>
          <p className="mt-1.5 text-[0.85rem] text-white/45">
            Staff access only. Every sign-in is recorded.
          </p>
        </div>

        {signedOut && (
          <p className="mb-4 rounded-md border border-white/15 bg-white/5 px-3.5 py-2.5 text-center text-[0.8rem] text-white/60">
            You have been signed out.
          </p>
        )}

        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)] backdrop-blur-sm">
          <AdminLoginForm next={next} />
        </div>

        <p className="mt-6 text-center text-[0.76rem] leading-relaxed text-white/35">
          Staff accounts are issued by invitation only — there is no sign-up here.
          Need access? Ask an existing admin to send you a link.
        </p>

        <p className="mt-5 text-center">
          <Link
            href="/"
            className="text-[0.76rem] text-white/40 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white/70"
          >
            Back to the store
          </Link>
        </p>
      </main>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import AcceptInviteForm from "@/components/admin/AcceptInviteForm";
import { checkInvite } from "@/lib/admin/invites";

export const metadata: Metadata = {
  title: "Accept invitation",
  robots: { index: false, follow: false, nocache: true },
};

const REASONS: Record<string, { title: string; body: string }> = {
  unknown: {
    title: "This link isn't recognised",
    body: "It may have been mistyped, or the invitation was replaced by a newer one.",
  },
  expired: {
    title: "This invitation has expired",
    body: "Invitations are valid for seven days. Ask an admin to send you a fresh link.",
  },
  revoked: {
    title: "This invitation was withdrawn",
    body: "An admin cancelled it. Get in touch with them if you think that was a mistake.",
  },
  used: {
    title: "This invitation has already been used",
    body: "An account was created with this link. Try signing in instead.",
  },
  email_taken: {
    title: "That address already has an account",
    body: "Sign in with it instead, or ask an admin to change the role on the existing account.",
  },
};

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await checkInvite(token);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-rail px-5 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 55% at 50% 0%, rgba(44,125,87,0.22), transparent 70%), radial-gradient(50% 40% at 80% 100%, rgba(169,127,34,0.14), transparent 70%)",
        }}
      />

      <main className="relative w-full max-w-[26rem]">
        <div className="mb-7 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="The Fit Muslim" className="mx-auto h-14 w-14 object-contain" />
          <h1 className="mt-5 text-[1.35rem] font-semibold tracking-[-0.01em] text-white">
            {result.ok ? "You've been invited" : "Invitation problem"}
          </h1>
          <p className="mt-1.5 text-[0.85rem] text-white/45">
            {result.ok
              ? "Set a password to finish creating your staff account."
              : "We couldn't accept this invitation."}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)] backdrop-blur-sm">
          {result.ok ? (
            <AcceptInviteForm
              token={token}
              email={result.invite.email}
              role={result.invite.role}
            />
          ) : (
            <div className="text-center">
              <p className="text-[0.95rem] font-semibold text-white">
                {REASONS[result.reason].title}
              </p>
              <p className="mt-2 text-[0.83rem] leading-relaxed text-white/50">
                {REASONS[result.reason].body}
              </p>
              <Link
                href="/admin/login"
                className="mt-6 inline-block rounded-md bg-gold-bright px-6 py-2.5 text-[0.8rem] font-semibold text-rail transition-colors hover:bg-gold-soft"
              >
                Go to sign in
              </Link>
            </div>
          )}
        </div>

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

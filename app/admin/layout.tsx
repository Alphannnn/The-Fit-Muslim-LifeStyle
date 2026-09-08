import type { Metadata } from "next";

/* The whole admin tree is kept out of search engines and out of the
   storefront's chrome. Guarding happens one level down, in (panel), so the
   sign-in and invite pages remain reachable without a session. */
export const metadata: Metadata = {
  title: { default: "Control Panel", template: "%s · Control Panel" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}

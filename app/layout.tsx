import type { Metadata } from "next";
import "./globals.css";
import CartProvider from "@/components/CartProvider";
import CartDrawer from "@/components/CartDrawer";
import { SITE, siteOrigin } from "@/lib/site";

export const metadata: Metadata = {
  /* metadataBase makes every relative canonical/OG url in the app absolute */
  metadataBase: new URL(siteOrigin()),
  title: {
    default: `${SITE.name} — Faith. Discipline. Strength.`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — Faith. Discipline. Strength.`,
    description: SITE.description,
    url: siteOrigin(),
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Fraunces:ital,opsz,wght@0,9..144,300..800;1,9..144,300..800&family=Plus+Jakarta+Sans:ital,wght@0,300..700;1,400..600&family=Source+Serif+4:ital,opsz,wght@0,8..60,300..600;1,8..60,300..600&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#fcfaf6" />
      </head>
      <body className="min-h-full bg-ivory antialiased">
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}

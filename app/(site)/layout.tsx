import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PrayerBar from "@/components/PrayerBar";

/* Storefront chrome. Deliberately free of `cookies()`/session reads so product
   and journal pages stay statically renderable — the cart badge and the prayer
   bar both hydrate on the client instead. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <PrayerBar />
      <main className="relative">{children}</main>
      <Footer />
    </>
  );
}

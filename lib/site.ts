export const SITE = {
  name: "The Fit Muslim",
  tagline: "Faith · Discipline · Strength",
  description:
    "Premium Islamic & fitness essentials, faith-driven training, and personalised, expert-approved diet plans. Where discipline of the soul meets strength of the body.",
} as const;

export const NAV = [
  { label: "The Store", href: "/shop" },
  { label: "Your Plan", href: "/plan" },
  { label: "The Journal", href: "/journal" },
  { label: "Prayer Times", href: "/prayer-times" },
] as const;

export const FOOTER_COLUMNS = [
  {
    heading: "Shop",
    links: [
      { label: "Everything", href: "/shop" },
      { label: "Nutrition", href: "/shop?collection=nutrition" },
      { label: "Worship Essentials", href: "/shop?collection=worship" },
      { label: "Ramadan", href: "/shop?collection=ramadan" },
      { label: "Digital", href: "/shop?collection=digital" },
    ],
  },
  {
    heading: "Programs",
    links: [
      { label: "Personalised Plan", href: "/plan" },
      { label: "How It Works", href: "/plan#how-it-works" },
      { label: "Prayer Times", href: "/prayer-times" },
      { label: "Ramadan Prep", href: "/shop?collection=ramadan" },
    ],
  },
  {
    heading: "Learn",
    links: [
      { label: "The Journal", href: "/journal" },
      { label: "Nutrition", href: "/journal?category=Nutrition" },
      { label: "Training", href: "/journal?category=Training" },
      { label: "Mindset", href: "/journal?category=Mindset" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Sign In", href: "/login" },
      { label: "Your Orders", href: "/account/orders" },
      { label: "Your Plans", href: "/account/plans" },
      { label: "Downloads", href: "/account/downloads" },
    ],
  },
] as const;

/** Canonical origin, used for metadata, sitemaps and Stripe redirects. */
export function siteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const origin = siteOrigin();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        /* nothing behind a session should ever be indexed */
        disallow: ["/account", "/admin", "/checkout", "/orders", "/api"],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}

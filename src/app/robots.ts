import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://crackcrimebahamas.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep the admin area, API, auth, and the admin-only pages out of indexes.
      // The tip form (/submit-tip) is public and meant to be found.
      disallow: ["/admin", "/api", "/login", "/sign-up", "/wanted", "/missing"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

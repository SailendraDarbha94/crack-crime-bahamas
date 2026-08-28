import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://crackcrimebahamas.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep the admin area, API, auth, and the now admin-only pages out of indexes
      disallow: ["/admin", "/api", "/login", "/sign-up", "/wanted", "/missing", "/submit-tip"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

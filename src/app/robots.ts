import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://crackcrimebahamas.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep the admin area and API out of search indexes
      disallow: ["/admin", "/api", "/login", "/sign-up"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

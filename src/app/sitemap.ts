import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://crackcrimebahamas.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/contact",
    "/member",
    "/more-about-us",
    "/legal/privacy",
    "/legal/terms",
  ];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    changeFrequency: "monthly",
    priority: route === "" ? 1 : 0.5,
  }));
}

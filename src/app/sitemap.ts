import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://crackcrimebahamas.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/wanted",
    "/missing",
    "/submit-tip",
    "/contact",
    "/member",
    "/more-about-us",
    "/legal/privacy",
    "/legal/terms",
  ];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    changeFrequency: route === "/wanted" || route === "/missing" ? "daily" : "monthly",
    priority: route === "" ? 1 : route === "/wanted" || route === "/missing" ? 0.8 : 0.5,
  }));
}

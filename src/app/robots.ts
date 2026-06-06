import type { MetadataRoute } from "next";

const SITE_URL = "https://seungwoo.i234.me";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/"],
      crawlDelay: 1,
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/games", "/how-to-play", "/operators", "/operators/"],
        disallow: ["/guess-who-am-i", "/guess-who-am-i/", "/rooms", "/rooms/", "/login"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

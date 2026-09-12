import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://trippy-mate.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/create"],
        disallow: ["/trip/"], // private trip dashboards — no reason for Google to index someone's savings data
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

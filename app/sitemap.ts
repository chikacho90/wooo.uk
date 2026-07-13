import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://woo.moi",
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}

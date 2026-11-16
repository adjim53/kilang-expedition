import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/utils";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = appUrl();
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/waiver`, changeFrequency: "monthly", priority: 0.5 },
  ];
}

import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/utils";

/** Search engines may index the public site, never the back office, APIs or private pass pages. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/pass/"] },
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}

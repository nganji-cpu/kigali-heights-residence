import type { MetadataRoute } from "next";

/**
 * The prototype is a concept study, not a live property, so crawlers are asked
 * to stay away. This keeps the fictional content out of search results.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}

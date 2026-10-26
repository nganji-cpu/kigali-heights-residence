import type { MetadataRoute } from "next";

/**
 * The project is a design concept, not a live property, so crawlers are asked
 * to stay away. This keeps illustrative content out of search results.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}

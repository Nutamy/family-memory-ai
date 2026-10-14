import type { MetadataRoute } from "next";

// Only the public pages are indexable; archives, sign-in and the API never are.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/", "/privacy", "/terms"], disallow: ["/app", "/local", "/api", "/login", "/register", "/start", "/continue"] }],
  };
}

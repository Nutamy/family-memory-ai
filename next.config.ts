import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// 'unsafe-inline' scripts: the theme bootstrap and Next's inline hydration data (a nonce
// would force every page to render dynamically). blob: covers the AudioWorklet module.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' blob: https://challenges.cloudflare.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "connect-src 'self'",
  "frame-src https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  // Audio uploads can be large; route handlers read the body themselves.
  experimental: { serverActions: { bodySizeLimit: "50mb" } },
  serverExternalPackages: ["@prisma/client", ".prisma/client", "bcryptjs"],
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

// `npm run dev:cf` runs `next dev` against local D1/R2 emulated by Wrangler.
if (process.env.CF_DEV === "1") {
  import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev());
}

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Audio uploads can be large; route handlers read the body themselves.
  experimental: { serverActions: { bodySizeLimit: "50mb" } },
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
};

export default nextConfig;

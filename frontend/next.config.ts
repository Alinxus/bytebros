import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL || "http://bytebros.fly.dev";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${BACKEND_URL}/auth/:path*`,
      },
      {
        source: "/api/cancer/:path*",
        destination: `${BACKEND_URL}/cancer/:path*`,
      },
    ];
  },
};

export default nextConfig;

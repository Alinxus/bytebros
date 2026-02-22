"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://bytebros.fly.dev";
const nextConfig = {
    async rewrites() {
        return [
            {
                source: "/api/auth/:path*",
                destination: `${BACKEND_URL}/auth/:path*`,
            },
            {
                source: "/api/screening/:path*",
                destination: `${BACKEND_URL}/screening/:path*`,
            },
        ];
    },
};
exports.default = nextConfig;

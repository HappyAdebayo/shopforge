import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: "http://localhost:3001/auth/:path*",
      },
      {
        source: "/api/vendors/:path*",
        destination: "http://localhost:3002/vendors/:path*",
      },
      {
        source: "/api/products/:path*",
        destination: "http://localhost:3003/products/:path*",
      },
      {
        source: "/api/categories/:path*",
        destination: "http://localhost:3003/categories/:path*",
      },
      {
        source: "/api/calls/:path*",
        destination: "http://localhost:3004/calls/:path*",
      },
      {
        source: "/api/notifications/:path*",
        destination: "http://localhost:3005/notifications/:path*",
      },
      {
        source: "/api/cart/:path*",
        destination: "http://localhost:3006/cart/:path*",
      },
      {
        source: "/api/orders/:path*",
        destination: "http://localhost:3007/orders/:path*",
      },
      {
        source: "/api/payments/:path*",
        destination: "http://localhost:3008/payments/:path*",
      },
      {
        source: "/api/recommendations/:path*",
        destination: "http://localhost:3009/:path*",
      },
      {
        source: "/api/interactions/:path*",
        destination: "http://localhost:3003/interactions/:path*",
      },
    ];
  },
};

export default nextConfig;

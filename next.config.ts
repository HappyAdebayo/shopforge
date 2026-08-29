import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ];
  },
};

export default nextConfig;

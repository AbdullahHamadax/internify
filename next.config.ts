import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        // Convex file storage (company logos, etc.)
        protocol: "https",
        hostname: "**.convex.cloud",
      },
    ],
  },
};

export default nextConfig;

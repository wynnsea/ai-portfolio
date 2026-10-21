import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Sembunyikan logo/indikator Next.js di pojok kiri bawah saat development
  devIndicators: false,
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

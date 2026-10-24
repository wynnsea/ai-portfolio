import type { NextConfig } from "next";

// Foto & cover yang diunggah lewat admin disimpan di Supabase Storage (bucket "media").
// next/image hanya mau memuat gambar luar dari alamat yang didaftarkan di sini.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseUrl ? [new URL(`${supabaseUrl}/storage/v1/object/public/media/**`)] : [],
  },
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

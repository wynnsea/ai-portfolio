import type { NextConfig } from "next";

// Foto & cover yang diunggah lewat admin disimpan di Supabase Storage (bucket "media").
// next/image hanya mau memuat gambar luar dari alamat yang didaftarkan di sini.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");

const isDev = process.env.NODE_ENV !== "production";
const supabaseWs = supabaseUrl?.replace(/^http/, "ws") ?? "";
const turnstile = "https://challenges.cloudflare.com";

// CSP tanpa nonce: nonce butuh render dinamis dan tidak cocok dengan Partial Prerendering
// (lihat node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md),
// jadi script inline Next.js tetap diizinkan lewat 'unsafe-inline'.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${turnstile}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' blob: data: ${supabaseUrl ?? ""}`,
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseUrl ?? ""} ${supabaseWs} ${turnstile}${isDev ? " ws: http://localhost:*" : ""}`,
  `frame-src ${turnstile}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
]
  .map((d) => d.replace(/\s+/g, " ").trim())
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseUrl ? [new URL(`${supabaseUrl}/storage/v1/object/public/media/**`)] : [],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
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

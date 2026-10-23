import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

// Alternatif gratis yang mirip Aeonik (neo-grotesk, bersih & modern).
// Jika punya lisensi Aeonik, ganti dengan next/font/local (lihat README).
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
});

// URL website setelah online, dipakai untuk link absolut gambar preview.
// Isi NEXT_PUBLIC_SITE_URL di .env (mis. https://wynnsea.vercel.app). Di Vercel, Next.js mengisinya otomatis.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: site.brand,
  description: site.metaDescription,
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: site.brand,
    title: `${site.brand} | ${site.name}, ${site.role}`,
    description: site.metaDescription,
  },
  twitter: { card: "summary_large_image" },
};

// Layout root: hanya <html>, font, dan metadata. Dipakai bersama oleh website (site) dan admin.
// Elemen khas website (preloader, navbar, SEA AI) ada di app/(site)/layout.tsx.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${interTight.variable} antialiased`} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}

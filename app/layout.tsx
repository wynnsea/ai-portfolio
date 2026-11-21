import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter_Tight, Lora, Young_Serif } from "next/font/google";
import { site } from "@/lib/site";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

// Alternatif gratis yang mirip Aeonik (neo-grotesk, bersih & modern).
// Jika punya lisensi Aeonik, ganti dengan next/font/local (lihat README).
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
});

// Font website publik (di-host sendiri oleh next/font, jadi lolos CSP & tanpa request ke Google):
// - Instrument Serif: judul besar (h1/h2) & teks display
// - Young Serif: judul kartu (h3)
// - Lora: teks isi & elemen UI
// Panel admin tetap memakai Inter Tight supaya tabel & form mudah dibaca.
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});
const youngSerif = Young_Serif({
  variable: "--font-young-serif",
  subsets: ["latin"],
  weight: "400",
});
const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const seoName = "Wayan Deva Adhisthanaya";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    // Judul tab browser cukup nama brand; halaman lain jadi "Judul | Wynnsea"
    default: site.brand,
    template: `%s | ${site.brand}`,
  },
  description: `${seoName}, dikenal juga dengan nama ${site.brand}. Portfolio resmi dan profil profesional Wayan Deva Adhisthanaya.`,
  applicationName: site.brand,
  keywords: [
    seoName,
    "Wayan Deva",
    "Wayan Adhisthanaya",
    "Wynnsea",
    "Wynnsea portfolio",
    "portfolio Wayan Deva Adhisthanaya",
    "website resmi Wayan Deva Adhisthanaya",
  ],
  authors: [{ name: seoName, url: siteUrl.toString() }],
  creator: seoName,
  publisher: site.brand,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: site.brand,
    title: `${seoName} (${site.brand}) | ${site.role}`,
    description: `${seoName}, dikenal juga dengan nama ${site.brand}. Portfolio resmi dan profil profesional.`,
    url: "/",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${site.name} — ${site.role}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${seoName} (${site.brand}) | ${site.role}`,
    description: `${seoName}, dikenal juga dengan nama ${site.brand}. Portfolio resmi dan profil profesional.`,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

// Layout root: hanya <html>, font, dan metadata. Dipakai bersama oleh website (site) dan admin.
// Elemen khas website (preloader, navbar, SEA AI) ada di app/(site)/layout.tsx.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${interTight.variable} ${instrumentSerif.variable} ${youngSerif.variable} ${lora.variable} antialiased`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}

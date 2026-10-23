import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import { SmoothScroll } from "@/components/providers/smooth-scroll";
import { IntroProvider, introScript } from "@/components/providers/intro-provider";
import { Navbar } from "@/components/navbar";
import { ChatLauncher } from "@/components/chat-launcher";
import { CommandPalette } from "@/components/ai/command-palette";
import { buildSearchIndex } from "@/lib/ai/search-index";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" data-intro="playing" className={`${interTight.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
      </head>
      <body>
        <SmoothScroll>
          <IntroProvider>
            <Navbar />
            {children}
            <ChatLauncher />
            <CommandPalette items={buildSearchIndex()} />
          </IntroProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}

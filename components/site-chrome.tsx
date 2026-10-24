import { SmoothScroll } from "@/components/providers/smooth-scroll";
import { IntroProvider, introScript } from "@/components/providers/intro-provider";
import { Navbar } from "@/components/navbar";
import { ChatLauncher } from "@/components/chat-launcher";
import { CommandPalette } from "@/components/ai/command-palette";
import { InlineScript } from "@/components/inline-script";
import { buildSearchIndex } from "@/lib/ai/search-index";
import { SiteSettingsProvider } from "@/components/providers/site-settings-provider";
import { VisitTracker } from "@/components/visit-tracker";

/**
 * Semua elemen khas website portfolio: preloader, smooth scroll, navbar, SEA AI, dan pencarian.
 * Dipakai oleh layout (site) dan halaman 404. Halaman admin tidak memakai ini.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <SiteSettingsProvider>
      <>
        {/* Set status intro di <html> sebelum preloader dirender (kunci scroll / lewati preloader) */}
        <InlineScript html={introScript} />
        <SmoothScroll>
          <IntroProvider>
            <Navbar />
            {children}
            <ChatLauncher />
            <CommandPalette items={buildSearchIndex()} />
            <VisitTracker />
          </IntroProvider>
        </SmoothScroll>
      </>
    </SiteSettingsProvider>
  );
}

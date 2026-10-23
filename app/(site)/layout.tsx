import { SiteChrome } from "@/components/site-chrome";

// Layout website portfolio. URL tidak berubah: (site) hanya pengelompokan folder.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}

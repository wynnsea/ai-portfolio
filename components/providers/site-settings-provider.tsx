"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { site } from "@/lib/site";
import { getPublicSettings } from "@/lib/public-api";
import type { SiteSettings } from "@/lib/public-api";

const defaultSettings: SiteSettings = {
  brand: site.brand,
  name: site.name,
  nameJp: site.nameJp,
  role: site.role,
  description: site.description,
  location: site.location,
  email: site.email,
  photoUrl: site.photo,
  cvUrl: site.cv || null,
  availability: site.availability,
  socials: [...site.socials],
  features: { chatbot: true, preloader: true },
};

const SiteSettingsContext = createContext<SiteSettings>(defaultSettings);

export const useSiteSettings = () => useContext(SiteSettingsContext);

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    let active = true;
    getPublicSettings()
      .then((result) => {
        if (active) setSettings(result);
      })
      .catch((error: unknown) => {
        console.error("Gagal memuat pengaturan portfolio dari API.", error);
      });

    return () => {
      active = false;
    };
  }, []);

  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>;
}

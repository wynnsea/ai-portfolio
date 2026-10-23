"use client";

import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence } from "motion/react";
import { useLenis } from "lenis/react";
import { Preloader } from "@/components/preloader";
import { useSiteSettings } from "@/components/providers/site-settings-provider";

export const INTRO_STORAGE_KEY = "intro-seen";

// Script ini berjalan di <head> sebelum paint pertama, jadi preloader tidak "berkedip"
// pada kunjungan kedua dalam sesi yang sama.
export const introScript = `(function(){try{var s=sessionStorage.getItem("${INTRO_STORAGE_KEY}")==="1";document.documentElement.setAttribute("data-intro",s?"skip":"playing")}catch(e){}})()`;

const IntroContext = createContext({ done: false });

export const useIntro = () => useContext(IntroContext);

const noopSubscribe = () => () => {};

function readSeen() {
  try {
    return sessionStorage.getItem(INTRO_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function IntroProvider({ children }: { children: React.ReactNode }) {
  // Server selalu merender preloader; client membaca sessionStorage tanpa hydration error.
  const seen = useSyncExternalStore(noopSubscribe, readSeen, () => false);
  const [finished, setFinished] = useState(false);
  const settings = useSiteSettings();
  const done = seen || finished || !settings.features.preloader;
  const lenis = useLenis();

  const finish = useCallback(() => setFinished(true), []);

  // Tandai "sudah dilihat" SETELAH animasi keluar selesai. Kalau ditandai lebih awal,
  // `seen` langsung jadi true dan preloader dilepas sebelum tirainya sempat terangkat.
  const markSeen = useCallback(() => {
    try {
      sessionStorage.setItem(INTRO_STORAGE_KEY, "1");
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-intro", done ? "done" : "playing");
    if (done) {
      lenis?.start();
    } else {
      window.scrollTo(0, 0);
      lenis?.stop();
    }
  }, [done, lenis]);

  return (
    <IntroContext.Provider value={{ done }}>
      {/* Jika intro sudah pernah dilihat, preloader dilepas tanpa animasi keluar */}
      {settings.features.preloader && !seen && (
        <AnimatePresence onExitComplete={markSeen}>{!finished && <Preloader key="preloader" onComplete={finish} />}</AnimatePresence>
      )}
      {children}
    </IntroContext.Provider>
  );
}

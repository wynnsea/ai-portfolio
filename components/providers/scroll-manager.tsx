"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";

/**
 * Pengatur posisi scroll antar halaman.
 *
 * Lenis menyimpan posisi scroll sendiri, jadi scroll bawaan Next.js/browser saat pindah halaman
 * sering "ditarik balik" ke posisi lama (mis. buka artikel malah mendarat di footer).
 * Komponen ini mengambil alih semuanya lewat Lenis:
 * - Navigasi biasa ke halaman lain → mulai dari atas.
 * - Navigasi ke "/#section" → langsung ke section itu.
 * - Tombol back/forward browser & reload → kembali ke posisi terakhir di halaman itu.
 */

const STORAGE_KEY = "wynnsea-scroll-positions";
export const PREV_PATH_KEY = "wynnsea-prev-path";

function readPositions(): Record<string, number> {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function savePosition(path: string, y: number) {
  try {
    const positions = readPositions();
    positions[path] = Math.max(0, Math.round(y));
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch {
    // sessionStorage diblokir: posisi tidak diingat, tidak masalah
  }
}

/** Ulangi scroll sampai target tersedia (section beranda dirender bertahap), maks ±3 detik. */
function scrollWhenReady(
  getTarget: () => number | HTMLElement | null,
  canReach: (y: number) => boolean,
  scroll: (target: number | HTMLElement) => void,
  giveUp: () => void,
) {
  let frame = 0;
  let tries = 0;
  const attempt = () => {
    const target = getTarget();
    const ready = target instanceof HTMLElement ? true : typeof target === "number" && canReach(target);
    if ((ready || tries > 180) && target !== null) {
      scroll(target);
      return;
    }
    tries++;
    if (tries > 180) return giveUp();
    frame = requestAnimationFrame(attempt);
  };
  attempt();
  return () => cancelAnimationFrame(frame);
}

export function ScrollManager() {
  const pathname = usePathname();
  const lenis = useLenis();
  const isPop = useRef(false);
  // Selama pindah halaman, jangan simpan posisi (bisa menimpa posisi halaman lama dengan 0)
  const frozen = useRef(false);
  const firstRun = useRef(true);
  const prevPath = useRef<string | null>(null);

  // Browser jangan memulihkan scroll sendiri; kita yang mengatur
  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  // Catat posisi scroll halaman yang sedang dibuka
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      if (frozen.current) return;
      clearTimeout(timer);
      timer = setTimeout(() => !frozen.current && savePosition(window.location.pathname, window.scrollY), 120);
    };
    const onPop = () => {
      isPop.current = true;
      frozen.current = true;
    };
    // Klik link internal ke halaman lain: simpan posisi sekarang SEBELUM Next.js mengubah scroll
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.origin !== window.location.origin) return;
      if (link.pathname === window.location.pathname) return; // cuma pindah section di halaman yang sama
      savePosition(window.location.pathname, window.scrollY);
      frozen.current = true;
    };
    const onHide = () => savePosition(window.location.pathname, window.scrollY);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("popstate", onPop);
    document.addEventListener("click", onClick, true);
    window.addEventListener("pagehide", onHide);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("popstate", onPop);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("pagehide", onHide);
    };
  }, []);

  // Atur posisi setiap kali halaman berganti
  useEffect(() => {
    if (!lenis) return;

    // Halaman sebelumnya di situs ini (dipakai BackLink). Muat pertama = tidak ada halaman sebelumnya.
    try {
      if (prevPath.current) sessionStorage.setItem(PREV_PATH_KEY, prevPath.current);
      else sessionStorage.removeItem(PREV_PATH_KEY);
    } catch {}
    prevPath.current = pathname;

    // Lenis menyimpan tinggi halaman dan baru memperbaruinya 250 ms setelah berubah, sementara
    // scrollTo memotong target ke tinggi lama itu. Setelah pindah dari halaman pendek (artikel) ke
    // halaman panjang (beranda), target jadi terpotong ke dekat hero. Jadi: ukur ulang dulu.
    const canReach = (y: number) => {
      lenis.resize();
      return lenis.limit >= y - 1;
    };
    const to = (target: number | HTMLElement) => {
      lenis.resize();
      lenis.scrollTo(target, { immediate: true, force: true, offset: target instanceof HTMLElement ? -24 : 0 });
      frozen.current = false;
    };

    const unfreeze = () => {
      frozen.current = false;
    };
    let cancel = () => {};
    if (firstRun.current) {
      firstRun.current = false;
      // Muat pertama: pulihkan posisi hanya kalau reload, biarkan hash ditangani browser
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      if (nav?.type === "reload" && !window.location.hash) {
        const saved = readPositions()[pathname];
        if (saved) cancel = scrollWhenReady(() => saved, canReach, to, unfreeze);
      }
      unfreeze();
    } else {
      // Tunda satu frame: saat tombol back ditekan, Next.js merender halaman di dalam listener
      // popstate-nya sendiri (terdaftar lebih dulu), jadi effect ini jalan SEBELUM listener popstate
      // kita sempat menandai isPop. Setelah satu frame, tandanya pasti sudah terpasang.
      const frame = requestAnimationFrame(() => {
        if (isPop.current) {
          // Back/forward: kembali ke posisi terakhir di halaman ini
          isPop.current = false;
          const saved = readPositions()[pathname] ?? 0;
          cancel = scrollWhenReady(() => saved, canReach, to, unfreeze);
        } else if (window.location.hash.length > 1) {
          const id = decodeURIComponent(window.location.hash.slice(1));
          cancel = scrollWhenReady(() => document.getElementById(id), canReach, to, unfreeze);
        } else {
          to(0);
        }
      });
      cancel = () => cancelAnimationFrame(frame);
    }
    return () => {
      cancel();
      unfreeze();
    };
  }, [pathname, lenis]);

  return null;
}

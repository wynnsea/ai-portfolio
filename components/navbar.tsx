"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useLenis } from "lenis/react";
import { site } from "@/lib/site";
import { useIntro } from "@/components/providers/intro-provider";

const ease = [0.16, 1, 0.3, 1] as const;

export function Navbar() {
  const { done } = useIntro();
  const [open, setOpen] = useState(false);
  const lenis = useLenis();
  const isHome = usePathname() === "/";

  // Di halaman utama: smooth scroll ke section. Di halaman lain: navigasi biasa ke "/#section".
  const go = (hash: string) => (e: React.MouseEvent) => {
    const wasOpen = open;
    setOpen(false);
    if (!isHome) return;
    e.preventDefault();
    const scroll = () => lenis?.scrollTo(hash === "#home" ? 0 : hash, { offset: -24, duration: 1.4, force: true });
    // Kalau dipanggil dari menu mobile, tunggu kunci scroll dilepas dulu
    if (wasOpen) setTimeout(scroll, 60);
    else scroll();
  };

  // Menu mobile: kunci scroll halaman, tutup dengan Esc, dan tutup otomatis saat layar melebar ke desktop
  useEffect(() => {
    if (!open) return;
    lenis?.stop();
    document.documentElement.style.overflow = "hidden";
    document.documentElement.dataset.menu = "open"; // dipakai CSS untuk menyembunyikan tombol SEA AI
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onResize = () => desktop.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onResize);
    return () => {
      lenis?.start();
      document.documentElement.style.overflow = "";
      delete document.documentElement.dataset.menu;
      window.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onResize);
    };
  }, [open, lenis]);

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={done ? { y: 0, opacity: 1 } : undefined}
      transition={{ duration: 0.8, ease, delay: 0.5 }}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${open ? "bg-white" : "bg-white/80 backdrop-blur-md"}`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 md:py-5 lg:pl-24">
        <div className="flex min-w-0 items-center gap-8 xl:gap-10">
          <Link
            href="/"
            onClick={go("#home")}
            aria-label={`${site.brand}, ke beranda`}
            className="shrink-0 text-base font-semibold tracking-[0.18em] md:text-lg"
          >
            {site.brand}
          </Link>
          {/* Menu lengkap hanya di layar lebar (≥1024px) agar 5 item muat tanpa terpotong */}
          <ul className="hidden items-center gap-6 text-sm text-primary lg:flex xl:gap-8">
            {site.nav.map((item) => (
              <li key={item.href}>
                <Link href={`/${item.href}`} onClick={go(item.href)} className="group relative whitespace-nowrap py-1">
                  {item.label}
                  <span className="absolute inset-x-0 -bottom-0.5 h-px origin-right scale-x-0 bg-primary transition-transform duration-500 ease-expo group-hover:origin-left group-hover:scale-x-100" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex shrink-0 items-center gap-2 md:gap-5">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              window.dispatchEvent(new Event("search:open"));
            }}
            aria-label="Cari (Ctrl+K)"
            className="flex size-10 items-center justify-center gap-2 rounded-full border border-line text-xs text-secondary transition-colors hover:border-primary hover:text-primary md:size-auto md:px-3 md:py-1.5"
          >
            <span aria-hidden className="text-sm leading-none">⌕</span>
            <span className="hidden md:inline">Search</span>
            <kbd className="hidden rounded bg-tertiary px-1.5 py-0.5 text-[10px] xl:inline">⌘K</kbd>
          </button>
          <Link
            href="/#contact"
            onClick={go("#contact")}
            className="hidden items-center gap-1.5 whitespace-nowrap border-b border-primary pb-0.5 text-sm font-medium md:inline-flex"
          >
            Let&apos;s Talk <span aria-hidden>↗</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            className="relative flex size-10 flex-col items-center justify-center gap-1.5 lg:hidden"
          >
            <span className={`h-px w-6 bg-primary transition-transform duration-300 ${open ? "translate-y-[3.5px] rotate-45" : ""}`} />
            <span className={`h-px w-6 bg-primary transition-transform duration-300 ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`} />
          </button>
        </div>
      </nav>

      {/* Menu mobile & tablet: menutup seluruh layar di bawah header */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            data-lenis-prevent
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease }}
            className="flex h-[calc(100svh-72px)] flex-col overflow-y-auto border-t border-line bg-white px-6 pb-8 md:h-[calc(100svh-80px)] lg:hidden"
          >
            <ul className="flex-1">
              {[...site.nav, { label: "Contact", href: "#contact" }].map((item, i) => (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease, delay: 0.05 + i * 0.04 }}
                  className="border-b border-line"
                >
                  <Link
                    href={`/${item.href}`}
                    onClick={go(item.href)}
                    className="flex items-center justify-between py-4 text-2xl font-light tracking-tight md:py-5 md:text-3xl"
                  >
                    {item.label}
                    <span aria-hidden className="text-base text-secondary">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </Link>
                </motion.li>
              ))}
            </ul>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <a href={`mailto:${site.email}`} className="text-sm text-secondary underline-offset-4 hover:underline">
                {site.email}
              </a>
              <Link
                href="/#contact"
                onClick={go("#contact")}
                className="w-fit rounded-full bg-primary px-5 py-2.5 text-sm text-white md:hidden"
              >
                Let&apos;s Talk ↗
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

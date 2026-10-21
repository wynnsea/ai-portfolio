"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useLenis } from "lenis/react";
import { site } from "@/lib/site";
import { useIntro } from "@/components/providers/intro-provider";

export function Navbar() {
  const { done } = useIntro();
  const [open, setOpen] = useState(false);
  const lenis = useLenis();
  const isHome = usePathname() === "/";

  // Di halaman utama: smooth scroll ke section. Di halaman lain: navigasi biasa ke "/#section".
  const go = (hash: string) => (e: React.MouseEvent) => {
    setOpen(false);
    if (!isHome) return;
    e.preventDefault();
    lenis?.scrollTo(hash === "#home" ? 0 : hash, { offset: -24, duration: 1.4 });
  };

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={done ? { y: 0, opacity: 1 } : undefined}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
      className="fixed inset-x-0 top-0 z-50 bg-white/80 backdrop-blur-md"
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:pl-24">
        <div className="flex items-center gap-10">
          <Link href="/" onClick={go("#home")} aria-label={`${site.brand}, ke beranda`} className="text-lg font-semibold tracking-[0.18em]">
            {site.brand}
          </Link>
          <ul className="hidden items-center gap-8 text-sm text-primary md:flex">
            {site.nav.map((item) => (
              <li key={item.href}>
                <Link href={`/${item.href}`} onClick={go(item.href)} className="group relative py-1">
                  {item.label}
                  <span className="absolute inset-x-0 -bottom-0.5 h-px origin-right scale-x-0 bg-primary transition-transform duration-500 ease-expo group-hover:origin-left group-hover:scale-x-100" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("search:open"))}
            aria-label="Cari (Ctrl+K)"
            className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs text-secondary transition-colors hover:border-primary hover:text-primary"
          >
            <span aria-hidden>⌕</span>
            <span className="hidden md:inline">Search</span>
            <kbd className="hidden rounded bg-tertiary px-1.5 py-0.5 text-[10px] md:inline">⌘K</kbd>
          </button>
          <Link
            href="/#contact"
            onClick={go("#contact")}
            className="hidden items-center gap-1.5 border-b border-primary pb-0.5 text-sm font-medium md:inline-flex"
          >
            Let&apos;s Talk <span aria-hidden>↗</span>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Tutup menu" : "Buka menu"}
          className="relative z-10 flex size-10 flex-col items-center justify-center gap-1.5 md:hidden"
        >
          <span className={`h-px w-6 bg-primary transition-transform duration-300 ${open ? "translate-y-[3.5px] rotate-45" : ""}`} />
          <span className={`h-px w-6 bg-primary transition-transform duration-300 ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`} />
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-line bg-white px-6 md:hidden"
          >
            {[...site.nav, { label: "Contact", href: "#contact" }].map((item) => (
              <li key={item.href} className="border-b border-line last:border-0">
                <Link href={`/${item.href}`} onClick={go(item.href)} className="block py-4 text-2xl font-light tracking-tight">
                  {item.label}
                </Link>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

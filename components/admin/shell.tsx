"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Bell, ExternalLink, Mail, Menu, Search, X } from "lucide-react";
import { adminNav } from "@/lib/admin/nav";
import { site } from "@/lib/site";
import { seed } from "@/lib/admin/data";
import { useToast } from "@/components/admin/ui";

const ease = [0.16, 1, 0.3, 1] as const;

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

/* ---------- Sidebar ---------- */
function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="ad-glass flex h-full flex-col rounded-3xl p-5">
      <Link href="/admin" onClick={onNavigate} className="flex items-center gap-3 px-2">
        <Image src="/brand/logo.png" alt="" width={40} height={40} className="size-10 object-contain" />
        <span>
          <span className="block text-base font-semibold tracking-[0.12em] text-ad-ink">{site.brand}</span>
          <span className="block text-[11px] text-ad-muted">Panel Admin</span>
        </span>
      </Link>

      <nav className="mt-8 flex-1 space-y-7 overflow-y-auto">
        {adminNav.map((group) => (
          <div key={group.title}>
            <p className="px-3 text-[11px] font-medium uppercase tracking-[0.15em] text-ad-muted/80">{group.title}</p>
            <ul className="mt-2 space-y-1">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href} className="relative">
                    {active && <motion.span layoutId="ad-nav-indicator" className="absolute -left-5 top-1.5 h-7 w-1 rounded-r-full bg-ad" />}
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors ${
                        active ? "bg-white font-semibold text-ad-deep shadow-[0_6px_16px_-10px_rgba(47,98,214,0.5)]" : "text-ad-muted hover:bg-white/60 hover:text-ad-ink"
                      }`}
                    >
                      <Icon className="size-[18px]" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && <span className="rounded-full bg-ad px-2 py-0.5 text-[10px] font-semibold text-white">{item.badge}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Kartu "Lihat Website" (mengikuti kartu Download App di referensi) */}
      <div className="relative mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-ad to-ad-deep p-5 text-white">
        <div aria-hidden className="absolute -right-10 -top-10 size-36 rounded-full border-[18px] border-white/10" />
        <div aria-hidden className="absolute -bottom-14 -left-6 size-32 rounded-full border-[14px] border-white/10" />
        <p className="relative text-sm font-semibold leading-snug">Lihat website portfolio</p>
        <p className="relative mt-1 text-xs text-white/70">Cek hasil perubahan konten secara langsung.</p>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="relative mt-4 flex h-9 items-center justify-center gap-1.5 rounded-full bg-white/95 text-xs font-semibold text-ad-deep transition hover:bg-white"
        >
          Buka Website <ExternalLink className="size-3.5" />
        </a>
      </div>
    </div>
  );
}

/* ---------- Topbar ---------- */
function Topbar({ onMenu }: { onMenu: () => void }) {
  const toast = useToast();
  const [notifOpen, setNotifOpen] = useState(false);
  const newMessages = seed.pesan.filter((m) => m.status === "Baru");

  return (
    // relative z-30: backdrop-filter membuat stacking context sendiri, jadi header perlu z-index
    // supaya dropdown notifikasi tidak tertimpa <main> (yang juga kaca) di bawahnya
    <header className="ad-glass relative z-30 flex items-center gap-3 rounded-3xl px-4 py-3 md:px-5">
      <button type="button" onClick={onMenu} aria-label="Buka menu" className="grid size-10 place-items-center rounded-full text-ad-ink hover:bg-white lg:hidden">
        <Menu className="size-5" />
      </button>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          toast("Pencarian akan aktif setelah tersambung ke API Laravel.");
        }}
        className="ad-glass-soft hidden h-11 flex-1 items-center gap-2.5 rounded-full px-4 sm:flex md:max-w-sm"
      >
        <Search className="size-4 text-ad-muted" />
        <input placeholder="Cari konten..." aria-label="Cari konten" className="flex-1 bg-transparent text-sm text-ad-ink outline-none placeholder:text-ad-muted/70" />
        <kbd className="rounded-md bg-ad-soft px-1.5 py-0.5 text-[10px] font-medium text-ad-deep">⌘ F</kbd>
      </form>

      <div className="ml-auto flex items-center gap-2">
        <Link href="/admin/pesan" aria-label="Pesan" className="ad-glass-soft grid size-10 place-items-center rounded-full text-ad-ink transition hover:bg-white">
          <Mail className="size-[18px]" />
        </Link>
        <div className="relative z-">
          <button
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            aria-label="Notifikasi"
            aria-expanded={notifOpen}
            className="ad-glass-soft z-50 relative grid size-10 place-items-center rounded-full text-ad-ink transition hover:bg-white"
          >
            <Bell className="size-[18px]" />
            {newMessages.length > 0 && <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-rose-500 ring-2 ring-white" />}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.2, ease }}
                className="ad-glass absolute right-0 top-12 z-40 w-72 rounded-2xl p-2"
              >
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-ad-muted">Notifikasi</p>
                {newMessages.length === 0 ? (
                  <p className="px-3 pb-3 text-sm text-ad-muted">Belum ada notifikasi baru.</p>
                ) : (
                  newMessages.map((m) => (
                    <Link key={m.id} href="/admin/pesan" onClick={() => setNotifOpen(false)} className="block rounded-xl px-3 py-2.5 hover:bg-white/70">
                      <p className="text-sm font-medium text-ad-ink">Pesan baru dari {m.name}</p>
                      <p className="truncate text-xs text-ad-muted">{m.subject}</p>
                    </Link>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="ml-1 flex items-center gap-3 pl-1">
          <Image src={site.photo} alt={site.name} width={40} height={40} className="size-10 rounded-full object-cover object-top ring-2 ring-white" />
          <div className="hidden leading-tight md:block">
            <p className="text-sm font-semibold text-ad-ink">{site.name}</p>
            <p className="text-xs text-ad-muted">{site.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ---------- Kerangka panel admin ---------- */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const [drawer, setDrawer] = useState(false);
  const pathname = usePathname();

  // Tutup drawer dengan Esc
  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer]);

  return (
    <div className="mx-auto flex min-h-svh max-w-[1500px] gap-5 p-3 md:p-5">
      {/* Sidebar desktop */}
      <aside className="sticky top-5 hidden h-[calc(100svh-2.5rem)] w-64 shrink-0 lg:block">
        <Sidebar />
      </aside>

      {/* Sidebar mobile (drawer) */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawer(false)}
              className="fixed inset-0 z-40 bg-ad-ink/25 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-110%" }}
              animate={{ x: 0 }}
              exit={{ x: "-110%" }}
              transition={{ duration: 0.4, ease }}
              className="fixed inset-y-3 left-3 z-50 w-72 lg:hidden"
            >
              <Sidebar onNavigate={() => setDrawer(false)} />
              <button type="button" onClick={() => setDrawer(false)} aria-label="Tutup menu" className="absolute right-4 top-5 grid size-9 place-items-center rounded-full text-ad-muted hover:bg-white">
                <X className="size-4" />
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <Topbar onMenu={() => setDrawer(true)} />
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease }}
          className="ad-glass flex-1 rounded-3xl p-5 md:p-7"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}

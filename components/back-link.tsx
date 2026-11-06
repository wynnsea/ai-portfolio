"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PREV_PATH_KEY } from "@/components/providers/scroll-manager";

/**
 * Tombol "← Semua artikel/proyek" di halaman detail.
 * Kalau pengunjung datang dari beranda, bertindak seperti tombol back browser supaya kembali
 * ke posisi scroll yang sama persis. Kalau dibuka langsung (mis. dari Google), ke `/#section`.
 */
export function BackLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  const router = useRouter();

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    let prev: string | null = null;
    try {
      prev = sessionStorage.getItem(PREV_PATH_KEY);
    } catch {}
    if (prev === "/" && window.history.length > 1) {
      e.preventDefault();
      router.back();
    }
  };

  return (
    <Link href={href} onClick={onClick} className={className}>
      {children}
    </Link>
  );
}

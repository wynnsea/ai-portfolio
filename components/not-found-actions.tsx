"use client";

import Link from "next/link";

/** Tombol di halaman 404: kembali ke beranda, cari, atau tanya SEA AI. */
export function NotFoundActions() {
  return (
    <div className="mt-12 flex flex-wrap items-center gap-3">
      <Link href="/" className="rounded-full bg-primary px-6 py-3 text-sm text-white transition-opacity hover:opacity-85">
        Balik ke beranda
      </Link>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event("search:open"))}
        className="rounded-full border border-primary px-6 py-3 text-sm transition-colors hover:bg-primary hover:text-white"
      >
        Cari halaman
      </button>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event("sea:open"))}
        className="inline-flex items-center gap-2 px-3 py-3 text-sm text-secondary transition-colors hover:text-primary"
      >
        <span className="font-jp">海</span> Tanya SEA AI
      </button>
    </div>
  );
}

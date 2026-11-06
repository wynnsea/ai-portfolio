"use client";

import { useEffect } from "react";

const STORAGE_KEY = "wynnsea-visit";

/**
 * Mencatat kunjungan ke tabel page_views untuk grafik "Pengunjung Website" di dashboard admin.
 * Satu kali per sesi browser per hari, jadi angkanya mendekati jumlah pengunjung, bukan jumlah klik.
 */
export function VisitTracker() {
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    try {
      if (window.sessionStorage.getItem(STORAGE_KEY) === today) return;
      window.sessionStorage.setItem(STORAGE_KEY, today);
    } catch {
      // sessionStorage diblokir (mis. mode privat tertentu): tetap dicatat
    }

    // Dicatat lewat server supaya bisa di-rate-limit (lihat app/api/visit/route.ts)
    fetch("/api/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
      keepalive: true,
    }).catch(() => {
      // Gagal mencatat kunjungan tidak perlu mengganggu pengunjung
    });
  }, []);

  return null;
}

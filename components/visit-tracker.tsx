"use client";

import { useEffect } from "react";
import { getPublicClient, isSupabaseConfigured } from "@/lib/supabase/client";

const STORAGE_KEY = "wynnsea-visit";

/**
 * Mencatat kunjungan ke tabel page_views untuk grafik "Pengunjung Website" di dashboard admin.
 * Satu kali per sesi browser per hari, jadi angkanya mendekati jumlah pengunjung, bukan jumlah klik.
 */
export function VisitTracker() {
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const today = new Date().toISOString().slice(0, 10);
    try {
      if (window.sessionStorage.getItem(STORAGE_KEY) === today) return;
      window.sessionStorage.setItem(STORAGE_KEY, today);
    } catch {
      // sessionStorage diblokir (mis. mode privat tertentu): tetap dicatat
    }

    // Query Supabase baru dikirim saat di-then/await, jadi .then() di sini wajib
    getPublicClient()
      .from("page_views")
      .insert({ path: window.location.pathname.slice(0, 200) })
      .then(({ error }) => {
        if (error) console.warn("Gagal mencatat kunjungan:", error.message);
      });
  }, []);

  return null;
}

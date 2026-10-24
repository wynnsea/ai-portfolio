import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Ditulis lengkap (bukan process.env[nama]) supaya Next bisa menyisipkannya ke bundle browser.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

/** Host project Supabase untuk ditampilkan di panel admin, mis. "abcd.supabase.co". */
export const supabaseHost = SUPABASE_URL.replace(/^https?:\/\//, "").replace(/\/+$/, "");

function assertConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY belum diisi di .env.local.");
  }
}

let publicClient: SupabaseClient | null = null;

/**
 * Klien untuk data publik website: tanpa sesi login, jadi aman dipakai di server maupun browser.
 * Yang boleh dibaca dibatasi oleh Row Level Security di database, bukan oleh kode ini.
 */
export function getPublicClient(): SupabaseClient {
  assertConfigured();
  publicClient ??= createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return publicClient;
}

// "Ingat saya" di form login: sesi disimpan di localStorage (bertahan) atau sessionStorage (hilang saat tab ditutup)
const REMEMBER_KEY = "wynnsea-admin-remember";

const rememberStorage = {
  getItem: (key: string) => window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key),
  setItem: (key: string, value: string) => {
    const remember = window.localStorage.getItem(REMEMBER_KEY) !== "0";
    (remember ? window.localStorage : window.sessionStorage).setItem(key, value);
  },
  removeItem: (key: string) => {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  },
};

export function setRememberSession(remember: boolean) {
  window.localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
}

let adminClient: SupabaseClient | null = null;

/** Klien untuk panel admin (browser saja): membawa sesi login Supabase Auth. */
export function getAdminClient(): SupabaseClient {
  if (typeof window === "undefined") throw new Error("Klien admin hanya bisa dipakai di browser.");
  assertConfigured();
  adminClient ??= createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { storage: rememberStorage, storageKey: "wynnsea-admin-auth" },
  });
  return adminClient;
}

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Klien service role: melewati RLS, jadi HANYA boleh dipakai di kode server (route handler).
// Kuncinya dibaca dari SUPABASE_SERVICE_ROLE_KEY (tanpa NEXT_PUBLIC_) agar tidak masuk bundle browser.
let serviceClient: SupabaseClient | null | undefined;

export function getServiceClient(): SupabaseClient | null {
  if (typeof window !== "undefined") throw new Error("Klien service role hanya boleh dipakai di server.");
  if (serviceClient !== undefined) return serviceClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  // Abaikan nilai placeholder dari .env.example
  const usable = url && key && !key.startsWith("isi_");

  serviceClient = usable
    ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
    : null;
  return serviceClient;
}

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Verifikasi admin untuk API route (server).
 * Browser panel admin mengirim access token Supabase lewat header `Authorization: Bearer <token>`.
 * Token dicek ke Supabase Auth, lalu dicocokkan ke tabel admins lewat fungsi is_admin().
 *
 * Klien yang dikembalikan membawa token user tersebut, jadi semua query tetap tunduk pada RLS
 * (admin boleh mengelola konten) tanpa perlu service role key.
 */
export async function requireAdmin(
  request: Request,
): Promise<{ client: SupabaseClient; userId: string } | { error: Response }> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) return { error: Response.json({ error: "Belum login." }, { status: 401 }) };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !key) return { error: Response.json({ error: "Supabase belum dikonfigurasi." }, { status: 500 }) };

  const client = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data: userData, error: userError } = await client.auth.getUser(token);
  if (userError || !userData.user) {
    return { error: Response.json({ error: "Sesi berakhir, silakan login lagi." }, { status: 401 }) };
  }

  const { data: isAdmin, error: adminError } = await client.rpc("is_admin");
  if (adminError || isAdmin !== true) {
    return { error: Response.json({ error: "Akun ini tidak punya akses admin." }, { status: 403 }) };
  }

  return { client, userId: userData.user.id };
}

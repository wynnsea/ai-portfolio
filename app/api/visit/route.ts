import { checkRateLimits, getClientIp, type RateLimitRule } from "@/lib/rate-limit";
import { getServiceClient } from "@/lib/supabase/server";

// Pencatatan kunjungan lewat server (bukan insert langsung dari browser) supaya bisa dibatasi per IP.
const PER_IP: RateLimitRule = { name: "visit-ip", limit: 20, windowSeconds: 60 * 60 };
const GLOBAL: RateLimitRule = { name: "visit-global", limit: 5000, windowSeconds: 60 * 60 };

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const rawPath = typeof body?.path === "string" ? body.path : "";
  // Hanya path internal, tanpa query string
  const path = rawPath.startsWith("/") ? rawPath.split(/[?#]/)[0].slice(0, 200) : "";
  if (!path) return new Response(null, { status: 400 });

  const rate = await checkRateLimits([
    [getClientIp(request), PER_IP],
    ["all", GLOBAL],
  ]);
  // Kunjungan yang melebihi batas cukup diabaikan, tidak perlu memberi tahu klien
  if (!rate.allowed) return new Response(null, { status: 204 });

  const client = getServiceClient();
  if (!client) {
    console.warn("[visit] SUPABASE_SERVICE_ROLE_KEY belum diatur, kunjungan tidak dicatat.");
    return new Response(null, { status: 204 });
  }

  const { error } = await client.from("page_views").insert({ path });
  if (error) console.error("[visit] Gagal mencatat kunjungan:", error.message);
  return new Response(null, { status: 204 });
}

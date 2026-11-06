import { getServiceClient } from "@/lib/supabase/server";

export type RateLimitRule = {
  /** Nama bucket, mis. "sea" atau "contact-email". */
  name: string;
  limit: number;
  windowSeconds: number;
};

export type RateLimitResult = { allowed: boolean; retryAfter: number };

/**
 * Ambil IP pengunjung dari header proxy.
 * Di Vercel, `x-real-ip` dan `x-forwarded-for` diisi ulang oleh platform sehingga tidak bisa dipalsukan.
 * Kalau self-host, pastikan reverse proxy (nginx, dll.) menimpa header ini, bukan meneruskan nilai dari klien.
 */
export function getClientIp(request: Request): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "unknown";
}

// Cadangan kalau service role belum diatur: hanya berlaku per instance server.
const memory = new Map<string, { count: number; start: number }>();
let warnedFallback = false;

function hitMemory(key: string, rule: RateLimitRule): RateLimitResult {
  const now = Date.now();
  const windowMs = rule.windowSeconds * 1000;
  const entry = memory.get(key);
  const current = entry && now - entry.start < windowMs ? entry : { count: 0, start: now };
  current.count += 1;
  memory.set(key, current);

  if (memory.size > 5000) {
    for (const [k, v] of memory) if (now - v.start >= windowMs) memory.delete(k);
  }

  return {
    allowed: current.count <= rule.limit,
    retryAfter: Math.max(0, Math.ceil((current.start + windowMs - now) / 1000)),
  };
}

async function hit(identifier: string, rule: RateLimitRule): Promise<RateLimitResult> {
  const key = `${rule.name}:${identifier.toLowerCase()}`;
  const client = getServiceClient();

  if (client) {
    const { data, error } = await client.rpc("hit_rate_limit", {
      p_key: key,
      p_limit: rule.limit,
      p_window_seconds: rule.windowSeconds,
    });
    const row = Array.isArray(data) ? data[0] : data;
    if (!error && row) return { allowed: Boolean(row.allowed), retryAfter: Number(row.retry_after) || 0 };
    console.error("[rate-limit] RPC hit_rate_limit gagal, pakai limiter in-memory:", error?.message);
  } else if (!warnedFallback) {
    warnedFallback = true;
    console.warn("[rate-limit] SUPABASE_SERVICE_ROLE_KEY belum diatur, rate limit hanya in-memory per instance.");
  }

  return hitMemory(key, rule);
}

/** Cek beberapa aturan sekaligus; ditolak jika salah satu terlampaui. */
export async function checkRateLimits(checks: [identifier: string, rule: RateLimitRule][]): Promise<RateLimitResult> {
  const results = await Promise.all(checks.map(([id, rule]) => hit(id, rule)));
  const blocked = results.filter((r) => !r.allowed);
  if (!blocked.length) return { allowed: true, retryAfter: 0 };
  return { allowed: false, retryAfter: Math.max(...blocked.map((r) => r.retryAfter)) };
}

/** Batas biaya global untuk semua fitur AI, sebagai rem kalau ada yang memutar banyak IP. */
export const AI_GLOBAL_RULE: RateLimitRule = { name: "ai-global", limit: 500, windowSeconds: 60 * 60 };

/** Rate limit standar untuk route AI: per IP + global. Mengembalikan Response 429 atau null. */
export async function limitAiRequest(request: Request, rule: RateLimitRule): Promise<Response | null> {
  const result = await checkRateLimits([
    [getClientIp(request), rule],
    ["all", AI_GLOBAL_RULE],
  ]);
  if (result.allowed) return null;
  return tooManyRequests(result.retryAfter, "SEA AI lagi kebanyakan permintaan. Coba lagi sebentar ya.");
}

export function tooManyRequests(retryAfter: number, message: string, extra: Record<string, unknown> = {}): Response {
  return Response.json(
    { error: message, ...extra },
    { status: 429, headers: { "Retry-After": String(Math.max(1, retryAfter)) } },
  );
}

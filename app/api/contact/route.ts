import { after, NextResponse } from "next/server";
import { notifyNewMessage, verifyTurnstile } from "@/lib/contact-guard";
import { getPublicClient } from "@/lib/supabase/client";
import { getServiceClient } from "@/lib/supabase/server";
import { checkRateLimits, getClientIp, type RateLimitRule } from "@/lib/rate-limit";

const MAX_SUBMISSIONS_PER_DAY = 2;
const DAY = 24 * 60 * 60;

const PER_IP: RateLimitRule = { name: "contact-ip", limit: MAX_SUBMISSIONS_PER_DAY, windowSeconds: DAY };
const PER_EMAIL: RateLimitRule = { name: "contact-email", limit: MAX_SUBMISSIONS_PER_DAY, windowSeconds: DAY };

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const subject = typeof body?.subject === "string" ? body.subject.trim().slice(0, 200) : "";
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const turnstileToken = typeof body?.turnstileToken === "string" ? body.turnstileToken : "";

    // Honeypot: field tersembunyi yang hanya diisi bot. Pura-pura berhasil supaya bot tidak mencoba cara lain.
    if (typeof body?.website === "string" && body.website.trim()) {
      return NextResponse.json({ ok: true, message: "Pesan berhasil dikirim!" });
    }

    if (!name || name.length > 120) {
      return NextResponse.json({ ok: false, message: "Nama wajib diisi (maksimal 120 karakter)." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email) || email.length > 200) {
      return NextResponse.json({ ok: false, message: "Format email tidak valid." }, { status: 400 });
    }

    if (!message || message.length < 2 || message.length > 5000) {
      return NextResponse.json({ ok: false, message: "Pesan wajib diisi (2-5000 karakter)." }, { status: 400 });
    }

    const ip = getClientIp(req);

    // Verifikasi bot dulu, supaya bot tidak bisa menghabiskan kuota email milik orang lain
    if (!(await verifyTurnstile(turnstileToken, ip))) {
      return NextResponse.json(
        { ok: false, message: "Verifikasi keamanan gagal atau kedaluwarsa. Centang ulang verifikasinya lalu kirim lagi." },
        { status: 403 },
      );
    }

    // Maksimal 2x per 24 jam, dihitung per IP dan per email
    const rate = await checkRateLimits([
      [ip, PER_IP],
      [email, PER_EMAIL],
    ]);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Batas pengiriman pesan tercapai (maksimal 2x sehari per pengunjung). Silakan hubungi langsung lewat email atau coba lagi besok.",
        },
        { status: 429, headers: { "Retry-After": String(Math.max(1, rate.retryAfter)) } },
      );
    }

    const record = {
      name,
      email,
      subject: subject || "Pesan dari Form Kontak Website",
      message,
      status: "Baru",
    };

    // Service role kalau ada; kalau tidak, klien publik (policy "publik mengirim pesan").
    // Jangan pakai .select() setelah insert: anon tidak punya izin SELECT di tabel messages,
    // sehingga insert + select akan ditolak RLS.
    const client = getServiceClient() ?? getPublicClient();
    const { error } = await client.from("messages").insert(record);

    if (error) {
      console.error("[contact] Gagal menyimpan pesan ke Supabase:", error.message);
      return NextResponse.json(
        {
          ok: false,
          message: "Pesan gagal terkirim karena kendala server. Coba lagi nanti atau kirim langsung lewat email ya.",
        },
        { status: 502 },
      );
    }

    // Email pemberitahuan dikirim setelah respons, jadi pengunjung tidak ikut menunggu
    after(() => notifyNewMessage(record));

    return NextResponse.json({
      ok: true,
      message: "Pesan berhasil dikirim! Bos Wayan akan segera membalas lewat email.",
    });
  } catch (err: unknown) {
    console.error("[contact] Error tak terduga:", err);
    return NextResponse.json({ ok: false, message: "Terjadi kesalahan internal pada server." }, { status: 500 });
  }
}

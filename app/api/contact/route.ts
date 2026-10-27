import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { getPublicClient } from "@/lib/supabase/client";

const MAX_SUBMISSIONS_PER_DAY = 2;

// In-memory cache for fast rate limit checking
const memoryRateLimits = new Map<string, { date: string; count: number }>();

function getWibDate(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

async function checkAndIncrementRateLimit(ip: string, email: string): Promise<{ allowed: boolean; remaining: number }> {
  const today = getWibDate();
  const keys = [
    `ip:${ip.trim().toLowerCase()}`,
    `email:${email.trim().toLowerCase()}`,
  ];

  // Load persisted rate limits if file exists
  const dir = path.join(process.cwd(), "private");
  const file = path.join(dir, "contact-rate-limits.json");
  let persisted: Record<string, { date: string; count: number }> = {};
  try {
    const raw = await fs.readFile(file, "utf8");
    persisted = JSON.parse(raw);
  } catch {
    persisted = {};
  }

  // Check limits
  for (const key of keys) {
    const memEntry = memoryRateLimits.get(key);
    const fileEntry = persisted[key];
    const currentEntry = (memEntry && memEntry.date === today) ? memEntry : ((fileEntry && fileEntry.date === today) ? fileEntry : null);
    const currentCount = currentEntry ? currentEntry.count : 0;

    if (currentCount >= MAX_SUBMISSIONS_PER_DAY) {
      return { allowed: false, remaining: 0 };
    }
  }

  // Increment limits
  let minRemaining = MAX_SUBMISSIONS_PER_DAY;
  for (const key of keys) {
    const memEntry = memoryRateLimits.get(key);
    const fileEntry = persisted[key];
    const currentEntry = (memEntry && memEntry.date === today) ? memEntry : ((fileEntry && fileEntry.date === today) ? fileEntry : null);
    const newCount = (currentEntry ? currentEntry.count : 0) + 1;

    const updated = { date: today, count: newCount };
    memoryRateLimits.set(key, updated);
    persisted[key] = updated;

    minRemaining = Math.min(minRemaining, Math.max(0, MAX_SUBMISSIONS_PER_DAY - newCount));
  }

  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(file, JSON.stringify(persisted, null, 2), "utf8");
  } catch (err) {
    console.error("Gagal menyimpan rate limit contact:", err);
  }

  return { allowed: true, remaining: minRemaining };
}

async function saveFallbackMessage(record: {
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
}) {
  try {
    const dir = path.join(process.cwd(), "private");
    await fs.mkdir(dir, { recursive: true });
    const file = path.join(dir, "messages-fallback.json");
    let list: unknown[] = [];
    try {
      const raw = await fs.readFile(file, "utf8");
      list = JSON.parse(raw);
    } catch {
      list = [];
    }
    list.unshift(record);
    await fs.writeFile(file, JSON.stringify(list, null, 2), "utf8");
  } catch (err) {
    console.error("Gagal menyimpan fallback message lokal:", err);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

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

    // Ekstrak IP client
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = (forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip")) || "127.0.0.1";

    // Validasi kuota harian (maksimal 2x per hari per pengunjung)
    const rateCheck = await checkAndIncrementRateLimit(ip, email);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          ok: false,
          message: "Batas pengiriman pesan tercapai (maksimal 2x sehari per pengunjung). Silakan hubungi langsung lewat email atau coba lagi besok.",
        },
        { status: 429 }
      );
    }

    const record = {
      name,
      email,
      subject: subject || "Pesan dari Form Kontak Website",
      message,
      status: "Baru",
    };

    // Gunakan service role jika tersedia di environment, atau gunakan client publik
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const client = serviceKey && supabaseUrl
      ? createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
      : getPublicClient();

    const { data, error } = await client.from("messages").insert(record).select("id").single();

    if (error) {
      console.warn("Supabase insert ditolak (RLS):", error.message);
      // Simpan salinan cadangan agar pesan pengunjung tidak hilang
      await saveFallbackMessage({
        ...record,
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({
        ok: true,
        message: "Pesan berhasil dikirim! Bos Wayan akan segera membalas lewat email.",
        remainingToday: rateCheck.remaining,
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Pesan berhasil dikirim! Bos Wayan akan segera membalas lewat email.",
      id: data?.id,
      remainingToday: rateCheck.remaining,
    });
  } catch (err: unknown) {
    console.error("Error pada endpoint contact:", err);
    return NextResponse.json(
      { ok: false, message: err instanceof Error ? err.message : "Terjadi kesalahan internal pada server." },
      { status: 500 }
    );
  }
}

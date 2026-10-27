"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Loader2, Mail, Send } from "lucide-react";

const MAX_DAILY_MESSAGES = 2;
const STORAGE_KEY = "wynnsea_contact_daily_limit_v1";

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dailyCount, setDailyCount] = useState<number>(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const today = getTodayString();
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.date === today && typeof parsed.count === "number") {
          setDailyCount(parsed.count);
        } else {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: 0 }));
          setDailyCount(0);
        }
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: 0 }));
        setDailyCount(0);
      }
    } catch {
      // Abaikan jika localStorage diblokir
    } finally {
      setLoaded(true);
    }
  }, []);

  const updateStoredCount = (newCount: number) => {
    try {
      const today = getTodayString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: newCount }));
      setDailyCount(newCount);
    } catch {
      setDailyCount(newCount);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (dailyCount >= MAX_DAILY_MESSAGES) {
      setError("Kamu sudah mencapai batas maksimal 2 pesan untuk hari ini. Silakan hubungi langsung lewat email.");
      return;
    }

    setBusy(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (res.status === 429) {
          updateStoredCount(MAX_DAILY_MESSAGES);
        }
        throw new Error(data.message || "Gagal mengirim pesan.");
      }

      const nextCount = dailyCount + 1;
      updateStoredCount(nextCount);

      setSuccess(true);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kendala saat mengirim pesan.");
    } finally {
      setBusy(false);
    }
  };

  const isLimitReached = loaded && dailyCount >= MAX_DAILY_MESSAGES;
  const remaining = Math.max(0, MAX_DAILY_MESSAGES - dailyCount);

  if (success) {
    return (
      <div className="rounded-3xl border border-white/20 bg-white/5 p-8 text-center backdrop-blur-md">
        <CheckCircle2 className="mx-auto size-12 text-accent" />
        <h3 className="mt-4 text-xl font-light tracking-tight text-white">Pesan Berhasil Terkirim!</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/70">
          Terima kasih sudah menghubungi. Pesan kamu sudah tersampaikan dan bos saya akan segera membalas lewat email.
        </p>
        <p className="mt-3 text-xs text-white/50">
          {dailyCount >= MAX_DAILY_MESSAGES
            ? "Kamu telah menggunakan batas kuota 2x kirim pesan untuk hari ini."
            : `Sisa kuota pesan kamu hari ini: ${remaining} kali lagi.`}
        </p>
        {dailyCount < MAX_DAILY_MESSAGES && (
          <button
            type="button"
            onClick={() => setSuccess(false)}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2 text-xs font-medium text-white transition hover:bg-white hover:text-primary"
          >
            Kirim pesan lain
          </button>
        )}
      </div>
    );
  }

  if (isLimitReached) {
    return (
      <div className="space-y-4 rounded-3xl border border-white/15 bg-white/[0.04] p-6 backdrop-blur-md md:p-8">
        <div className="flex items-center gap-3 text-accent">
          <Clock className="size-6 shrink-0" />
          <h3 className="text-lg font-light tracking-tight text-white">Batas Pengiriman Harian Tercapai</h3>
        </div>
        <p className="text-sm leading-relaxed text-white/75">
          Kamu sudah mengirim <span className="font-semibold text-white">2 pesan hari ini</span> (batas maksimal 2x sehari per pengunjung).
        </p>
        <p className="text-sm leading-relaxed text-white/60">
          Jika ada hal mendesak atau ingin berdiskusi lebih lanjut, kamu bisa langsung menghubungi bos saya lewat email langsung di bawah ini.
        </p>
        <div className="pt-2">
          <a
            href="mailto:contact@wynnsea.my.id"
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-primary transition hover:bg-white/90"
          >
            <Mail className="size-4" /> Hubungi via Email Langsung
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-white/15 bg-white/[0.04] p-6 backdrop-blur-md md:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="mb-1.5 block text-xs font-medium text-white/70">
            Nama kamu
          </label>
          <input
            id="contact-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="mis. Budi Santoso"
            className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-white/60 focus:bg-white/10"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="mb-1.5 block text-xs font-medium text-white/70">
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@perusahaan.com"
            className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-white/60 focus:bg-white/10"
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className="mb-1.5 block text-xs font-medium text-white/70">
          Subjek (opsional)
        </label>
        <input
          id="contact-subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="mis. Tawaran Kolaborasi AI / Diskusi Proyek"
          className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-white/60 focus:bg-white/10"
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-1.5 block text-xs font-medium text-white/70">
          Pesan
        </label>
        <textarea
          id="contact-message"
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ceritakan ide, pertanyaan, atau proyek yang ingin didiskusikan..."
          className="w-full resize-none rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-white/60 focus:bg-white/10"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-xs text-rose-200">
          {error}
        </div>
      )}

      <div className="flex flex-col items-start justify-between gap-3 pt-2 sm:flex-row sm:items-center">
        <span className="text-xs text-white/50">
          Batas pesan: tersisa <span className="font-semibold text-white/80">{remaining}</span> dari {MAX_DAILY_MESSAGES} kali hari ini
        </span>

        <button
          type="submit"
          disabled={busy || isLimitReached}
          className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-medium text-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Mengirim...
            </>
          ) : (
            <>
              Kirim Pesan <Send className="size-3.5" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { login } from "@/lib/admin/api";
import { site } from "@/lib/site";

const ease = [0.16, 1, 0.3, 1] as const;

export function LoginForm() {
  const searchParams = useSearchParams();
  const loggedOutParam = searchParams.get("logged_out") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loggedOutNotice, setLoggedOutNotice] = useState(loggedOutParam);

  // Selalu pastikan state loading bersih saat komponen dimount
  useEffect(() => {
    setLoading(false);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoggedOutNotice(false);
    setLoading(true);

    try {
      const res = await login(email, password, remember);
      if (!res.ok) {
        setLoading(false);
        setError(res.message ?? "Email atau password salah.");
        return;
      }
      setLoading(false);
      // Hard navigation agar sesi admin termuat bersih dan fresh
      window.location.href = "/admin";
    } catch (err: unknown) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat masuk.");
    }
  };

  const inputWrap =
    "ad-glass-soft flex h-11 sm:h-12 items-center gap-3 rounded-2xl px-3.5 sm:px-4 ring-1 ring-ad-line/80 transition focus-within:border-ad focus-within:ring-4 focus-within:ring-ad/15";

  return (
    <main className="relative flex min-h-svh w-full items-center justify-center overflow-x-hidden px-4 py-8 sm:px-6">
      {/* Background ornamen blur yang responsif dan tidak menyebabkan overflow */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#eef3ff]">
        <div className="absolute left-1/2 top-1/2 size-[20rem] sm:size-[28rem] -translate-x-[85%] -translate-y-[70%] rounded-full bg-gradient-to-br from-ad to-[#7fb2ff] opacity-60 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 size-52 sm:size-72 translate-x-[20%] translate-y-[15%] rounded-full bg-gradient-to-br from-[#8fd3ff] to-ad-deep opacity-60 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease }}
        className="ad-glass w-full max-w-[400px] sm:max-w-md rounded-3xl sm:rounded-[2rem] p-5 sm:p-9 shadow-2xl ring-1 ring-ad-line/80"
      >
        {/* Logo & Brand Header */}
        <div className="flex items-center gap-3">
          <Image
            src="/brand/logo.png"
            alt=""
            width={44}
            height={44}
            priority
            className="size-10 sm:size-11 object-contain"
          />
          <div>
            <p className="text-sm sm:text-base font-semibold tracking-[0.12em] text-ad-ink">{site.brand}</p>
            <p className="text-[11px] sm:text-xs text-ad-muted">Panel Admin</p>
          </div>
        </div>

        <h1 className="mt-6 sm:mt-8 text-xl sm:text-2xl font-semibold tracking-tight text-ad-ink">
          Selamat datang kembali
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-ad-muted">
          Masuk untuk mengelola konten portfolio.
        </p>

        {/* Notifikasi jika baru saja logout */}
        {loggedOutNotice && (
          <div
            role="status"
            className="mt-5 flex items-center gap-2.5 rounded-2xl bg-emerald-50/90 px-4 py-3 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200"
          >
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            <span>Kamu telah berhasil keluar dari panel admin.</span>
          </div>
        )}

        <form onSubmit={submit} className="mt-6 sm:mt-7 space-y-4" noValidate>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ad-ink">Email</span>
            <span className={inputWrap}>
              <Mail className="size-4 shrink-0 text-ad-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                autoComplete="email"
                required
                className="flex-1 bg-transparent text-sm text-ad-ink outline-none placeholder:text-ad-muted/70"
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ad-ink">Password</span>
            <span className={inputWrap}>
              <Lock className="size-4 shrink-0 text-ad-muted" />
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="flex-1 bg-transparent text-sm text-ad-ink outline-none placeholder:text-ad-muted/70"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
                className="grid size-8 shrink-0 place-items-center rounded-xl text-ad-muted transition hover:bg-white/60 hover:text-ad-deep focus:outline-none"
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </span>
          </label>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <label className="flex cursor-pointer items-center gap-2 text-ad-muted select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="size-4 rounded accent-[#4f86f7]"
              />
              Ingat saya
            </label>
            <span className="text-ad-muted/60 text-[11px]">
              Gunakan akun admin Supabase
            </span>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-2xl bg-rose-50/90 px-4 py-3 text-xs text-rose-600 ring-1 ring-rose-200"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-11 sm:h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-ad to-ad-deep text-sm font-semibold text-white shadow-[0_14px_30px_-14px_rgba(47,98,214,0.9)] transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <p className="mt-5 sm:mt-6 rounded-2xl bg-ad-soft/70 px-4 py-3 text-[11px] leading-relaxed text-ad-muted">
          Gunakan email dan password admin yang dikonfigurasi di backend / Supabase.
        </p>

        <Link
          href="/"
          className="mt-4 sm:mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-ad-muted transition hover:text-ad-deep"
        >
          <ArrowLeft className="size-3.5" /> Kembali ke website
        </Link>
      </motion.div>
    </main>
  );
}

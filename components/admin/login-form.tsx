"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { login } from "@/lib/admin/api";
import { site } from "@/lib/site";

const ease = [0.16, 1, 0.3, 1] as const;

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await login(email, password);
    if (!res.ok) {
      setLoading(false);
      setError(res.message ?? "Login gagal");
      return;
    }
    router.push("/admin");
  };

  const inputWrap = "ad-glass-soft flex h-12 items-center gap-3 rounded-2xl px-4 transition focus-within:ring-4 focus-within:ring-ad/15";

  return (
    <main className="grid min-h-svh place-items-center p-4">
      {/* lingkaran dekoratif di belakang kartu kaca */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 size-[26rem] -translate-x-[85%] -translate-y-[70%] rounded-full bg-gradient-to-br from-ad to-[#7fb2ff] opacity-80 blur-sm" />
        <div className="absolute left-1/2 top-1/2 size-64 translate-x-[25%] translate-y-[15%] rounded-full bg-gradient-to-br from-[#8fd3ff] to-ad-deep opacity-70 blur-sm" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease }}
        className="ad-glass w-full max-w-md rounded-[2rem] p-7 sm:p-9"
      >
        <div className="flex items-center gap-3">
          <Image src="/brand/logo.png" alt="" width={44} height={44} className="size-11 object-contain" />
          <div>
            <p className="font-semibold tracking-[0.12em]">{site.brand}</p>
            <p className="text-xs text-ad-muted">Panel Admin</p>
          </div>
        </div>

        <h1 className="mt-8 text-2xl font-semibold tracking-tight">Selamat datang kembali</h1>
        <p className="mt-1 text-sm text-ad-muted">Masuk untuk mengelola konten portfolio.</p>

        <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium">Email</span>
            <span className={inputWrap}>
              <Mail className="size-4 text-ad-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                autoComplete="email"
                required
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-ad-muted/70"
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium">Password</span>
            <span className={inputWrap}>
              <Lock className="size-4 text-ad-muted" />
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-ad-muted/70"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
                className="text-ad-muted transition hover:text-ad-deep"
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </span>
          </label>

          <div className="flex items-center justify-between text-xs">
            <label className="flex cursor-pointer items-center gap-2 text-ad-muted">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="size-4 accent-[#4f86f7]" />
              Ingat saya
            </label>
            <button type="button" className="font-medium text-ad-deep hover:underline">
              Lupa password?
            </button>
          </div>

          {error && (
            <p role="alert" className="rounded-2xl bg-rose-50/80 px-4 py-3 text-xs text-rose-600 ring-1 ring-rose-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-ad to-ad-deep text-sm font-semibold text-white shadow-[0_14px_30px_-14px_rgba(47,98,214,0.9)] transition hover:brightness-110 disabled:opacity-70"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <p className="mt-6 rounded-2xl bg-ad-soft/70 px-4 py-3 text-[11px] leading-relaxed text-ad-muted">
          Demo UI: belum tersambung ke Laravel. Isi email apa saja dan password minimal 6 karakter.
        </p>

        <Link href="/" className="mt-5 inline-flex items-center gap-1.5 text-xs text-ad-muted transition hover:text-ad-deep">
          <ArrowLeft className="size-3.5" /> Kembali ke website
        </Link>
      </motion.div>
    </main>
  );
}

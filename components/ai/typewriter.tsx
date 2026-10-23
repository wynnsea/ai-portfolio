"use client";

import { useEffect, useState } from "react";

/**
 * Menampilkan teks seolah sedang diketik (meniru streaming dari LLM).
 * Pasang `key` berbeda untuk setiap teks baru agar animasinya mulai ulang.
 */
export function Typewriter({ text, speed = 14 }: { text: string; speed?: number }) {
  const [count, setCount] = useState(0);
  const done = count >= text.length;

  useEffect(() => {
    if (done) return;
    // Ketik beberapa karakter sekaligus supaya teks panjang tidak terlalu lama
    const t = setTimeout(() => setCount((c) => Math.min(text.length, c + 2)), speed);
    return () => clearTimeout(t);
  }, [count, done, speed, text.length]);

  return (
    <>
      {text.slice(0, count)}
      {!done && <span aria-hidden className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-current" />}
    </>
  );
}

/** Indikator "sedang berpikir" tiga titik. */
export function ThinkingDots({ label = "SEA AI lagi mikir" }: { label?: string }) {
  return (
    <span role="status" aria-label={label} className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span key={i} className="size-1.5 animate-bounce rounded-full bg-current" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </span>
  );
}

/** Label kecil penanda fitur AI (default: masih versi demo). */
export function DemoBadge({ className = "", label = "Demo AI" }: { className?: string; label?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-current/20 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.2em] opacity-70 ${className}`}>
      <span className="font-jp text-xs normal-case tracking-normal">海</span> {label}
    </span>
  );
}

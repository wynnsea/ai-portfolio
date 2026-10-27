"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { AiBadge, ThinkingDots } from "@/components/ai/typewriter";

/** Ringkasan artikel buatan AI (dari /api/tldr). */
export function TldrBox({ slug }: { slug: string }) {
  const [points, setPoints] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function summarize() {
    setLoading(true);
    try {
      const res = await fetch("/api/tldr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      setPoints(data.points ?? ["Gagal bikin ringkasan, coba lagi ya."]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.25em] text-secondary">TL;DR</p>
        <AiBadge className="text-secondary" />
      </div>

      {!points && (
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <p className="text-sm text-secondary">Buru-buru? Minta SEA AI ringkasin artikel ini.</p>
          <button
            type="button"
            onClick={summarize}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm text-white disabled:opacity-60"
          >
            {loading ? <ThinkingDots label="Lagi ngeringkas" /> : "Ringkasin dong"}
          </button>
        </div>
      )}

      {loading && !points && (
        <div className="mt-6 space-y-3 animate-pulse" aria-busy="true" aria-label="Menyiapkan ringkasan">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="size-2 rounded-full bg-primary/40 shrink-0" />
              <div
                style={{ width: i === 0 ? "90%" : i === 1 ? "80%" : "65%" }}
                className="h-4 rounded-full bg-primary/15"
              />
            </div>
          ))}
        </div>
      )}

      {points && (
        <ul className="mt-4 space-y-3">
          {points.map((p, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.25, duration: 0.5 }}
              className="flex gap-3 text-sm leading-relaxed md:text-base"
            >
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              {p}
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

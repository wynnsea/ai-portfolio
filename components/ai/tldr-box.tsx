"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { DemoBadge, ThinkingDots } from "@/components/ai/typewriter";

/** Ringkasan artikel buatan AI (versi demo, dari /api/tldr). */
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
        <DemoBadge className="text-secondary" />
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

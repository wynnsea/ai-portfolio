"use client";

import { useState } from "react";
import type { ExplainLevel } from "@/lib/ai/types";
import { AiBadge, ThinkingDots, Typewriter } from "@/components/ai/typewriter";

const levels: { id: ExplainLevel; label: string }[] = [
  { id: "recruiter", label: "Buat rekruter" },
  { id: "engineer", label: "Buat engineer" },
  { id: "awam", label: "Jelasin kayak ke bocil" },
];

/** AI menjelaskan ulang project sesuai siapa yang baca (dari /api/explain). */
export function ProjectExplainer({ slug }: { slug: string }) {
  const [active, setActive] = useState<ExplainLevel | null>(null);
  // Penjelasan yang sudah dibuat disimpan per level
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function choose(level: ExplainLevel) {
    setActive(level);
    if (texts[level]) return;
    setLoading(true);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, level }),
      });
      const data = await res.json();
      setTexts((prev) => ({ ...prev, [level]: data.text ?? "Gagal bikin penjelasan, coba lagi ya." }));
    } finally {
      setLoading(false);
    }
  }

  const text = active ? texts[active] : undefined;

  return (
    <div className="rounded-2xl border border-line bg-tertiary p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium">Males baca semua? Biar SEA AI yang jelasin.</p>
        <AiBadge className="text-secondary" />
      </div>
      <div role="tablist" aria-label="Gaya penjelasan" className="mt-5 flex flex-wrap gap-2">
        {levels.map((l) => (
          <button
            key={l.id}
            type="button"
            role="tab"
            aria-selected={active === l.id}
            onClick={() => choose(l.id)}
            disabled={loading}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              active === l.id ? "border-primary bg-primary text-white" : "border-line bg-white hover:border-primary"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
      {active && (
        <div aria-live="polite" className="mt-6 min-h-16 border-t border-line pt-6 text-base leading-relaxed md:text-lg">
          {loading && !text ? (
            <div className="space-y-3 animate-pulse" aria-busy="true" aria-label="Menyiapkan penjelasan">
              <div className="flex items-center gap-2 text-xs text-secondary">
                <ThinkingDots label="Menyiapkan penjelasan" />
                <span>Menyiapkan penjelasan gaya {levels.find((l) => l.id === active)?.label.toLowerCase()}...</span>
              </div>
              <div className="h-4 w-full rounded-full bg-primary/10" />
              <div className="h-4 w-5/6 rounded-full bg-primary/10" />
              <div className="h-4 w-3/4 rounded-full bg-primary/10" />
            </div>
          ) : text ? (
            <Typewriter key={active} text={text} />
          ) : null}
        </div>
      )}
    </div>
  );
}

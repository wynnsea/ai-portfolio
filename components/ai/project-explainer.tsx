"use client";

import { useState } from "react";
import type { ExplainLevel } from "@/lib/ai/types";
import { DemoBadge, ThinkingDots, Typewriter } from "@/components/ai/typewriter";

const levels: { id: ExplainLevel; label: string }[] = [
  { id: "recruiter", label: "Buat recruiter" },
  { id: "engineer", label: "Buat engineer" },
  { id: "awam", label: "Jelasin kayak ke bocil" },
];

/** AI menjelaskan ulang project sesuai siapa yang baca (versi demo, dari /api/explain). */
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
        <DemoBadge className="text-secondary" />
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
          {loading && !text ? <ThinkingDots /> : text && <Typewriter key={active} text={text} />}
        </div>
      )}
    </div>
  );
}

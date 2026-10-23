"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import type { JobMatchResult } from "@/lib/ai/types";
import { Reveal } from "@/components/motion/reveal";
import { SampleJobPicker } from "@/components/ai/sample-job-picker";
import { DemoBadge, ThinkingDots, Typewriter } from "@/components/ai/typewriter";
import { Wave } from "@/components/wave";

const ease = [0.16, 1, 0.3, 1] as const;

// Analisis Gemini butuh sekitar 3–6 detik, jadi tiap langkah tampil 1,5 detik
const steps = [
  "Baca deskripsi lowongan…",
  "Misahin syarat wajib dan nilai plus…",
  "Nyocokin sama profil keahlian Wayan…",
  "Ngitung skor dan nyari proyek bukti…",
];
const STEP_MS = 1500;

function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-36 shrink-0">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="6" />
        <motion.circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          className="text-accent"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - score / 100) }}
          transition={{ duration: 1.4, ease }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-4xl font-[250] tracking-tight">{score}%</p>
          <p className="text-[10px] uppercase tracking-[0.2em] opacity-60">cocok</p>
        </div>
      </div>
    </div>
  );
}

/** Pengganti ScoreRing saat lowongan tidak dinilai (data kurang / beda bidang): skor sengaja tidak ditampilkan. */
function UnsureRing({ label }: { label: string }) {
  return (
    <div className="grid size-36 shrink-0 place-items-center rounded-full border-[6px] border-dashed border-white/15 text-center">
      <div>
        <p className="text-4xl font-[250] tracking-tight">?</p>
        <p className="text-[10px] uppercase tracking-[0.2em] opacity-60">{label}</p>
      </div>
    </div>
  );
}

/** Recruiter menempel deskripsi lowongan, Gemini mengekstrak syaratnya, skor dihitung dari profil skill. */
export function JobMatchSection() {
  const [jd, setJd] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<JobMatchResult | null>(null);
  const [error, setError] = useState("");

  // Rincian (skill cocok, gap, project) hanya untuk lowongan yang dinilai: sebidang dan datanya cukup
  const judged = !!result && !result.outOfField && !result.lowConfidence;

  async function analyze() {
    setStatus("loading");
    setStep(0);
    setError("");
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), STEP_MS);
    try {
      const res = await fetch("/api/job-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Gagal menganalisis, coba lagi ya.");
      setStatus("error");
    } finally {
      clearInterval(timer);
    }
  }

  return (
    <section id="job-match" className="relative overflow-hidden bg-white py-28 md:py-40">
      <Wave from="tertiary" />
      <div className="relative mx-auto max-w-7xl px-6 lg:pl-24">
        <Reveal>
          <p className="mb-6 flex items-center gap-4 text-xs uppercase tracking-[0.25em] text-secondary">
            07 / Untuk Rekruter <DemoBadge label="SEA AI" />
          </p>
        </Reveal>
        <Reveal delay={0.1} className="flex flex-col gap-6 border-b border-line pb-10 md:flex-row md:items-end md:justify-between">
          <h2 className="text-[clamp(3rem,9vw,7rem)] font-light leading-none tracking-[-0.05em]">Job Match</h2>
          <p className="max-w-sm text-sm leading-relaxed text-secondary">
            Lagi buka lowongan? Tempel deskripsinya di sini, nanti SEA AI cek seberapa cocok saya sama posisinya, lengkap sama proyek yang relevan.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-10 md:grid-cols-12 md:gap-12">
          {/* Input */}
          <Reveal className="md:col-span-5">
            <label htmlFor="jd" className="text-xs uppercase tracking-[0.2em] text-secondary">
              Deskripsi lowongan
            </label>
            <textarea
              id="jd"
              data-lenis-prevent
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder={"Tempel deskripsi lowongan di sini…"}
              rows={11}
              className="mt-3 w-full resize-none rounded-xl border border-line bg-tertiary p-4 text-sm leading-relaxed outline-none transition-colors placeholder:text-secondary focus:border-primary"
            />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={analyze}
                disabled={jd.trim().length < 20 || status === "loading"}
                className="rounded-full bg-primary px-6 py-3 text-sm text-white transition-opacity disabled:opacity-30"
              >
                {status === "loading" ? "Lagi dianalisis…" : "Cek kecocokan"}
              </button>
              <SampleJobPicker onPick={(job) => setJd(job.text)} />
            </div>
            <p className="mt-4 text-xs leading-relaxed text-secondary">
              Mohon jangan tempel informasi yang bersifat rahasia.
            </p>
          </Reveal>

          {/* Hasil */}
          <Reveal delay={0.1} className="md:col-span-7">
            <div className="flex min-h-[420px] flex-col rounded-2xl bg-primary p-6 text-white md:p-8">
              <AnimatePresence mode="wait">
                {status === "idle" && (
                  <motion.div key="idle" exit={{ opacity: 0 }} className="m-auto max-w-xs text-center text-white/50">
                    <p className="font-jp text-5xl text-white/80">適合</p>
                    <p className="mt-4 text-sm">Hasil analisis bakal muncul di sini. Belum punya lowongannya? Klik &quot;Pakai contoh lowongan&quot; dan pilih salah satu.</p>
                  </motion.div>
                )}

                {status === "loading" && (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="m-auto text-center">
                    <ThinkingDots label="Sedang menganalisis" />
                    <p className="mt-4 text-sm text-white/60">{steps[step]}</p>
                  </motion.div>
                )}

                {status === "error" && (
                  <motion.p key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="m-auto text-sm text-white/70">
                    {error}
                  </motion.p>
                )}

                {status === "done" && result && (
                  <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="space-y-7">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                      {result.outOfField ? (
                        <UnsureRing label="beda bidang" />
                      ) : result.lowConfidence ? (
                        <UnsureRing label="kurang data" />
                      ) : (
                        <ScoreRing score={result.score} />
                      )}
                      <div className="space-y-3">
                        <p className="text-base leading-relaxed text-white/85">
                          <Typewriter key={result.summary} text={result.summary} />
                        </p>
                        {result.seniorityNote && (
                          <p className="rounded-lg border border-white/20 px-3 py-2 text-sm text-white/75">
                            <span aria-hidden>⚠️ </span>
                            {result.seniorityNote}
                          </p>
                        )}
                      </div>
                    </div>

                    {judged && (
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-white/50">Keahlian yang cocok</p>
                        <ul className="mt-3 flex flex-wrap gap-2">
                          {result.matched.length ? (
                            result.matched.map((s) => (
                              <li key={s} className="rounded-full bg-white px-3 py-1 text-xs text-primary">
                                ✓ {s}
                              </li>
                            ))
                          ) : (
                            <li className="text-sm text-white/50">Belum ada</li>
                          )}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-white/50">Masih perlu dikejar</p>
                        <ul className="mt-3 flex flex-wrap gap-2">
                          {result.missing.length ? (
                            result.missing.map((s) => (
                              <li key={s} className="rounded-full border border-white/25 px-3 py-1 text-xs text-white/70">
                                {s}
                              </li>
                            ))
                          ) : (
                            <li className="text-sm text-white/50">Aman, gak ada 🎉</li>
                          )}
                        </ul>
                      </div>
                    </div>
                    )}

                    {result.projects.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/50">Proyek yang relevan</p>
                      <ul className="mt-3 divide-y divide-white/10 border-y border-white/10">
                        {result.projects.map((p) => (
                          <li key={p.slug}>
                            <Link href={`/projects/${p.slug}`} className="group flex items-center justify-between gap-4 py-3">
                              <span>
                                <span className="block text-sm">{p.title}</span>
                                <span className="block text-xs text-white/50">{p.reason}</span>
                              </span>
                              <span aria-hidden className="transition-transform duration-500 ease-expo group-hover:translate-x-1">
                                →
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    )}

                    <p className="text-xs text-white/40">
                      {result.source === "ai"
                        ? "Skor dihitung dari profil keahlian Wayan."
                        : "SEA AI lagi gak bisa dihubungi, jadi ini hasil analisis cepat tanpa AI."}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

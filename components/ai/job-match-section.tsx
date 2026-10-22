"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import type { JobMatchResult } from "@/lib/ai/types";
import { SAMPLE_JOB } from "@/lib/ai/samples";
import { Reveal } from "@/components/motion/reveal";
import { DemoBadge, ThinkingDots, Typewriter } from "@/components/ai/typewriter";
import { Wave } from "@/components/wave";

const ease = [0.16, 1, 0.3, 1] as const;

const steps = [
  "Baca deskripsi lowongan…",
  "Nyocokin sama skill Wayan…",
  "Nyari project yang relevan…",
];

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
          <p className="text-[10px] uppercase tracking-[0.2em] opacity-60">match</p>
        </div>
      </div>
    </div>
  );
}

/** Recruiter menempel deskripsi lowongan, AI menilai kecocokan Wayan (versi demo). */
export function JobMatchSection() {
  const [jd, setJd] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<JobMatchResult | null>(null);
  const [error, setError] = useState("");

  async function analyze() {
    setStatus("loading");
    setStep(0);
    setError("");
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 600);
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
            07 / For Recruiters <DemoBadge />
          </p>
        </Reveal>
        <Reveal delay={0.1} className="flex flex-col gap-6 border-b border-line pb-10 md:flex-row md:items-end md:justify-between">
          <h2 className="text-[clamp(3rem,9vw,7rem)] font-light leading-none tracking-[-0.05em]">Job Match</h2>
          <p className="max-w-sm text-sm leading-relaxed text-secondary">
            Lagi buka lowongan? Tempel deskripsinya di sini, nanti SEA AI cek seberapa cocok saya sama posisinya, lengkap sama project yang relevan.
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
              placeholder={"Tempel job description di sini…"}
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
              <button type="button" onClick={() => setJd(SAMPLE_JOB)} className="text-sm text-secondary underline-offset-4 hover:text-primary hover:underline">
                Pakai contoh lowongan
              </button>
            </div>
          </Reveal>

          {/* Hasil */}
          <Reveal delay={0.1} className="md:col-span-7">
            <div className="flex min-h-[420px] flex-col rounded-2xl bg-primary p-6 text-white md:p-8">
              <AnimatePresence mode="wait">
                {status === "idle" && (
                  <motion.div key="idle" exit={{ opacity: 0 }} className="m-auto max-w-xs text-center text-white/50">
                    <p className="font-jp text-5xl text-white/80">適合</p>
                    <p className="mt-4 text-sm">Hasil analisis bakal muncul di sini. Belum punya lowongannya? Klik &quot;Pakai contoh lowongan&quot;.</p>
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
                      <ScoreRing score={result.score} />
                      <p className="text-base leading-relaxed text-white/85">
                        <Typewriter key={result.summary} text={result.summary} />
                      </p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-white/50">Skill yang cocok</p>
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

                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/50">Project yang relevan</p>
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

"use client";

import { useRef, useState } from "react";
import { useLenis } from "lenis/react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ArrowUpRight, Check, ClipboardPaste, Loader2, Sparkles, TriangleAlert, X } from "lucide-react";
import type { JobMatchResult } from "@/lib/ai/types";
import { SAMPLE_JOBS } from "@/lib/ai/samples";
import { Reveal } from "@/components/motion/reveal";
import { SampleJobPicker } from "@/components/ai/sample-job-picker";
import { AiBadge, Typewriter } from "@/components/ai/typewriter";
import { Wave } from "@/components/wave";

const ease = [0.16, 1, 0.3, 1] as const;

// Analisis Gemini butuh sekitar 3–6 detik, jadi tiap langkah tampil 1,5 detik
const steps = [
  "Baca deskripsi lowongan",
  "Misahin syarat wajib dan nilai plus",
  "Nyocokin sama profil keahlian",
  "Ngitung skor dan nyari proyek bukti",
];
const STEP_MS = 1500;
const MAX_CHARS = 6000; // sama dengan batas di /api/job-match

// Contoh yang langsung tampil sebagai tombol cepat (sisanya lewat "Contoh lain")
const QUICK_SAMPLE_IDS = ["junior-ai", "fullstack-ai", "senior-ml", "perawat"];
const quickSamples = QUICK_SAMPLE_IDS.map((id) => SAMPLE_JOBS.find((j) => j.id === id)).filter((j) => j !== undefined);

const howItWorks = [
  { no: "01", title: "Tempel lowongan", desc: "Deskripsi posisi apa pun, bahasa Indonesia atau Inggris." },
  { no: "02", title: "SEA AI baca syaratnya", desc: "Memisahkan syarat wajib, nilai plus, dan level senioritas." },
  { no: "03", title: "Skor yang transparan", desc: "Dihitung dari profil skill, bukan tebakan AI. Lengkap dengan buktinya." },
];

function verdict(score: number): string {
  if (score >= 75) return "Cocok banget";
  if (score >= 50) return "Cukup cocok";
  return "Kurang cocok";
}

function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-36 shrink-0">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <defs>
          <linearGradient id="jm-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="var(--color-accent)" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="7" />
        <motion.circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="url(#jm-ring)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - score / 100) }}
          transition={{ duration: 1.4, ease }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-4xl font-[250] tracking-tight">
            {score}
            <span className="text-xl text-white/60">%</span>
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">cocok</p>
        </div>
      </div>
    </div>
  );
}

/** Pengganti ScoreRing saat lowongan tidak dinilai (data kurang / beda bidang): skor sengaja tidak ditampilkan. */
function UnsureRing({ label }: { label: string }) {
  return (
    <div className="grid size-36 shrink-0 place-items-center rounded-full border-[7px] border-dashed border-white/15 text-center">
      <div>
        <p className="text-4xl font-[250] tracking-tight">?</p>
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">{label}</p>
      </div>
    </div>
  );
}

/** Pratinjau samar bentuk hasil, tampil sebelum ada analisis. */
function IdlePreview() {
  return (
    <motion.div key="idle" exit={{ opacity: 0 }} className="relative flex h-full min-h-105 flex-col">
      <div aria-hidden className="pointer-events-none select-none space-y-6 opacity-[0.18] blur-[1px]">
        <div className="flex items-center gap-6">
          <div className="size-36 shrink-0 rounded-full border-[7px] border-white" />
          <div className="flex-1 space-y-3">
            <div className="h-3 w-24 rounded-full bg-white" />
            <div className="h-4 w-full rounded-full bg-white" />
            <div className="h-4 w-4/5 rounded-full bg-white" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {[20, 28, 16, 24, 18].map((w, i) => (
            <div key={i} className="h-7 rounded-full bg-white" style={{ width: `${w * 4}px` }} />
          ))}
        </div>
        <div className="space-y-2">
          <div className="h-14 rounded-xl bg-white" />
          <div className="h-14 rounded-xl bg-white" />
        </div>
      </div>
      <div className="absolute inset-0 grid place-items-center p-6 text-center">
        <div className="max-w-xs">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15">
            <Sparkles className="size-5 text-accent" />
          </span>
          <p className="mt-4 text-lg font-light">Hasil analisis muncul di sini</p>
          <p className="mt-2 text-sm leading-relaxed text-white/55">
            Tempel deskripsi lowongan di kiri, atau coba salah satu contoh kalau belum punya.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/** Recruiter menempel deskripsi lowongan, Gemini mengekstrak syaratnya, skor dihitung dari profil skill. */
export function JobMatchSection() {
  const [jd, setJd] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<JobMatchResult | null>(null);
  const [error, setError] = useState("");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  // Rincian (skill cocok, gap, project) hanya untuk lowongan yang dinilai: sebidang dan datanya cukup
  const judged = !!result && !result.outOfField && !result.lowConfidence;
  const canAnalyze = jd.trim().length >= 20 && status !== "loading";

  async function analyze() {
    if (!canAnalyze) return;
    setStatus("loading");
    setStep(0);
    setError("");
    // Layar sempit: panel hasil ada di bawah input, jadi bawa pengunjung ke sana
    if (resultRef.current && !window.matchMedia("(min-width: 1024px)").matches) {
      // Posisi dihitung manual (bukan target elemen) supaya jaraknya pas di bawah navbar
      const y = window.scrollY + resultRef.current.getBoundingClientRect().top - 88;
      lenis?.scrollTo(y, { duration: 1.1 });
    }
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

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setJd(text.slice(0, MAX_CHARS));
        setPickedId(null);
      }
    } catch {
      // Izin clipboard ditolak / tidak didukung: pengguna tetap bisa Ctrl+V manual
    }
  }

  return (
    <section id="job-match" className="relative overflow-hidden bg-white py-28 md:py-40">
      <Wave from="tertiary" />
      {/* Kanji 適合 ("cocok") di latar */}
      <span
        aria-hidden
        className="text-outline pointer-events-none absolute -right-[6vw] top-[6%] select-none font-jp text-[34vw] leading-none md:text-[22vw]"
      >
        適合
      </span>

      <div className="relative mx-auto max-w-7xl px-6 lg:pl-24">
        <Reveal>
          <p className="mb-6 flex items-center gap-4 text-xs uppercase tracking-[0.25em] text-secondary">
            07 / Untuk Rekruter <AiBadge label="SEA AI" />
          </p>
        </Reveal>
        <Reveal delay={0.1} className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2 className="text-[clamp(3rem,9vw,7rem)] font-light leading-none tracking-[-0.05em]">Job Match</h2>
          <p className="max-w-sm text-sm leading-relaxed text-secondary">
            Lagi buka lowongan? Tempel deskripsinya, SEA AI cek seberapa cocok saya sama posisinya, lengkap sama proyek yang relevan.
          </p>
        </Reveal>

        {/* Cara kerja */}
        <Reveal delay={0.15}>
          <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-line sm:grid-cols-3">
            {howItWorks.map((item) => (
              <li key={item.no} className="bg-white p-5 md:p-6">
                <p className="font-jp text-xs text-secondary">{item.no}</p>
                <p className="mt-3 text-base font-medium tracking-tight">{item.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-secondary">{item.desc}</p>
              </li>
            ))}
          </ol>
        </Reveal>

        {/* Meja kerja: input kiri, hasil kanan */}
        <Reveal delay={0.2}>
          <div className="mt-6 grid overflow-hidden rounded-3xl shadow-[0_40px_100px_-40px_rgba(42,86,119,0.55)] ring-1 ring-line lg:grid-cols-12">
            {/* Input */}
            <div className="flex flex-col bg-linear-to-b from-white to-tertiary/70 p-5 sm:p-7 lg:col-span-5">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="jd" className="text-xs uppercase tracking-[0.2em] text-secondary">
                  Deskripsi lowongan
                </label>
                <div className="flex items-center gap-1">
                  {jd ? (
                    <button
                      type="button"
                      onClick={() => {
                        setJd("");
                        setPickedId(null);
                      }}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-secondary transition-colors hover:bg-white hover:text-primary"
                    >
                      <X className="size-3.5" /> Hapus
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={pasteFromClipboard}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-secondary transition-colors hover:bg-white hover:text-primary"
                    >
                      <ClipboardPaste className="size-3.5" /> Tempel
                    </button>
                  )}
                </div>
              </div>

              <div className="relative mt-3 flex-1 rounded-2xl bg-white ring-1 ring-line transition-shadow focus-within:shadow-[0_12px_30px_-18px_rgba(42,86,119,0.6)] focus-within:ring-2 focus-within:ring-primary/30">
                <textarea
                  id="jd"
                  data-lenis-prevent
                  value={jd}
                  onChange={(e) => {
                    setJd(e.target.value);
                    setPickedId(null);
                  }}
                  onKeyDown={(e) => {
                    // Ctrl/⌘ + Enter = langsung cek
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      void analyze();
                    }
                  }}
                  maxLength={MAX_CHARS}
                  placeholder={"Contoh:\nKami mencari Junior AI Engineer yang paham integrasi LLM API, RAG, dan Next.js…"}
                  rows={10}
                  className="block h-full min-h-60 w-full resize-none rounded-2xl bg-transparent p-4 pb-9 text-sm leading-relaxed outline-none placeholder:text-secondary/50"
                />
                <span className="pointer-events-none absolute bottom-3 right-4 text-[10px] tabular-nums text-secondary/60">
                  {jd.length.toLocaleString("id-ID")} / {MAX_CHARS.toLocaleString("id-ID")}
                </span>
              </div>

              {/* Contoh cepat */}
              <div className="mt-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-secondary/80">Belum punya lowongan? Coba contoh</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {quickSamples.map((job) => (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => {
                        setJd(job.text);
                        setPickedId(job.id);
                      }}
                      title={job.hint}
                      className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                        pickedId === job.id
                          ? "bg-primary text-white"
                          : "bg-white text-secondary ring-1 ring-line hover:text-primary hover:ring-primary/40"
                      }`}
                    >
                      {job.title}
                    </button>
                  ))}
                  <SampleJobPicker
                    onPick={(job) => {
                      setJd(job.text);
                      setPickedId(job.id);
                    }}
                    className="rounded-full px-3 py-1.5 text-xs text-secondary underline-offset-4 hover:text-primary hover:underline"
                  >
                    Contoh lain…
                  </SampleJobPicker>
                </div>
              </div>

              <button
                type="button"
                onClick={analyze}
                disabled={!canAnalyze}
                className="group mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-br from-primary to-[#1d4260] text-sm font-medium text-white shadow-[0_14px_30px_-14px_rgba(29,66,96,0.9)] transition-[filter,transform,opacity] hover:brightness-110 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-35 disabled:shadow-none"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Lagi dianalisis…
                  </>
                ) : (
                  <>
                    Cek kecocokan
                    <ArrowRight className="size-4 transition-transform duration-500 ease-expo group-hover:translate-x-1" />
                  </>
                )}
              </button>
              <p className="mt-3 text-center text-[11px] text-secondary/80">
                Ctrl/⌘ + Enter untuk cek cepat · Jangan tempel informasi rahasia.
              </p>
            </div>

            {/* Hasil */}
            <div ref={resultRef} className="relative overflow-hidden bg-linear-to-br from-primary via-[#244c6b] to-[#183a55] p-5 text-white sm:p-8 lg:col-span-7">
              {/* Pola grid tipis + cahaya */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:28px_28px]"
              />
              <span aria-hidden className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full bg-accent/20 blur-3xl" />

              <div className="relative h-full" aria-live="polite">
                <AnimatePresence mode="wait">
                  {status === "idle" && <IdlePreview />}

                  {status === "loading" && (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex min-h-105 flex-col justify-center">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/50">SEA AI lagi kerja</p>
                      <ol className="mt-6 space-y-4">
                        {steps.map((label, i) => {
                          const state = i < step ? "done" : i === step ? "current" : "pending";
                          return (
                            <li key={label} className="flex items-center gap-4">
                              <span
                                className={`grid size-8 shrink-0 place-items-center rounded-full ring-1 transition-colors ${
                                  state === "done"
                                    ? "bg-accent text-primary ring-accent"
                                    : state === "current"
                                      ? "bg-white/10 text-white ring-white/40"
                                      : "text-white/30 ring-white/15"
                                }`}
                              >
                                {state === "done" ? (
                                  <Check className="size-4" strokeWidth={2.5} />
                                ) : state === "current" ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <span className="text-xs">{i + 1}</span>
                                )}
                              </span>
                              <span className={`text-sm md:text-base ${state === "pending" ? "text-white/35" : "text-white"}`}>{label}</span>
                            </li>
                          );
                        })}
                      </ol>
                      <div className="mt-8 h-1 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          className="h-full rounded-full bg-linear-to-r from-white to-accent"
                          initial={{ width: "8%" }}
                          animate={{ width: `${((step + 1) / steps.length) * 92}%` }}
                          transition={{ duration: 0.8, ease }}
                        />
                      </div>
                    </motion.div>
                  )}

                  {status === "error" && (
                    <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid min-h-105 place-items-center text-center">
                      <div className="max-w-sm">
                        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                          <TriangleAlert className="size-5 text-accent" />
                        </span>
                        <p className="mt-4 text-sm leading-relaxed text-white/80">{error}</p>
                        <button type="button" onClick={analyze} className="mt-5 rounded-full bg-white px-4 py-2 text-xs font-medium text-primary">
                          Coba lagi
                        </button>
                      </div>
                    </motion.div>
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
                          {judged && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-accent ring-1 ring-white/15">
                              <Sparkles className="size-3.5" /> {verdict(result.score)}
                            </span>
                          )}
                          <p className="text-base leading-relaxed text-white/90">
                            <Typewriter key={result.summary} text={result.summary} />
                          </p>
                          {result.seniorityNote && (
                            <p className="flex gap-2 rounded-xl bg-amber-300/10 px-3 py-2 text-sm text-amber-100 ring-1 ring-amber-200/25">
                              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                              {result.seniorityNote}
                            </p>
                          )}
                        </div>
                      </div>

                      {judged && (
                        <div className="grid gap-6 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 sm:grid-cols-2">
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Keahlian yang cocok</p>
                            <ul className="mt-3 flex flex-wrap gap-2">
                              {result.matched.length ? (
                                result.matched.map((s) => (
                                  <li key={s} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs text-primary">
                                    <Check className="size-3" strokeWidth={3} /> {s}
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
                                  <li key={s} className="rounded-full border border-dashed border-white/30 px-3 py-1 text-xs text-white/75">
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
                          <ul className="mt-3 grid gap-2">
                            {result.projects.map((p) => (
                              <li key={p.slug}>
                                <Link
                                  href={`/projects/${p.slug}`}
                                  className="group flex items-center justify-between gap-4 rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10 transition-colors hover:bg-white/10"
                                >
                                  <span>
                                    <span className="block text-sm">{p.title}</span>
                                    <span className="block text-xs text-white/55">{p.reason}</span>
                                  </span>
                                  <ArrowUpRight className="size-4 shrink-0 text-white/60 transition-transform duration-500 ease-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <p className="text-xs text-white/40">
                        {result.source === "ai"
                          ? "Skor dihitung dari profil keahlian Wayan, AI hanya membaca syarat lowongan."
                          : "SEA AI lagi gak bisa dihubungi, jadi ini hasil analisis cepat tanpa AI."}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

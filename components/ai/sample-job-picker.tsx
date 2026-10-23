"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SAMPLE_JOBS, type SampleJob } from "@/lib/ai/samples";

const ease = [0.16, 1, 0.3, 1] as const;

// Urutan grup mengikuti urutan pertama kali muncul di SAMPLE_JOBS
const groups = [...new Set(SAMPLE_JOBS.map((j) => j.group))];

/** Tombol "Pakai contoh lowongan" + popup untuk memilih salah satu contoh. */
export function SampleJobPicker({ onPick }: { onPick: (job: SampleJob) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Tutup dengan Escape atau klik di luar popup
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="sample-job-picker"
        className="text-sm text-secondary underline-offset-4 hover:text-primary hover:underline"
      >
        Pakai contoh lowongan
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="sample-job-picker"
            role="dialog"
            aria-label="Pilih contoh lowongan"
            data-lenis-prevent
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.3, ease }}
            // Dibuka ke atas: section induknya overflow-hidden, jadi popup yang turun ke bawah akan terpotong
            className="absolute bottom-full left-0 z-30 mb-3 max-h-[min(28rem,60vh)] w-[min(22rem,calc(100vw-3rem))] origin-bottom-left overflow-y-auto rounded-2xl border border-line bg-white p-2 shadow-[0_30px_80px_-20px_rgba(42,86,119,0.35)]"
          >
            {groups.map((group) => (
              <div key={group} className="py-1">
                <p className="px-3 pb-1 pt-2 text-[10px] uppercase tracking-[0.2em] text-secondary">{group}</p>
                <ul>
                  {SAMPLE_JOBS.filter((j) => j.group === group).map((job) => (
                    <li key={job.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onPick(job);
                          setOpen(false);
                        }}
                        className="w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-tertiary focus-visible:bg-tertiary focus-visible:outline-none"
                      >
                        <span className="block text-sm text-primary">{job.title}</span>
                        <span className="block text-xs text-secondary">{job.hint}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

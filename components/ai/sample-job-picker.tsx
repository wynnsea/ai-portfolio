"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { SAMPLE_JOBS, type SampleJob } from "@/lib/ai/samples";

const ease = [0.16, 1, 0.3, 1] as const;

// Urutan grup mengikuti urutan pertama kali muncul di SAMPLE_JOBS
const groups = [...new Set(SAMPLE_JOBS.map((j) => j.group))];

/** Tombol "Pakai contoh lowongan" + popup untuk memilih salah satu contoh. */
export function SampleJobPicker({ onPick }: { onPick: (job: SampleJob) => void }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [mobile, setMobile] = useState(false);
  const [position, setPosition] = useState({ left: 16, top: 16, maxHeight: 448 });

  const updatePosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const isMobile = window.matchMedia("(max-width: 639px)").matches;
    setMobile(isMobile);
    if (isMobile) return;

    const rect = trigger.getBoundingClientRect();
    const width = Math.min(352, window.innerWidth - 32);
    const maxHeight = Math.max(160, Math.min(448, rect.top - 32));
    setPosition({
      left: Math.max(16, Math.min(rect.left, window.innerWidth - width - 16)),
      top: Math.max(16, rect.top - maxHeight - 12),
      maxHeight,
    });
  };

  // The portal keeps the menu clear of clipping ancestors in the job-match section.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!triggerRef.current?.contains(target) && !popupRef.current?.contains(target)) setOpen(false);
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="sample-job-picker"
        className="text-sm text-secondary underline-offset-4 hover:text-primary hover:underline"
      >
        Pakai contoh lowongan
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={popupRef}
                id="sample-job-picker"
                role="dialog"
                aria-label="Pilih contoh lowongan"
                data-lenis-prevent
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.3, ease }}
                style={
                  mobile
                    ? undefined
                    : { left: position.left, top: position.top, maxHeight: position.maxHeight }
                }
                className={`fixed z-[110] overflow-y-auto overscroll-contain rounded-2xl border border-line bg-white p-2 shadow-[0_30px_80px_-20px_rgba(42,86,119,0.35)] ${
                  mobile
                    ? "inset-x-4 bottom-4 max-h-[min(75dvh,32rem)]"
                    : "w-[min(22rem,calc(100vw-2rem))]"
                }`}
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
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

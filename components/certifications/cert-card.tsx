"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useLenis } from "lenis/react";
import type { Certification } from "@/lib/certifications";
import { Parallax } from "@/components/motion/parallax";
import { Reveal } from "@/components/motion/reveal";
import { ProjectCover } from "@/components/projects/project-cover";

// Gaya sama dengan card project (miring, parallax beda-beda), tapi lebih rapat
const layouts = [
  { offset: 30, rotate: "-rotate-2", shift: "lg:mt-0" },
  { offset: -40, rotate: "rotate-[1.5deg]", shift: "lg:mt-20" },
  { offset: 50, rotate: "-rotate-1", shift: "lg:mt-6" },
  { offset: -30, rotate: "rotate-2", shift: "lg:mt-24" },
];

const ease = [0.16, 1, 0.3, 1] as const;

/** Tampilan penuh sertifikat. Dirender lewat portal karena parent memakai transform (parallax). */
function Lightbox({ cert, onClose }: { cert: Certification; onClose: () => void }) {
  const lenis = useLenis();

  useEffect(() => {
    lenis?.stop();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      lenis?.start();
    };
  }, [lenis, onClose]);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
      className="fixed inset-0 z-[95] flex items-center justify-center bg-primary/70 p-4 backdrop-blur-sm md:p-10"
    >
      <motion.figure
        role="dialog"
        aria-label={`Sertifikat ${cert.title}`}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.45, ease }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_40px_100px_-20px_rgba(42,86,119,0.6)]"
      >
        <div className="relative min-h-0 flex-1 bg-tertiary">
          <Image
            src={cert.cover!}
            alt={`Sertifikat ${cert.title} milik Wayan`}
            width={1400}
            height={1400}
            sizes="(min-width: 1024px) 900px, 95vw"
            className="mx-auto h-auto max-h-[70svh] w-auto object-contain p-3 md:p-6"
          />
        </div>
        <figcaption className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-5 py-4 md:px-6">
          <div>
            <p className="text-lg font-light tracking-tight">
              {cert.title}
              {cert.score && <span className="ml-2 rounded-full bg-tertiary px-2.5 py-0.5 text-xs font-medium">Skor {cert.score}</span>}
            </p>
            <p className="mt-0.5 text-xs text-secondary">{[cert.issuer, cert.year, cert.note].filter(Boolean).join(" · ")}</p>
          </div>
          <div className="flex items-center gap-2">
            {cert.credentialUrl && (
              <a
                href={cert.credentialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-primary px-4 py-2 text-xs transition-colors hover:bg-primary hover:text-white"
              >
                Verifikasi ↗
              </a>
            )}
            <button type="button" onClick={onClose} className="rounded-full bg-primary px-4 py-2 text-xs text-white">
              Tutup
            </button>
          </div>
        </figcaption>
      </motion.figure>
    </motion.div>,
    document.body,
  );
}

export function CertCard({ cert, index }: { cert: Certification; index: number }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const layout = layouts[index % layouts.length];
  const meta = [cert.issuer, cert.year].filter(Boolean).join(" · ");

  return (
    <Parallax offset={layout.offset} className={`relative hover:z-20 ${layout.shift}`}>
      <Reveal delay={index * 0.08}>
        <button
          type="button"
          onClick={() => cert.cover && setOpen(true)}
          aria-label={cert.cover ? `Lihat sertifikat ${cert.title}` : undefined}
          className={`group block w-full text-left transition-[rotate,translate] duration-700 ease-expo hover:-translate-y-2 hover:rotate-0 ${layout.rotate} ${
            cert.cover ? "cursor-zoom-in" : "cursor-default"
          }`}
        >
          <div className="relative overflow-hidden shadow-[0_24px_50px_-28px_rgba(42,86,119,0.45)]">
            {cert.cover ? (
              // Sertifikat asli: berwarna & utuh (tidak dipotong) di atas bingkai putih
              <div className="relative aspect-[4/5] bg-white p-3 md:p-4">
                <div className="relative h-full w-full transition-transform duration-[1200ms] ease-expo group-hover:scale-[1.04]">
                  <Image src={cert.cover} alt="" fill sizes="(min-width: 1024px) 22vw, 45vw" className="object-contain" />
                </div>
              </div>
            ) : (
              <div className="transition-transform duration-[1200ms] ease-expo group-hover:scale-[1.06]">
                <ProjectCover project={cert} index={index} className="aspect-[4/5]" sizes="(min-width: 1024px) 22vw, 45vw" />
              </div>
            )}
            {cert.score && (
              <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-medium text-white md:text-xs">
                Skor {cert.score}
              </span>
            )}
            {cert.cover && (
              <span className="pointer-events-none absolute left-1/2 top-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 scale-0 place-items-center rounded-full bg-primary text-[10px] font-medium uppercase tracking-[0.2em] text-white transition-transform duration-500 ease-expo group-hover:scale-100">
                View
              </span>
            )}
          </div>
          <h3 className="mt-4 text-lg font-light tracking-tight md:text-2xl">{cert.title}</h3>
          <p className="mt-1 text-xs text-secondary">{meta}</p>
        </button>
      </Reveal>

      <AnimatePresence>{open && cert.cover && <Lightbox cert={cert} onClose={close} />}</AnimatePresence>
    </Parallax>
  );
}

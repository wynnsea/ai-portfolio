"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useLenis } from "lenis/react";
import type { Activity } from "@/lib/activities";
import { Parallax } from "@/components/motion/parallax";
import { Reveal } from "@/components/motion/reveal";
import { ProjectCover } from "@/components/projects/project-cover";

// Gaya kartu sama dengan project & sertifikat: miring, parallax beda-beda, rapat
const layouts = [
  { offset: 30, rotate: "-rotate-[1.5deg]", shift: "lg:mt-0" },
  { offset: -40, rotate: "rotate-1", shift: "lg:mt-16" },
  { offset: 40, rotate: "-rotate-1", shift: "lg:mt-4" },
  { offset: -30, rotate: "rotate-[1.5deg]", shift: "lg:-mt-6" },
  { offset: 35, rotate: "-rotate-2", shift: "lg:mt-10" },
  { offset: -35, rotate: "rotate-1", shift: "lg:-mt-2" },
];

const ease = [0.16, 1, 0.3, 1] as const;

/** Tampilan penuh kegiatan + slideshow foto. Lewat portal karena parent memakai transform. */
function ActivityLightbox({ activity, index, onClose }: { activity: Activity; index: number; onClose: () => void }) {
  const photos = activity.photos ?? [];
  const [slide, setSlide] = useState(0);
  const lenis = useLenis();
  const go = useCallback((dir: number) => setSlide((s) => (s + dir + photos.length) % photos.length), [photos.length]);

  useEffect(() => {
    lenis?.stop();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (photos.length > 1 && e.key === "ArrowRight") go(1);
      if (photos.length > 1 && e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      lenis?.start();
    };
  }, [lenis, onClose, go, photos.length]);

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
        aria-label={activity.title}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.45, ease }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_40px_100px_-20px_rgba(42,86,119,0.6)]"
      >
        <div className="relative aspect-[16/10] max-h-[62svh] w-full overflow-hidden bg-tertiary">
          {photos.length ? (
            <AnimatePresence mode="wait">
              <motion.div key={slide} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="absolute inset-0">
                <Image src={photos[slide]} alt={`${activity.title}, foto ${slide + 1}`} fill sizes="(min-width: 1024px) 900px, 95vw" className="object-contain" />
              </motion.div>
            </AnimatePresence>
          ) : (
            <ProjectCover project={activity} index={index} variant={1} className="h-full w-full" sizes="900px" />
          )}

          {photos.length > 1 && (
            <>
              <button type="button" onClick={() => go(-1)} aria-label="Foto sebelumnya" className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-primary shadow">
                ←
              </button>
              <button type="button" onClick={() => go(1)} aria-label="Foto berikutnya" className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-primary shadow">
                →
              </button>
              <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSlide(i)}
                    aria-label={`Foto ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${i === slide ? "w-6 bg-white" : "w-1.5 bg-white/60"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <figcaption className="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-end md:justify-between md:px-6">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-secondary">
              {[activity.role, activity.organizer, activity.year].filter(Boolean).join(" · ")}
            </p>
            <p className="mt-2 text-xl font-light tracking-tight md:text-2xl">{activity.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-secondary">{activity.description}</p>
          </div>
          <button type="button" onClick={onClose} className="w-fit shrink-0 rounded-full bg-primary px-4 py-2 text-xs text-white">
            Tutup
          </button>
        </figcaption>
      </motion.figure>
    </motion.div>,
    document.body,
  );
}

export function ActivityCard({ activity, index }: { activity: Activity; index: number }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const layout = layouts[index % layouts.length];
  const cover = activity.photos?.[0];
  const photoCount = activity.photos?.length ?? 0;

  return (
    <Parallax offset={layout.offset} className={`relative hover:z-20 ${layout.shift}`}>
      <Reveal delay={(index % 3) * 0.08}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Lihat kegiatan ${activity.title}`}
          className={`group block w-full cursor-zoom-in text-left transition-[rotate,translate] duration-700 ease-expo hover:-translate-y-2 hover:rotate-0 ${layout.rotate}`}
        >
          <div className="relative overflow-hidden shadow-[0_24px_50px_-28px_rgba(42,86,119,0.45)]">
            {cover ? (
              // Foto kegiatan: hitam-putih, berwarna saat di-hover (senada dengan foto hero)
              <div className="relative aspect-[4/3]">
                <Image
                  src={cover}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 30vw, 45vw"
                  style={activity.focus ? { objectPosition: activity.focus } : undefined}
                  className="object-cover grayscale transition-[filter,scale] duration-[1200ms] ease-expo group-hover:scale-[1.05] group-hover:grayscale-0"
                />
              </div>
            ) : (
              <div className="transition-transform duration-[1200ms] ease-expo group-hover:scale-[1.06]">
                <ProjectCover project={activity} index={index} className="aspect-[4/3]" sizes="(min-width: 1024px) 30vw, 45vw" />
              </div>
            )}
            {photoCount > 1 && (
              <span className="absolute bottom-3 right-3 rounded-full bg-primary/80 px-2.5 py-1 text-[10px] text-white">{photoCount} foto</span>
            )}
          </div>
          <p className="mt-4 text-xs text-secondary">
            <span className="font-medium text-primary">{activity.role}</span> · {[activity.organizer, activity.year].filter(Boolean).join(" · ")}
          </p>
          <h3 className="mt-1 text-lg font-light leading-snug tracking-tight md:text-2xl">{activity.title}</h3>
          <p className="mt-2 hidden text-sm leading-relaxed text-secondary sm:line-clamp-2">{activity.description}</p>
        </button>
      </Reveal>

      <AnimatePresence>{open && <ActivityLightbox activity={activity} index={index} onClose={close} />}</AnimatePresence>
    </Parallax>
  );
}

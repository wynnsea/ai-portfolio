"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useLenis } from "lenis/react";
import type { Activity } from "@/lib/activities";
import { ProjectCover } from "@/components/projects/project-cover";

const ease = [0.16, 1, 0.3, 1] as const;

/** Tampilan penuh kegiatan + slideshow foto. Lewat portal karena parent memakai transform. */
export function ActivityLightbox({ activity, index, onClose }: { activity: Activity; index: number; onClose: () => void }) {
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
                <Image src={photos[slide]} alt={`${activity.title}, foto ${slide + 1}`} fill sizes="(min-width: 1024px) 900px, 95vw" unoptimized className="object-contain" />
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

/**
 * Kartu foto kegiatan (landscape) untuk baris yang bergeser horizontal.
 * `duplicate`: salinan untuk mengisi baris; tetap bisa diklik, tapi dilewati keyboard & pembaca layar.
 */
export function ActivityCard({
  activity,
  index,
  duplicate = false,
  tilt = "",
}: {
  activity: Activity;
  index: number;
  duplicate?: boolean;
  /** Kelas rotasi kecil (mis. "rotate-1"); kartu kembali lurus saat di-hover */
  tilt?: string;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const cover = activity.photos?.[0];
  const photoCount = activity.photos?.length ?? 0;

  return (
    <div className="w-[clamp(15rem,30vw,26rem)] shrink-0" aria-hidden={duplicate || undefined}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        tabIndex={duplicate ? -1 : undefined}
        aria-label={`Lihat kegiatan ${activity.title}`}
        className={`group block w-full cursor-zoom-in text-left transition-[rotate,translate] duration-700 ease-expo hover:-translate-y-2 hover:rotate-0 ${tilt}`}
      >
        <div className="relative aspect-[3/2] overflow-hidden shadow-[0_24px_50px_-28px_rgba(42,86,119,0.45)]">
          {cover ? (
            // Foto kegiatan: hitam-putih, berwarna saat di-hover (senada dengan foto hero)
            <Image
              src={cover}
              alt=""
              fill
              sizes="(min-width: 1024px) 26rem, 60vw"
              unoptimized
              style={activity.focus ? { objectPosition: activity.focus } : undefined}
              className="object-cover grayscale transition-[filter,scale] duration-[1200ms] ease-expo group-hover:scale-[1.05] group-hover:grayscale-0"
            />
          ) : (
            <div className="h-full transition-transform duration-[1200ms] ease-expo group-hover:scale-[1.06]">
              <ProjectCover project={activity} index={index} className="h-full" sizes="(min-width: 1024px) 26rem, 60vw" />
            </div>
          )}
          {photoCount > 1 && (
            <span className="absolute bottom-3 right-3 rounded-full bg-primary/80 px-2.5 py-1 text-[10px] text-white">{photoCount} foto</span>
          )}
        </div>
        <p className="mt-4 truncate text-xs text-secondary">
          <span className="font-medium text-primary">{activity.role}</span> · {[activity.organizer, activity.year].filter(Boolean).join(" · ")}
        </p>
        <h3 className="mt-1 truncate text-lg font-light leading-snug tracking-tight md:text-xl">{activity.title}</h3>
      </button>

      <AnimatePresence>{open && <ActivityLightbox activity={activity} index={index} onClose={close} />}</AnimatePresence>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { site } from "@/lib/site";

const FIRST_MS = 650;
const STEP_MS = 200;
const LAST_MS = 1000;

const greetings = site.greetings;
const TOTAL_MS = FIRST_MS + STEP_MS * (greetings.length - 2) + LAST_MS;

export function Preloader({ onComplete }: { onComplete: () => void }) {
  const [index, setIndex] = useState(0);
  const progress = useMotionValue(0);
  const counter = useTransform(progress, (v) => String(Math.round(v)).padStart(3, "0"));
  const bar = useTransform(progress, [0, 100], [0, 1]);
  const isLast = index === greetings.length - 1;

  // Ganti ucapan satu per satu, lalu beri tahu provider bahwa intro selesai
  useEffect(() => {
    if (isLast) {
      const t = setTimeout(onComplete, LAST_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setIndex((i) => i + 1), index === 0 ? FIRST_MS : STEP_MS);
    return () => clearTimeout(t);
  }, [index, isLast, onComplete]);

  useEffect(() => {
    const controls = animate(progress, 100, {
      duration: (TOTAL_MS - 250) / 1000,
      ease: [0.65, 0, 0.35, 1],
    });
    return () => controls.stop();
  }, [progress]);

  return (
    <motion.div
      data-preloader
      role="status"
      aria-label="Memuat"
      className="fixed inset-0 z-[100] flex flex-col bg-primary px-6 py-6 text-white md:px-10 md:py-8"
      exit={{ y: "-100%", transition: { duration: 0.9, ease: [0.76, 0, 0.24, 1], delay: 0.15 } }}
    >
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-secondary">
        <span className="font-semibold tracking-[0.3em] text-white">{site.brand}</span>
        <span>{site.role}</span>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: index === 0 ? 0.6 : 0.15 }}
          className={`flex items-center gap-4 font-light tracking-tight ${
            isLast ? "text-5xl md:text-7xl" : "text-4xl md:text-6xl"
          }`}
        >
          <span className="size-2.5 rounded-full bg-white md:size-3" />
          {greetings[index]}
        </motion.p>
      </div>

      <div className="flex items-end justify-between">
        <div className="h-px w-1/2 overflow-hidden bg-white/15 md:w-1/3">
          <motion.div className="h-full origin-left bg-white" style={{ scaleX: bar }} />
        </div>
        <motion.span className="text-6xl font-extralight tabular-nums leading-none md:text-8xl">{counter}</motion.span>
      </div>
    </motion.div>
  );
}

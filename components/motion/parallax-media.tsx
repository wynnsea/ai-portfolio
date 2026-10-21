"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

/** Gambar/cover yang bergeser di dalam bingkainya saat di-scroll (parallax "jendela"). */
export function ParallaxMedia({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className ?? ""}`}>
      <motion.div style={{ y }} className="absolute inset-x-0 -inset-y-[14%]">
        {children}
      </motion.div>
    </div>
  );
}

"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

type ParallaxProps = {
  children: React.ReactNode;
  /** Jarak geser dalam px. Positif = lebih lambat dari scroll (terasa jauh), negatif = lebih cepat (terasa dekat). */
  offset?: number;
  className?: string;
};

export function Parallax({ children, offset = 120, className }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-offset, offset]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

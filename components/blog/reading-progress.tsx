"use client";

import { motion, useScroll, useSpring } from "motion/react";

/** Garis progres membaca di bagian atas layar. */
export function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return <motion.div aria-hidden style={{ scaleX }} className="fixed inset-x-0 top-0 z-[55] h-0.5 origin-left bg-accent" />;
}

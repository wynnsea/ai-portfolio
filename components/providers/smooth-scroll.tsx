"use client";

import { ReactLenis } from "lenis/react";
import { MotionConfig } from "motion/react";
import { ScrollManager } from "@/components/providers/scroll-manager";

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.1, smoothWheel: true }}>
      <ScrollManager />
      {/* Menghormati preferensi "reduce motion" dari sistem operasi */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </ReactLenis>
  );
}

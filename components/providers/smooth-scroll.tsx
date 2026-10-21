"use client";

import { ReactLenis } from "lenis/react";
import { MotionConfig } from "motion/react";

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.1, smoothWheel: true }}>
      {/* Menghormati preferensi "reduce motion" dari sistem operasi */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </ReactLenis>
  );
}

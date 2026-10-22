"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { Parallax } from "@/components/motion/parallax";

const text =
  "Saya tertarik dengan perkembangan teknologi AI, terutama cara mengintegrasikannya ke dalam sistem nyata. Dan ada satu hal yang selalu jadi inspirasi saya: budaya Jepang.";

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.15, 1]);
  return (
    <motion.span style={{ opacity }} className="mr-[0.25em] inline-block">
      {children}
    </motion.span>
  );
}

/** Section transisi: teks menyala kata demi kata mengikuti scroll, dengan huruf "Aa" parallax di belakang. */
export function Statement() {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const words = text.split(" ");

  return (
    <section id="statement" className="relative overflow-hidden bg-white py-32 md:py-48">
      <Parallax
        offset={160}
        className="text-outline pointer-events-none absolute inset-0 flex select-none items-center justify-center"
      >
        <span aria-hidden className="text-[55vw] font-semibold leading-none tracking-[-0.08em] md:text-[40vw]">
          Aa
        </span>
      </Parallax>

      <div className="relative mx-auto max-w-7xl px-6 lg:pl-24">
        <p className="mb-8 text-xs uppercase tracking-[0.25em] text-secondary">01 / Intro</p>
        <p
          ref={ref}
          className="max-w-5xl text-[clamp(2rem,5.5vw,4.5rem)] font-light leading-[1.08] tracking-[-0.04em]"
        >
          {words.map((w, i) => (
            <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
              {w}
            </Word>
          ))}
        </p>
      </div>
    </section>
  );
}

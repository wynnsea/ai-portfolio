"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, type Variants } from "motion/react";
import { useLenis } from "lenis/react";
import { site } from "@/lib/site";
import { useIntro } from "@/components/providers/intro-provider";

const ease = [0.16, 1, 0.3, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (delay: number = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.9, ease, delay } }),
};

const letter: Variants = {
  hidden: { y: "110%" },
  show: (i: number) => ({ y: 0, transition: { duration: 1.1, ease, delay: 0.15 + i * 0.06 } }),
};

export function Hero() {
  const { done } = useIntro();
  const lenis = useLenis();
  const ref = useRef<HTMLElement>(null);
  const state = done ? "show" : "hidden";

  // Parallax: tiap layer bergerak dengan kecepatan berbeda untuk menciptakan kedalaman
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "45%"]);
  const photoY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const photoScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "-35%"]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section id="home" ref={ref} className="relative min-h-svh overflow-hidden bg-white">
      {/* Layer paling belakang: huruf outline besar */}
      <motion.div
        aria-hidden
        style={{ y: bgY }}
        className="text-outline pointer-events-none absolute right-[2vw] top-[10vh] select-none text-[38vw] font-semibold leading-none tracking-[-0.08em] lg:text-[26vw]"
      >
        AI
      </motion.div>

      {/* Rail vertikal kiri, seperti pada referensi */}
      <motion.div
        variants={fadeUp}
        custom={0.9}
        initial="hidden"
        animate={state}
        className="absolute bottom-10 left-8 top-28 hidden flex-col items-center gap-6 text-[11px] uppercase tracking-[0.25em] text-secondary lg:flex"
      >
        <span className="[writing-mode:vertical-rl] rotate-180">{site.role}</span>
        <span className="w-px flex-1 bg-line" />
        <span className="font-jp text-sm tracking-[0.4em] text-primary [writing-mode:vertical-rl]">{site.nameJp}</span>
      </motion.div>

      <div className="relative mx-auto grid min-h-svh max-w-7xl grid-cols-1 gap-10 px-6 pt-28 lg:grid-cols-2 lg:gap-6 lg:pl-24 lg:pt-24">
        {/* Kiri: foto profil */}
        <div className="order-2 flex items-end justify-center lg:order-1 lg:justify-start">
          <motion.div
            style={{ y: photoY }}
            className="relative aspect-4/5 w-full max-w-md overflow-hidden lg:max-w-none lg:h-[82svh] lg:w-auto"
          >
            <motion.div
              initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
              animate={done ? { clipPath: "inset(0% 0% 0% 0%)" } : undefined}
              transition={{ duration: 1.4, ease, delay: 0.1 }}
              className="absolute inset-0"
            >
              <motion.div style={{ scale: photoScale }} className="absolute inset-0">
                <Image
                  src={site.photo}
                  alt={`Foto ${site.name}`}
                  fill
                  priority
                  sizes="(min-width: 1024px) 45vw, 90vw"
                  className="object-cover object-top grayscale"
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Kanan: Hello + deskripsi */}
        <motion.div
          style={{ y: textY, opacity: textOpacity }}
          className="order-1 flex flex-col justify-center lg:order-2 lg:pb-16"
        >
          {/* {site.availability.open && (
            <motion.p
              variants={fadeUp}
              custom={0.5}
              initial="hidden"
              animate={state}
              className="mb-8 inline-flex w-fit items-center gap-2.5 rounded-full border border-line bg-tertiary px-4 py-1.5 text-xs"
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              <span className="font-medium">{site.availability.label}</span>
              <span className="text-secondary">· {site.availability.detail}</span>
            </motion.p>
          )} */}

          <motion.div variants={fadeUp} custom={0.6} initial="hidden" animate={state} className="mb-8 flex gap-10 lg:mb-10">
            {site.stats.map((s) => (
              <div key={s.value}>
                <p className="text-3xl font-light tracking-tight md:text-4xl">
                  <sup className="mr-0.5 text-base font-normal">+</sup>
                  {s.value}
                </p>
                <p className="mt-1 text-xs text-secondary">{s.label}</p>
              </div>
            ))}
          </motion.div>

          <h1 className="flex overflow-hidden pb-[0.08em] text-[clamp(5.5rem,20vw,13rem)] font-[250] leading-[0.9] tracking-[-0.06em]">
            {"Hello".split("").map((ch, i) => (
              <motion.span key={i} custom={i} variants={letter} initial="hidden" animate={state} className="inline-block">
                {ch}
              </motion.span>
            ))}
          </h1>

          <motion.p variants={fadeUp} custom={0.8} initial="hidden" animate={state} className="mt-4 text-base md:text-lg">
            Saya <span className="font-medium">{site.name}</span>, {site.tagline}
          </motion.p>

          <motion.p
            variants={fadeUp}
            custom={0.95}
            initial="hidden"
            animate={state}
            className="mt-4 max-w-md text-sm leading-relaxed text-secondary md:text-base"
          >
            {site.description}
          </motion.p>

          <motion.a
            variants={fadeUp}
            custom={1.1}
            initial="hidden"
            animate={state}
            href="#statement"
            onClick={(e) => {
              e.preventDefault();
              lenis?.scrollTo("#statement", { duration: 1.4 });
            }}
            className="group mt-10 inline-flex w-fit items-center gap-2 text-sm"
          >
            Scroll down
            <span aria-hidden className="inline-block animate-bounce">↓</span>
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}

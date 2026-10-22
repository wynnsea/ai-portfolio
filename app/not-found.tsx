import type { Metadata } from "next";
import { Parallax } from "@/components/motion/parallax";
import { Reveal } from "@/components/motion/reveal";
import { NotFoundActions } from "@/components/not-found-actions";

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan",
};

export default function NotFound() {
  return (
    <main className="relative flex min-h-svh items-center overflow-hidden bg-white pb-24 pt-32">
      {/* Kanji 迷 ("tersesat") di latar belakang */}
      <Parallax
        offset={120}
        className="text-outline pointer-events-none absolute -right-[6vw] top-[8%] select-none font-jp text-[60vw] leading-none md:text-[42vw]"
      >
        <span aria-hidden>迷</span>
      </Parallax>

      {/* Ombak di bagian bawah */}
      <svg aria-hidden viewBox="0 0 1440 220" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-40 w-full md:h-56">
        <path d="M0 120 C 240 70, 480 170, 720 120 S 1200 70, 1440 120 L1440 220 L0 220 Z" className="fill-accent/25" />
        <path d="M0 160 C 300 120, 560 210, 860 160 S 1260 120, 1440 160 L1440 220 L0 220 Z" className="fill-accent/40" />
      </svg>

      <div className="relative mx-auto w-full max-w-7xl px-6 lg:pl-24">
        <Reveal>
          <p className="mb-6 text-xs uppercase tracking-[0.25em] text-secondary">Error 404 / Lost at sea</p>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 className="text-[clamp(7rem,26vw,18rem)] font-[250] leading-[0.85] tracking-[-0.06em]">404</h1>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mt-8 max-w-xl text-2xl font-light leading-snug tracking-tight md:text-4xl">
            Waduh, halaman ini kayaknya tenggelam di lautan.
          </p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-secondary md:text-base">
            Mungkin link-nya salah ketik, atau halamannya udah dipindah. Yuk balik ke daratan, atau cari langsung yang kamu butuhin.
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <NotFoundActions />
        </Reveal>
      </div>
    </main>
  );
}

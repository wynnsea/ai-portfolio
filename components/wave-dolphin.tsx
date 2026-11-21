"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { DolphinMascot } from "@/components/dolphin-mascot";

/**
 * Easter egg: selama ombak ini terlihat di layar, lumba-lumba melompat keluar dari laut pada
 * waktu acak, melengkung di udara, lalu menyelam lagi ke laut yang sama.
 *
 * - Biasanya rombongan beruntun: satu ekor keluar, lalu sebelum ia menyelam 2–5 ekor lain sudah
 *   ikut melompat di belakangnya (total 3–6 ekor). Sesekali hanya 1 ekor.
 * - Lompatan pertama 0,7–1,8 detik setelah ombak terlihat, berikutnya tiap 3–7 detik (acak).
 * - Berhenti saat ombak keluar layar atau tab tidak dibuka; mati kalau "kurangi animasi" aktif.
 *
 * Section memakai overflow-hidden, jadi lompatan dirender lewat portal ke <body> dengan posisi
 * absolut di koordinat halaman (ikut ter-scroll bersama halaman).
 */

/**
 * Garis air (bagian lumba-lumba di bawahnya tidak terlihat), dalam persen tinggi ombak.
 * - Laut di bawah (section bawah berwarna biru): garis di dalam lapisan biru, di bawah tepi ombak
 *   depan yang terendah (62%), jadi lumba-lumba keluar & masuk dari air biru lalu melompat ke atas.
 * - Laut di atas (section atas berwarna biru): garis di puncak tepi ombak (≈26%), jadi lumba-lumba
 *   tidak pernah terlihat di section bawah yang putih.
 */
const SURFACE = { below: 0.8, above: 0.24 } as const;
const SAMPLES = 19; // titik lintasan; makin banyak makin halus
const FIRST_DELAY: [number, number] = [700, 1800];
const NEXT_DELAY: [number, number] = [3000, 7000];
const SINGLE_CHANCE = 0.25; // sesekali hanya 1 ekor; sisanya rombongan beruntun 3–6 ekor

export type Sea = keyof typeof SURFACE;

type Jump = {
  key: number;
  left: number; // koordinat halaman, ujung kiri lintasan
  surface: number;
  dir: 1 | -1;
  size: number;
  height: number;
  distance: number;
  duration: number; // detik
  delay: number; // detik, supaya rombongan melompat beruntun
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);
let nextKey = 1;

export function WaveDolphin({ sea }: { sea: Sea }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [jumps, setJumps] = useState<Jump[]>([]);
  const remove = useCallback((key: number) => setJumps((list) => list.filter((j) => j.key !== key)), []);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let visible = false;
    let lastSegment = -1;

    const launch = () => {
      const r = el.getBoundingClientRect();
      const mobile = window.innerWidth < 768;
      const pageLeft = r.left + window.scrollX;
      const surface = r.top + window.scrollY + r.height * SURFACE[sea];
      const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1; // satu rombongan berenang searah
      const single = Math.random() < SINGLE_CHANCE;
      const count = single ? 1 : 3 + Math.floor(Math.random() * 4); // 1 atau 3–6 ekor

      // Ukuran & lintasan dasar; tiap ekor sedikit berbeda, kadang ada anak (lebih kecil)
      const baseSize = mobile ? (single ? 70 : 52) : single ? 100 : 86;
      const baseDistance = mobile ? (single ? 160 : 110) : single ? 260 : 220;
      const baseHeight = mobile ? (single ? 110 : 90) : single ? 145 : 130;
      const babies = single ? new Set<number>() : new Set([Math.floor(Math.random() * count)]);

      const specs = Array.from({ length: count }, (_, i) => {
        const baby = babies.has(i);
        const scale = baby ? 0.68 : rand(0.88, 1.06);
        return {
          size: baseSize * scale,
          distance: baseDistance * (baby ? 0.8 : rand(0.92, 1.08)),
          height: baseHeight * (baby ? 0.75 : rand(0.9, 1.1)),
          duration: rand(1.7, 2.05),
        };
      });
      const maxSpan = Math.max(...specs.map((sp) => sp.distance + sp.size));

      // Posisi: satu ekor → bagian ombak berbeda dari sebelumnya; rombongan → berbaris searah
      let lefts: number[];
      if (single) {
        const segmentWidth = r.width / 3;
        const options = [0, 1, 2].filter((sg) => sg !== lastSegment);
        const segment = options[Math.floor(Math.random() * options.length)];
        lastSegment = segment;
        lefts = [pageLeft + segment * segmentWidth + rand(0, Math.max(0, segmentWidth - maxSpan * 0.6))];
      } else {
        // Jarak antar-ekor lebih pendek dari lintasan, jadi yang belakang sudah melompat sebelum yang depan menyelam
        let step = baseDistance * rand(0.4, 0.6);
        const room = r.width - 24 - maxSpan;
        if (step * (count - 1) > room) step = Math.max(24, room / (count - 1));
        const extent = step * (count - 1) + maxSpan;
        const start = pageLeft + 12 + rand(0, Math.max(0, r.width - 24 - extent));
        lefts = specs.map((_, i) => start + i * step);
      }

      // Yang paling depan (searah renang) melompat duluan, sisanya menyusul beruntun
      const gap = rand(0.28, 0.42);
      const created: Jump[] = specs.map((sp, i) => {
        const order = dir === 1 ? count - 1 - i : i;
        const left = Math.min(Math.max(lefts[i], pageLeft + 8), pageLeft + r.width - sp.distance - sp.size - 8);
        return {
          key: nextKey++,
          left,
          surface,
          dir,
          ...sp,
          delay: single ? 0 : order * gap + rand(0, 0.08),
        };
      });
      setJumps((list) => [...list, ...created]);
    };

    const schedule = (first: boolean) => {
      clearTimeout(timer);
      if (!visible || document.hidden) return;
      const [min, max] = first ? FIRST_DELAY : NEXT_DELAY;
      timer = setTimeout(() => {
        launch();
        schedule(false);
      }, rand(min, max));
    };

    // "Terlihat" = ombak utuh berada di area tengah layar (tidak tertutup navbar / tepi bawah)
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) schedule(true);
        else clearTimeout(timer);
      },
      { rootMargin: "-10% 0px -10% 0px", threshold: 1 },
    );
    io.observe(el);

    const onVisibility = () => (document.hidden ? clearTimeout(timer) : schedule(true));
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      io.disconnect();
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [sea]);

  return (
    <>
      <span ref={ref} className="absolute inset-0" />
      {jumps.length > 0 &&
        createPortal(
          jumps.map((jump) => <DolphinJump key={jump.key} jump={jump} onDone={remove} />),
          document.body,
        )}
    </>
  );
}

function DolphinJump({ jump, onDone }: { jump: Jump; onDone: (key: number) => void }) {
  const { size, height, distance, dir, duration, delay } = jump;
  const bodyHeight = size * 0.5; // rasio viewBox maskot 140×70
  const submerged = size * 0.6; // titik awal & akhir: pusat badan sedalam ini di bawah garis air
  const arc = height + submerged;

  // Lintasan parabola + kemiringan badan mengikuti arah gerak (garis singgung)
  const times = Array.from({ length: SAMPLES }, (_, i) => i / (SAMPLES - 1));
  const xs = times.map((t) => distance * t);
  const ys = times.map((t) => submerged - arc * 4 * t * (1 - t));
  const rotations = times.map((t) => (Math.atan2(-arc * 4 * (1 - 2 * t), distance) * 180) / Math.PI);

  const box = { width: distance + size * 2, height: height + size * 1.2 };
  const startX = size; // pusat lumba-lumba saat keluar dari air (koordinat lokal)

  useEffect(() => {
    const t = setTimeout(() => onDone(jump.key), (delay + duration + 0.9) * 1000);
    return () => clearTimeout(t);
  }, [onDone, jump.key, delay, duration]);

  const wrapper = {
    left: jump.left - size / 2,
    top: jump.surface - box.height,
    width: box.width,
    transform: dir === -1 ? "scaleX(-1)" : undefined, // lompat ke kiri = cermin
  };

  return (
    <div aria-hidden className="pointer-events-none absolute z-30" style={wrapper}>
      {/* Area di atas garis air; tepi bawahnya = permukaan laut, jadi bagian yang masih di air tidak terlihat */}
      <div className="relative overflow-hidden" style={{ height: box.height }}>
        <motion.div
          className="absolute"
          style={{ left: startX - size / 2, top: box.height - bodyHeight / 2, width: size, height: bodyHeight }}
          initial={{ x: xs[0], y: ys[0], rotate: rotations[0] }}
          animate={{ x: xs, y: ys, rotate: rotations }}
          transition={{ duration, delay, ease: "linear", times }}
        >
          <DolphinMascot className="h-full w-full drop-shadow-[0_6px_10px_rgba(42,86,119,0.25)]" />
        </motion.div>
      </div>

      {/* Cipratan & riak saat keluar dan masuk air */}
      <Splash x={startX} y={box.height} delay={delay + 0.08} size={size} />
      <Splash x={startX + distance} y={box.height} delay={delay + duration * 0.86} size={size} />
    </div>
  );
}

const DROPS = [
  { dx: -0.32, dy: -0.55 },
  { dx: -0.16, dy: -0.8 },
  { dx: 0.02, dy: -0.95 },
  { dx: 0.18, dy: -0.78 },
  { dx: 0.34, dy: -0.5 },
  { dx: -0.45, dy: -0.28 },
  { dx: 0.46, dy: -0.3 },
];

function Splash({ x, y, delay, size }: { x: number; y: number; delay: number; size: number }) {
  return (
    <div className="absolute" style={{ left: x, top: y }}>
      {/* Riak melebar di permukaan */}
      <motion.span
        className="absolute rounded-[50%] border-2 border-accent"
        style={{ width: size * 0.9, height: size * 0.22, left: -size * 0.45, top: -size * 0.11 }}
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: [0.3, 1.3], opacity: [0, 0.9, 0] }}
        transition={{ duration: 0.9, delay, ease: "easeOut" }}
      />
      {/* Tetesan yang terlempar ke atas lalu jatuh */}
      {DROPS.map((d, i) => {
        const r = size * (i % 2 ? 0.05 : 0.07);
        return (
          <motion.span
            key={i}
            className="absolute rounded-full bg-accent ring-1 ring-primary/25"
            style={{ width: r, height: r, left: -r / 2, top: -r / 2 }}
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{
              x: [0, d.dx * size * 0.8, d.dx * size * 1.05],
              y: [0, d.dy * size * 0.75, d.dy * size * 0.2],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 0.75, delay: delay + i * 0.015, ease: "easeOut", times: [0, 0.45, 1] }}
          />
        );
      })}
    </div>
  );
}

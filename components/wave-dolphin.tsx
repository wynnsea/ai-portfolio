"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { DolphinMascot } from "@/components/dolphin-mascot";

/**
 * Easter egg: selama ombak ini terlihat di layar, lumba-lumba melompat keluar dari laut pada
 * waktu acak, melengkung di udara, lalu menyelam lagi. Kadang 1 ekor, kadang rombongan 3 ekor
 * sekaligus, dengan posisi tersebar di sepanjang ombak (tidak monoton di satu sisi).
 *
 * - Lompatan pertama 2–5 detik setelah ombak terlihat, berikutnya tiap 6–14 detik (acak).
 * - Berhenti saat ombak keluar layar atau tab tidak dibuka.
 * - Tidak aktif kalau pengunjung memilih "kurangi animasi".
 *
 * Section memakai overflow-hidden, jadi lompatan dirender lewat portal ke <body> dengan posisi
 * absolut di koordinat halaman (ikut ter-scroll bersama halaman).
 */

const SURFACE = 0.6; // garis air = 60% tinggi ombak (di sekitar lapisan ombak biru)
const SAMPLES = 19; // titik lintasan; makin banyak makin halus
const FIRST_DELAY: [number, number] = [2000, 5000];
const NEXT_DELAY: [number, number] = [6000, 14000];
const POD_CHANCE = 0.45; // peluang rombongan 3 ekor (sisanya 1 ekor)

type Jump = {
  key: number;
  left: number; // koordinat halaman, titik keluar dari air
  surface: number;
  dir: 1 | -1;
  size: number;
  height: number;
  distance: number;
  duration: number; // detik
  delay: number; // detik, untuk rombongan yang tidak persis bersamaan
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);
let nextKey = 1;

export function WaveDolphin() {
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
      const pod = Math.random() < POD_CHANCE;
      const count = pod ? 3 : 1;
      const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1; // rombongan berenang searah
      const pageLeft = r.left + window.scrollX;
      const segmentWidth = r.width / 3;

      // Bagi ombak jadi 3 bagian (kiri, tengah, kanan). Rombongan: satu ekor per bagian.
      // Satu ekor: pilih bagian yang berbeda dari lompatan sebelumnya.
      let segments: number[];
      if (pod) segments = [0, 1, 2];
      else {
        const options = [0, 1, 2].filter((s) => s !== lastSegment);
        segments = [options[Math.floor(Math.random() * options.length)]];
        lastSegment = segments[0];
      }
      // Urutan muncul rombongan diacak, dengan jeda kecil supaya terasa alami
      const order = [...segments].sort(() => Math.random() - 0.5);
      const babyIndex = pod ? Math.floor(Math.random() * count) : -1;

      const created: Jump[] = segments.map((segment, i) => {
        const baby = i === babyIndex;
        const scale = baby ? 0.68 : rand(0.9, 1.08);
        const size = (mobile ? (pod ? 54 : 70) : 100) * scale;
        const distance = (mobile ? (pod ? 100 : 160) : rand(230, 290)) * (baby ? 0.8 : 1);
        const height = (mobile ? (pod ? 90 : 110) : rand(125, 160)) * (baby ? 0.75 : 1);
        const span = distance + size;
        // Titik keluar acak di dalam bagiannya, dijaga tetap di dalam ombak
        const segStart = pageLeft + segment * segmentWidth;
        const raw = segStart + rand(0, Math.max(0, segmentWidth - span * 0.6));
        const left = Math.min(Math.max(raw, pageLeft + 12), pageLeft + r.width - span - 12);
        return {
          key: nextKey++,
          left,
          surface: r.top + window.scrollY + r.height * SURFACE,
          dir,
          size,
          height,
          distance,
          duration: rand(1.7, 2.1),
          delay: pod ? order.indexOf(segment) * rand(0.12, 0.3) : 0,
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
  }, []);

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

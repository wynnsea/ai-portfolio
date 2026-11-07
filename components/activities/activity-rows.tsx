"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import type { Activity } from "@/lib/activities";
import { ActivityCard } from "@/components/activities/activity-card";

// Minimal kartu per baris supaya baris tetap penuh walau digeser (kegiatan diulang kalau sedikit)
const MIN_PER_ROW = 8;
// Jarak geser selama section melintas layar, dalam persen lebar baris
const SHIFT = 30;
// Miring kecil selang-seling per kartu supaya tidak kaku (lurus lagi saat di-hover)
const CARD_TILTS = ["-rotate-[1.2deg]", "rotate-[1deg]", "-rotate-[0.6deg]", "rotate-[1.4deg]"];

type Item = { activity: Activity; index: number; duplicate: boolean };

function fill(items: { activity: Activity; index: number }[]): Item[] {
  if (!items.length) return [];
  const repeat = Math.max(1, Math.ceil(MIN_PER_ROW / items.length));
  return Array.from({ length: repeat }, (_, r) => items.map((it) => ({ ...it, duplicate: r > 0 }))).flat();
}

function Row({ items, x, reduced }: { items: Item[]; x: MotionValue<string>; reduced: boolean }) {
  return (
    // Baris dimiringkan tipis seperti pita diagonal. Dibuat lebih lebar dari layar (-mx-[6vw])
    // supaya ujung yang miring tidak terlihat terpotong; section induk memakai overflow-hidden.
    <div className="-mx-[6vw] -rotate-[2.5deg]">
      {/* Tanpa gerak (prefers-reduced-motion): baris bisa digeser manual */}
      <div className={`py-4 ${reduced ? "overflow-x-auto" : "overflow-hidden"}`}>
        <motion.div style={reduced ? undefined : { x }} className="flex w-max gap-5 px-6 md:gap-8">
          {items.map((it, i) => (
            <ActivityCard
              key={`${it.activity.title}-${i}`}
              activity={it.activity}
              index={it.index}
              duplicate={it.duplicate}
              tilt={CARD_TILTS[i % CARD_TILTS.length]}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Dua baris foto kegiatan yang bergeser horizontal mengikuti scroll vertikal:
 * baris atas ke kanan, baris bawah ke kiri.
 */
export function ActivityRows({ activities }: { activities: Activity[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const topX = useTransform(scrollYProgress, [0, 1], [`-${SHIFT}%`, "0%"]);
  const bottomX = useTransform(scrollYProgress, [0, 1], ["0%", `-${SHIFT}%`]);

  const indexed = activities.map((activity, index) => ({ activity, index }));
  const top = indexed.filter((_, i) => i % 2 === 0);
  // Satu kegiatan saja: baris bawah memakai kegiatan yang sama
  const bottom = indexed.length > 1 ? indexed.filter((_, i) => i % 2 === 1) : top;

  return (
    <div ref={ref} className="space-y-8 py-6 md:space-y-12 md:py-10">
      <Row items={fill(top)} x={topX} reduced={reduced} />
      <Row items={fill(bottom)} x={bottomX} reduced={reduced} />
    </div>
  );
}

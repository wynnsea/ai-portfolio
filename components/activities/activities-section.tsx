import type { Activity } from "@/lib/activities";
import { Parallax } from "@/components/motion/parallax";
import { Reveal } from "@/components/motion/reveal";
import { ActivityRows } from "@/components/activities/activity-rows";
import { Wave } from "@/components/wave";
import { EmptyState } from "@/components/empty-state";

export function ActivitiesSection({ activities }: { activities: Activity[] }) {
  return (
    <section id="activities" className="relative overflow-hidden bg-white py-28 md:py-40">
      <Wave from="tertiary" />
      {/* Kanji 活動 ("kegiatan") di latar belakang */}
      <Parallax
        offset={220}
        className="text-outline pointer-events-none absolute -left-[4vw] top-[10%] select-none font-jp text-[40vw] leading-none md:text-[28vw]"
      >
        <span aria-hidden>活動</span>
      </Parallax>

      <div className="relative mx-auto max-w-7xl px-6 lg:pl-24">
        <Reveal>
          <p className="mb-6 text-xs uppercase tracking-[0.25em] text-secondary">05 / Di Luar Kerja</p>
        </Reveal>
        <Reveal delay={0.1} className="flex flex-col gap-6 border-b border-line pb-10 md:flex-row md:items-end md:justify-between">
          <h2 className="text-[clamp(3rem,9vw,7rem)] font-light leading-none tracking-[-0.05em]">
            Kegiatan
            <sup className="ml-2 align-top text-lg font-normal tracking-normal text-secondary md:text-2xl">
              ({String(activities.length).padStart(2, "0")})
            </sup>
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-secondary">
            Di luar ngoding, saya ikut program industri, jadi fasilitator, dan aktif di kegiatan kampus. Klik fotonya buat lihat ceritanya.
          </p>
        </Reveal>

        {activities.length === 0 && <EmptyState kanji="活" title="Belum ada kegiatan" className="mt-16 md:mt-24" />}
      </div>

      {/* Baris foto selebar layar (di luar container supaya bisa keluar dari tepi) */}
      {activities.length > 0 && (
        <Reveal className="relative mt-16 md:mt-24">
          <ActivityRows activities={activities} />
        </Reveal>
      )}
    </section>
  );
}

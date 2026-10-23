import type { Project } from "@/lib/projects";
import { Parallax } from "@/components/motion/parallax";
import { Reveal } from "@/components/motion/reveal";
import { ProjectCard, type CardLayout } from "@/components/projects/project-card";
import { Wave } from "@/components/wave";
import { EmptyState } from "@/components/empty-state";

// Susunan "berantakan" yang disengaja: lebar, posisi, rasio, kemiringan, dan kecepatan parallax berbeda.
const layouts: CardLayout[] = [
  { wrap: "w-[92%] md:w-[44%] md:ml-[3%]", aspect: "aspect-[4/5]", offset: 50, rotate: "-rotate-2" },
  { wrap: "w-[84%] ml-auto md:w-[34%] md:mr-[7%] md:-mt-[30%]", aspect: "aspect-square", offset: -60, rotate: "rotate-[2.5deg]" },
  { wrap: "w-[88%] ml-[4%] md:w-[30%] md:ml-[30%] md:mt-[12%]", aspect: "aspect-[3/4]", offset: 90, rotate: "-rotate-1" },
  { wrap: "w-[90%] ml-auto md:w-[40%] md:mr-[1%] md:-mt-[6%]", aspect: "aspect-[4/3]", offset: -40, rotate: "rotate-[1.5deg]" },
  { wrap: "w-[86%] md:w-[36%] md:ml-[6%] md:-mt-[10%]", aspect: "aspect-[4/5]", offset: 80, rotate: "rotate-2" },
  { wrap: "w-[88%] ml-auto md:w-[32%] md:mr-[16%] md:-mt-[2%]", aspect: "aspect-square", offset: -80, rotate: "-rotate-[2.5deg]" },
];

export function ProjectsSection({ projects }: { projects: Project[] }) {
  return (
    <section id="projects" className="relative overflow-hidden bg-white py-28 md:py-40">
      <Wave from="tertiary" />
      {/* Kanji 作品 ("karya") di latar belakang, bergerak lebih lambat */}
      <Parallax
        offset={260}
        className="text-outline pointer-events-none absolute -left-[4vw] top-[20%] select-none font-jp text-[38vw] leading-none"
      >
        <span aria-hidden>作品</span>
      </Parallax>

      <div className="relative mx-auto max-w-7xl px-6 lg:pl-24">
        <Reveal>
          <p className="mb-6 text-xs uppercase tracking-[0.25em] text-secondary">03 / Karya Pilihan</p>
        </Reveal>
        <Reveal delay={0.1} className="flex flex-col gap-6 border-b border-line pb-10 md:flex-row md:items-end md:justify-between">
          <h2 className="text-[clamp(3rem,9vw,7rem)] font-light leading-none tracking-[-0.05em]">
            Proyek<sup className="ml-2 align-top tracking-normal text-lg font-normal text-secondary md:text-2xl">({String(projects.length).padStart(2, "0")})</sup>
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-secondary">
            Kumpulan integrasi AI dan produk web. LLM, API, dan data yang saya rakit jadi tools, banyak yang terinspirasi dari kecintaan saya sama Jepang. Klik kartunya buat lihat cerita lengkapnya.
          </p>
        </Reveal>

        {projects.length === 0 ? (
          <EmptyState kanji="作" title="Belum ada proyek" description="Proyek lagi disiapin, ditunggu ya." className="mt-16 md:mt-24" />
        ) : (
        <div className="mt-24 flex flex-col gap-28 md:mt-36 md:gap-0 md:pb-24">
          {projects.map((project, i) => (
            <ProjectCard key={project.slug} project={project} index={i} layout={layouts[i % layouts.length]} />
          ))}
        </div>
        )}
      </div>
    </section>
  );
}

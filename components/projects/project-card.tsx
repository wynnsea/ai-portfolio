import Link from "next/link";
import type { Project } from "@/lib/projects";
import { Parallax } from "@/components/motion/parallax";
import { Reveal } from "@/components/motion/reveal";
import { ProjectCover } from "@/components/projects/project-cover";

export type CardLayout = {
  /** Lebar & posisi di desktop, sengaja tidak rata agar terkesan acak */
  wrap: string;
  aspect: string;
  /** Kecepatan parallax (px). Nilai berbeda per card = kedalaman berbeda */
  offset: number;
  rotate: string;
};

export function ProjectCard({ project, index, layout }: { project: Project; index: number; layout: CardLayout }) {
  return (
    <Parallax offset={layout.offset} className={`relative hover:z-20 ${layout.wrap}`}>
      <Reveal>
        <Link
          href={`/projects/${project.slug}`}
          className={`group block transition-[rotate,translate] duration-700 ease-expo hover:-translate-y-2 hover:rotate-0 ${layout.rotate}`}
        >
          <div className="relative overflow-hidden shadow-[0_30px_60px_-30px_rgba(34,34,34,0.35)]">
            <div className="transition-transform duration-[1200ms] ease-expo group-hover:scale-[1.06]">
              <ProjectCover project={project} index={index} className={layout.aspect} sizes="(min-width: 768px) 45vw, 90vw" />
            </div>

            {/* Lingkaran "View" muncul saat hover */}
            <span className="pointer-events-none absolute left-1/2 top-1/2 grid size-24 -translate-x-1/2 -translate-y-1/2 scale-0 place-items-center rounded-full bg-white text-xs font-medium uppercase tracking-[0.2em] text-primary transition-transform duration-500 ease-expo group-hover:scale-100">
              View
            </span>
          </div>

          <div className="mt-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-secondary">
                {String(index + 1).padStart(2, "0")} · {project.category} · {project.year}
              </p>
              <h3 className="mt-1.5 text-2xl font-light tracking-tight md:text-3xl">{project.title}</h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-secondary">{project.summary}</p>
            </div>
            <span
              aria-hidden
              className="mt-1 grid size-10 shrink-0 place-items-center rounded-full border border-line transition-all duration-500 ease-expo group-hover:rotate-45 group-hover:border-primary group-hover:bg-primary group-hover:text-white"
            >
              ↗
            </span>
          </div>
        </Link>
      </Reveal>
    </Parallax>
  );
}

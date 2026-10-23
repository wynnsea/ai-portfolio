import Image from "next/image";
import type { Project } from "@/lib/projects";

/** Data minimal untuk membuat cover, dipakai oleh proyek maupun artikel blog. */
export type CoverSource = Pick<Project, "title" | "titleJp" | "kanji" | "tone" | "category" | "cover">;

const tones = {
  dark: { bg: "bg-primary", chip: "bg-primary", kanji: "text-white/90", sub: "text-white/45", line: "rgba(255,255,255,0.06)", ring: "border-white/25" },
  mid: { bg: "bg-secondary", chip: "bg-secondary", kanji: "text-white", sub: "text-white/60", line: "rgba(255,255,255,0.09)", ring: "border-white/35" },
  light: { bg: "bg-tertiary", chip: "bg-tertiary", kanji: "text-primary", sub: "text-secondary", line: "rgba(42,86,119,0.06)", ring: "border-primary/20" },
} as const;

// Posisi kanji berbeda-beda agar tiap cover terasa unik
const placements = [
  "-bottom-[12%] -right-[6%] text-[115cqmin]",
  "top-[4%] -left-[8%] text-[105cqmin]",
  "-bottom-[18%] left-[10%] text-[120cqmin]",
];

type ProjectCoverProps = {
  project: CoverSource;
  index: number;
  variant?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

/** Cover: foto jika `project.cover` diisi, jika tidak berupa artwork kanji monokrom. */
export function ProjectCover({ project, index, variant = index, className = "", sizes = "50vw", priority }: ProjectCoverProps) {
  if (project.cover) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image src={project.cover} alt={project.title} fill sizes={sizes} priority={priority} unoptimized className="object-cover grayscale" />
      </div>
    );
  }

  const t = tones[project.tone];
  const number = String(index + 1).padStart(2, "0");

  return (
    <div
      aria-hidden
      className={`relative overflow-hidden [container-type:size] ${t.bg} ${className}`}
      style={{
        backgroundImage: `linear-gradient(${t.line} 1px, transparent 1px), linear-gradient(90deg, ${t.line} 1px, transparent 1px)`,
        backgroundSize: "8cqmin 8cqmin",
      }}
    >
      <span className={`absolute select-none font-jp leading-none ${t.kanji} ${placements[variant % placements.length]}`}>
        {project.kanji}
      </span>

      <span className={`absolute right-[5cqmin] top-[5cqmin] z-10 py-[1.5cqmin] font-jp text-[3.6cqmin] tracking-[0.3em] [writing-mode:vertical-rl] ${t.chip} ${t.sub}`}>
        {project.titleJp}
      </span>

      <span className={`absolute left-[5cqmin] top-[5cqmin] z-10 grid size-[12cqmin] place-items-center rounded-full border text-[3.4cqmin] ${t.chip} ${t.ring} ${t.sub}`}>
        {number}
      </span>

      <span className={`absolute bottom-[5cqmin] left-[5cqmin] z-10 rounded-full px-[2.5cqmin] py-[1.2cqmin] text-[3cqmin] uppercase tracking-[0.25em] ${t.chip} ${t.sub}`}>
        {project.category}
      </span>
    </div>
  );
}

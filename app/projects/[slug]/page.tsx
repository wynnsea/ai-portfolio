import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getNextProject, getProject, projects } from "@/lib/projects";
import { Parallax } from "@/components/motion/parallax";
import { ParallaxMedia } from "@/components/motion/parallax-media";
import { Reveal } from "@/components/motion/reveal";
import { ProjectCover } from "@/components/projects/project-cover";
import { ContactFooter } from "@/components/contact-footer";
import { ProjectExplainer } from "@/components/ai/project-explainer";

// Semua halaman proyek di-prerender saat build (wajib minimal satu param saat Cache Components aktif)
export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  return project ? { title: project.title, description: project.summary } : {};
}

function SectionLabel({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <p className="text-xs uppercase tracking-[0.25em] text-secondary">
      ({n}) {children}
    </p>
  );
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const index = projects.findIndex((p) => p.slug === slug);
  const next = getNextProject(slug);
  const nextIndex = projects.findIndex((p) => p.slug === next.slug);

  const meta = [
    { label: "Tahun", value: project.year },
    { label: "Peran", value: project.role },
    { label: "Durasi", value: project.duration },
    { label: "Kategori", value: project.category },
  ];

  return (
    <>
      <main className="bg-white">
        {/* Header */}
        <section className="relative overflow-hidden pb-16 pt-32 md:pb-24 md:pt-40">
          <Parallax
            offset={160}
            className="text-outline pointer-events-none absolute -right-[4vw] -top-[4vw] select-none font-jp text-[50vw] leading-none md:text-[36vw]"
          >
            <span aria-hidden>{project.kanji}</span>
          </Parallax>

          <div className="relative mx-auto max-w-7xl px-6 lg:pl-24">
            <Reveal className="flex items-center justify-between text-sm">
              <Link href="/#projects" className="group inline-flex items-center gap-2 text-secondary transition-colors hover:text-primary">
                <span aria-hidden className="transition-transform duration-500 ease-expo group-hover:-translate-x-1">←</span> Semua proyek
              </Link>
              <span className="text-secondary">
                Project {String(index + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
              </span>
            </Reveal>

            <Reveal delay={0.1}>
              <p className="mt-16 font-jp text-lg text-secondary md:mt-24">{project.titleJp}</p>
              <h1 className="mt-2 text-[clamp(3.5rem,12vw,10rem)] font-[250] leading-[0.9] tracking-[-0.06em]">{project.title}</h1>
            </Reveal>

            <Reveal delay={0.2}>
              <p className="mt-8 max-w-3xl text-xl font-light leading-snug tracking-tight md:text-3xl">{project.summary}</p>
            </Reveal>

            <Reveal delay={0.3} className="mt-14 grid grid-cols-2 gap-6 md:grid-cols-4">
              {meta.map((m) => (
                <div key={m.label} className="border-t border-primary pt-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-secondary">{m.label}</p>
                  <p className="mt-2 text-sm md:text-base">{m.value}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* Cover besar dengan parallax di dalam bingkai */}
        <Reveal className="mx-auto max-w-7xl px-6 lg:pl-24">
          <ParallaxMedia className="h-[60svh] md:h-[80svh]">
            <ProjectCover project={project} index={index} variant={0} className="h-full w-full" sizes="100vw" priority />
          </ParallaxMedia>
        </Reveal>

        {/* Overview & challenge */}
        <section className="mx-auto max-w-7xl space-y-24 px-6 py-28 md:py-40 lg:pl-24">
          <Reveal>
            <ProjectExplainer slug={project.slug} />
          </Reveal>

          <Reveal className="grid gap-6 md:grid-cols-12">
            <div className="md:col-span-4">
              <SectionLabel n="01">Gambaran umum</SectionLabel>
            </div>
            <p className="text-xl font-light leading-relaxed tracking-tight md:col-span-8 md:text-2xl">{project.overview}</p>
          </Reveal>

          <Reveal className="grid gap-6 md:grid-cols-12">
            <div className="md:col-span-4">
              <SectionLabel n="02">Tantangan</SectionLabel>
            </div>
            <p className="text-base leading-relaxed text-secondary md:col-span-8 md:text-lg">{project.challenge}</p>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-12">
            <Reveal className="md:col-span-4">
              <SectionLabel n="03">Pendekatan</SectionLabel>
            </Reveal>
            <ol className="md:col-span-8">
              {project.approach.map((step, i) => (
                <Reveal key={i} delay={i * 0.05}>
                  <li className="flex gap-6 border-b border-line py-6">
                    <span className="w-8 shrink-0 text-sm text-secondary">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-base leading-relaxed md:text-lg">{step}</span>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* Hasil: kartu angka dengan parallax berbeda */}
        <section className="bg-tertiary py-28 md:py-40">
          <div className="mx-auto max-w-7xl px-6 lg:pl-24">
            <Reveal>
              <SectionLabel n="04">Hasil</SectionLabel>
            </Reveal>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {project.results.map((r, i) => (
                <Parallax key={r.value} offset={[30, -40, 60][i % 3]}>
                  <Reveal delay={i * 0.1}>
                    <div className={`flex aspect-[4/3] flex-col justify-between p-6 md:p-8 ${i === 1 ? "bg-primary text-white" : "bg-white"}`}>
                      <span className="text-xs opacity-50">{String(i + 1).padStart(2, "0")}</span>
                      <div>
                        <p className="text-[clamp(3rem,6vw,5rem)] font-[250] leading-none tracking-[-0.05em]">{r.value}</p>
                        <p className={`mt-3 text-sm ${i === 1 ? "text-white/60" : "text-secondary"}`}>{r.label}</p>
                      </div>
                    </div>
                  </Reveal>
                </Parallax>
              ))}
            </div>
          </div>
        </section>

        {/* Galeri (dummy): susunan acak dengan parallax */}
        <section className="relative overflow-hidden py-28 md:py-40">
          <div className="mx-auto max-w-7xl px-6 lg:pl-24">
            <Reveal>
              <SectionLabel n="05">Galeri</SectionLabel>
            </Reveal>
            <div className="mt-12 flex flex-col gap-10 md:block">
              <Parallax offset={50} className="md:w-[58%]">
                <Reveal>
                  <ProjectCover project={project} index={index} variant={1} className="aspect-[16/10] w-full" />
                </Reveal>
              </Parallax>
              <Parallax offset={-90} className="w-[80%] self-end md:-mt-[18%] md:ml-auto md:w-[36%]">
                <Reveal delay={0.1}>
                  <ProjectCover project={project} index={index} variant={2} className="aspect-[3/4] w-full" />
                </Reveal>
              </Parallax>
            </div>
          </div>
        </section>

        {/* Tech stack & link */}
        <section className="mx-auto max-w-7xl px-6 pb-28 md:pb-40 lg:pl-24">
          <Reveal className="grid gap-10 border-t border-line pt-10 md:grid-cols-12">
            <div className="md:col-span-4">
              <SectionLabel n="06">Teknologi</SectionLabel>
            </div>
            <div className="md:col-span-8">
              <ul className="flex flex-wrap gap-2">
                {project.stack.map((s) => (
                  <li key={s} className="rounded-full border border-line px-4 py-2 text-sm">
                    {s}
                  </li>
                ))}
              </ul>
              <div className="mt-10 flex flex-wrap gap-3">
                {project.links.demo && (
                  <a href={project.links.demo} className="rounded-full bg-primary px-6 py-3 text-sm text-white transition-opacity hover:opacity-80">
                    Demo langsung ↗
                  </a>
                )}
                {project.links.source && (
                  <a href={project.links.source} className="rounded-full border border-primary px-6 py-3 text-sm transition-colors hover:bg-primary hover:text-white">
                    Kode sumber ↗
                  </a>
                )}
              </div>
            </div>
          </Reveal>
        </section>

        {/* Proyek berikutnya */}
        <Link href={`/projects/${next.slug}`} className="group block border-t border-line">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-24 md:grid-cols-12 md:py-32 lg:pl-24">
            <div className="md:col-span-8">
              <p className="text-xs uppercase tracking-[0.25em] text-secondary">Proyek berikutnya</p>
              <p className="mt-4 text-[clamp(3rem,9vw,7.5rem)] font-[250] leading-[0.95] tracking-[-0.05em] transition-transform duration-700 ease-expo group-hover:translate-x-3">
                {next.title} <span className="inline-block transition-transform duration-700 ease-expo group-hover:rotate-45">↗</span>
              </p>
            </div>
            <div className="overflow-hidden md:col-span-4">
              <div className="transition-transform duration-[1200ms] ease-expo group-hover:scale-105">
                <ProjectCover project={next} index={nextIndex} className="aspect-[4/3] w-full" sizes="30vw" />
              </div>
            </div>
          </div>
        </Link>
      </main>
      <ContactFooter />
    </>
  );
}

import Link from "next/link";
import { formatDate, type Post } from "@/lib/posts";
import { Parallax } from "@/components/motion/parallax";
import { ParallaxMedia } from "@/components/motion/parallax-media";
import { Reveal } from "@/components/motion/reveal";
import { ProjectCover } from "@/components/projects/project-cover";
import { BlogList } from "@/components/blog/blog-list";
import { Wave } from "@/components/wave";
import { EmptyState } from "@/components/empty-state";

export function BlogSection({ posts }: { posts: Post[] }) {
  const [featured, ...rest] = posts;

  return (
    <section id="blog" className="relative overflow-hidden bg-tertiary py-28 md:py-40">
      <Wave from="white" />
      {/* Kanji 書 ("menulis") di latar belakang */}
      <Parallax
        offset={220}
        className="text-outline pointer-events-none absolute -right-[4vw] top-[4%] select-none font-jp text-[46vw] leading-none md:text-[32vw]"
      >
        <span aria-hidden>書</span>
      </Parallax>

      <div className="relative mx-auto max-w-7xl px-6 lg:pl-24">
        <Reveal>
          <p className="mb-6 text-xs uppercase tracking-[0.25em] text-secondary">06 / Tulisan</p>
        </Reveal>
        <Reveal delay={0.1} className="flex flex-col gap-6 border-b border-line pb-10 md:flex-row md:items-end md:justify-between">
          <h2 className="text-[clamp(3rem,9vw,7rem)] font-light leading-none tracking-[-0.05em]">
            Blog<sup className="ml-2 align-top text-lg font-normal tracking-normal text-secondary md:text-2xl">({String(posts.length).padStart(2, "0")})</sup>
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-secondary">
            Catatan soal integrasi AI ke produk nyata, cerita perjalanan karier, dan sedikit budaya Jepang di sela-selanya.
          </p>
        </Reveal>

        {featured ? (
          <>
        {/* Artikel terbaru */}
        <Link href={`/blog/${featured.slug}`} className="group mt-16 grid items-center gap-8 md:mt-24 md:grid-cols-12 md:gap-12">
          <Reveal className="md:col-span-7">
            <div className="relative overflow-hidden">
              <ParallaxMedia className="aspect-[16/10]">
                <div className="h-full w-full transition-transform duration-[1200ms] ease-expo group-hover:scale-105">
                  <ProjectCover project={featured} index={0} className="h-full w-full" sizes="(min-width: 768px) 55vw, 90vw" />
                </div>
              </ParallaxMedia>
              <span className="absolute bottom-4 right-4 rounded-full bg-white px-3 py-1 text-xs font-medium">Terbaru</span>
            </div>
          </Reveal>
          <Reveal delay={0.1} className="md:col-span-5">
            <p className="text-xs text-secondary">
              {featured.category} · {formatDate(featured.date)} · {featured.readTime}
            </p>
            <h3 className="mt-4 text-3xl font-light leading-tight tracking-[-0.03em] md:text-5xl">{featured.title}</h3>
            <p className="mt-5 leading-relaxed text-secondary">{featured.excerpt}</p>
            <span className="mt-8 inline-flex items-center gap-2 border-b border-primary pb-0.5 text-sm font-medium">
              Baca artikel <span aria-hidden className="transition-transform duration-500 ease-expo group-hover:translate-x-1">→</span>
            </span>
          </Reveal>
        </Link>

        <div className="mt-20 md:mt-28">
          <BlogList posts={rest} startIndex={1} />
        </div>
          </>
        ) : (
          <EmptyState
            kanji="書"
            title="Belum ada artikel"
            description="Tulisan pertama lagi disiapin. Nanti isinya soal integrasi AI, cerita karier, dan budaya Jepang."
            className="mt-16 md:mt-24"
          />
        )}
      </div>
    </section>
  );
}

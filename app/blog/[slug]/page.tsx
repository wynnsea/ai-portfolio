import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, getPost, posts, sortedPosts, type PostBlock } from "@/lib/posts";
import { site } from "@/lib/site";
import { Parallax } from "@/components/motion/parallax";
import { ParallaxMedia } from "@/components/motion/parallax-media";
import { Reveal } from "@/components/motion/reveal";
import { ProjectCover } from "@/components/projects/project-cover";
import { ReadingProgress } from "@/components/blog/reading-progress";
import { ContactFooter } from "@/components/contact-footer";
import { TldrBox } from "@/components/ai/tldr-box";

// Semua artikel di-prerender saat build
export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  return post ? { title: post.title, description: post.excerpt } : {};
}

function Block({ block }: { block: PostBlock }) {
  switch (block.type) {
    case "h2":
      return <h2 className="pt-6 text-2xl font-normal tracking-tight md:text-3xl">{block.text}</h2>;
    case "quote":
      return (
        <blockquote className="my-4 border-l-2 border-primary py-2 pl-6 text-2xl font-light leading-snug tracking-tight md:text-3xl">
          {block.text}
        </blockquote>
      );
    case "list":
      return (
        <ul className="space-y-3">
          {block.items.map((item) => (
            <li key={item} className="flex gap-4 text-secondary">
              <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />
              {item}
            </li>
          ))}
        </ul>
      );
    case "code":
      return (
        <pre data-lenis-prevent className="overflow-x-auto rounded-xl bg-primary p-6 text-sm leading-relaxed text-white/90">
          <code>{block.code}</code>
        </pre>
      );
    default:
      return <p className="text-secondary">{block.text}</p>;
  }
}

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const index = sortedPosts.findIndex((p) => p.slug === slug);
  const more = sortedPosts.filter((p) => p.slug !== slug).slice(0, 2);

  return (
    <>
      <ReadingProgress />
      <main className="bg-white">
        {/* Header artikel */}
        <section className="relative overflow-hidden pb-14 pt-32 md:pb-20 md:pt-40">
          <Parallax
            offset={140}
            className="text-outline pointer-events-none absolute -right-[4vw] -top-[2vw] select-none font-jp text-[50vw] leading-none md:text-[32vw]"
          >
            <span aria-hidden>{post.kanji}</span>
          </Parallax>

          <div className="relative mx-auto max-w-4xl px-6">
            <Reveal className="flex items-center justify-between text-sm">
              <Link href="/#blog" className="group inline-flex items-center gap-2 text-secondary transition-colors hover:text-primary">
                <span aria-hidden className="transition-transform duration-500 ease-expo group-hover:-translate-x-1">←</span> Semua artikel
              </Link>
              <span className="font-jp text-secondary">{post.titleJp}</span>
            </Reveal>

            <Reveal delay={0.1}>
              <p className="mt-16 text-xs uppercase tracking-[0.25em] text-secondary md:mt-20">{post.category}</p>
              <h1 className="mt-4 text-[clamp(2.5rem,6.5vw,5rem)] font-[250] leading-[1.02] tracking-[-0.045em]">{post.title}</h1>
            </Reveal>

            <Reveal delay={0.2} className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-line pt-6 text-sm">
              <span>
                by <span className="font-medium">{site.name}</span>
              </span>
              <time dateTime={post.date} className="text-secondary">
                {formatDate(post.date)}
              </time>
              <span className="text-secondary">{post.readTime}</span>
            </Reveal>
          </div>
        </section>

        {/* Cover */}
        <Reveal className="mx-auto max-w-6xl px-6">
          <ParallaxMedia className="aspect-[16/9] md:aspect-[21/9]">
            <ProjectCover project={post} index={index} variant={1} className="h-full w-full" sizes="100vw" priority />
          </ParallaxMedia>
        </Reveal>

        {/* Isi artikel */}
        <article className="mx-auto max-w-2xl px-6 py-20 md:py-28">
          <Reveal className="mb-12">
            <TldrBox slug={post.slug} />
          </Reveal>
          <Reveal>
            <p className="text-xl font-light leading-relaxed tracking-tight md:text-2xl">{post.excerpt}</p>
          </Reveal>
          <div className="mt-10 space-y-6 text-base leading-[1.8] md:text-lg">
            {post.content.map((block, i) => (
              <Reveal key={i}>
                <Block block={block} />
              </Reveal>
            ))}
          </div>
        </article>

        {/* Artikel lain */}
        <section className="border-t border-line bg-tertiary py-24 md:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:pl-24">
            <Reveal>
              <p className="text-xs uppercase tracking-[0.25em] text-secondary">Baca juga</p>
            </Reveal>
            <div className="mt-10 grid gap-12 md:grid-cols-2 md:gap-10">
              {more.map((p, i) => (
                <Parallax key={p.slug} offset={i === 0 ? 30 : -50} className={i === 1 ? "md:mt-24" : ""}>
                  <Reveal delay={i * 0.1}>
                    <Link href={`/blog/${p.slug}`} className="group block">
                      <div className="overflow-hidden">
                        <div className="transition-transform duration-[1200ms] ease-expo group-hover:scale-105">
                          <ProjectCover project={p} index={sortedPosts.indexOf(p)} className="aspect-[16/10] w-full" sizes="(min-width: 768px) 45vw, 90vw" />
                        </div>
                      </div>
                      <p className="mt-5 text-xs text-secondary">
                        {p.category} · {formatDate(p.date)}
                      </p>
                      <h3 className="mt-2 text-2xl font-light leading-snug tracking-tight md:text-3xl">{p.title}</h3>
                    </Link>
                  </Reveal>
                </Parallax>
              ))}
            </div>
          </div>
        </section>
      </main>
      <ContactFooter />
    </>
  );
}

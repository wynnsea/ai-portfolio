"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import { formatDate, type Post } from "@/lib/posts";
import { ProjectCover } from "@/components/projects/project-cover";

const ease = [0.16, 1, 0.3, 1] as const;

/** Daftar artikel. Di desktop, cover artikel melayang mengikuti kursor saat baris di-hover. */
export function BlogList({ posts, startIndex = 0 }: { posts: Post[]; startIndex?: number }) {
  const [active, setActive] = useState<number | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 25, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 200, damping: 25, mass: 0.4 });

  return (
    <div
      className="relative"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - rect.left);
        y.set(e.clientY - rect.top);
      }}
      onMouseLeave={() => setActive(null)}
    >
      <ul className="border-t border-line">
        {posts.map((post, i) => (
          <motion.li
            key={post.slug}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.9, ease, delay: i * 0.06 }}
            onMouseEnter={() => setActive(i)}
            className="border-b border-line"
          >
            <Link
              href={`/blog/${post.slug}`}
              className={`group grid grid-cols-[auto_1fr_auto] items-center gap-4 py-7 transition-opacity duration-500 md:grid-cols-12 md:gap-6 md:py-9 ${
                active !== null && active !== i ? "md:opacity-30" : ""
              }`}
            >
              <span className="text-xs text-secondary md:col-span-1">{String(startIndex + i + 1).padStart(2, "0")}</span>
              <div className="md:col-span-6">
                <h3 className="text-xl font-light leading-snug tracking-tight transition-transform duration-700 ease-expo md:text-3xl md:group-hover:translate-x-3">
                  {post.title}
                </h3>
                <p className="mt-2 text-xs text-secondary md:hidden">
                  {post.category} · {formatDate(post.date)}
                </p>
              </div>
              <span className="hidden text-sm text-secondary md:col-span-2 md:block">{post.category}</span>
              <span className="hidden whitespace-nowrap text-sm text-secondary md:col-span-2 md:block">{formatDate(post.date)}</span>
              <span
                aria-hidden
                className="grid size-9 place-items-center justify-self-end rounded-full border border-line transition-all duration-500 ease-expo group-hover:rotate-45 group-hover:border-primary group-hover:bg-primary group-hover:text-white md:col-span-1"
              >
                ↗
              </span>
            </Link>
          </motion.li>
        ))}
      </ul>

      {/* Preview cover yang mengikuti kursor (desktop saja) */}
      <motion.div
        aria-hidden
        style={{ x: sx, y: sy }}
        className="pointer-events-none absolute left-0 top-0 z-10 hidden md:block"
      >
        <AnimatePresence>
          {active !== null && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.6, rotate: -6 }}
              animate={{ opacity: 1, scale: 1, rotate: -3 }}
              exit={{ opacity: 0, scale: 0.6, rotate: -6 }}
              transition={{ duration: 0.4, ease }}
              className="-translate-x-1/2 -translate-y-1/2 overflow-hidden shadow-[0_30px_60px_-20px_rgba(34,34,34,0.45)]"
            >
              <ProjectCover project={posts[active]} index={startIndex + active} className="aspect-[4/3] w-72" sizes="288px" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

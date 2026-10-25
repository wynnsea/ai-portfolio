import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getPublicPosts, getPublicProjects } from "@/lib/public-api";
import { siteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();

  const [projects, posts] = await Promise.all([getPublicProjects(), getPublicPosts()]);
  const base = siteUrl.toString().replace(/\/$/, "");

  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    ...projects.map((project) => ({
      url: `${base}/projects/${encodeURIComponent(project.slug)}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...posts.map((post) => ({
      url: `${base}/blog/${encodeURIComponent(post.slug)}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}

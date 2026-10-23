import type { Activity } from "@/lib/activities";
import type { Certification } from "@/lib/certifications";
import type { Post } from "@/lib/posts";
import type { Project } from "@/lib/projects";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

export type SiteSettings = {
  brand: string;
  name: string;
  nameJp: string | null;
  role: string;
  description: string;
  location: string;
  email: string;
  photoUrl: string | null;
  cvUrl: string | null;
  availability: { open: boolean; label: string | null; detail: string | null };
  socials: { label: string; href: string }[];
  features: { chatbot: boolean; preloader: boolean };
};

type ApiResponse<T> = { data: T };

class PublicApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "PublicApiError";
  }
}

async function fetchPublic<T>(path: string): Promise<T> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL belum dikonfigurasi.");
  }

  const response = await fetch(`${API_URL}${path}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new PublicApiError(`Gagal memuat data portfolio dari API (${response.status} ${path}).`, response.status);
  }

  const result = (await response.json()) as ApiResponse<T>;
  return result.data;
}

type ApiProject = Omit<Project, "cover"> & {
  coverUrl: string | null;
};

type ApiCertification = Omit<Certification, "cover"> & {
  coverUrl: string | null;
};

type ApiActivity = Activity;

type ApiPost = Omit<Post, "cover"> & {
  coverUrl: string | null;
};

export async function getPublicProjects(): Promise<Project[]> {
  const projects = await fetchPublic<ApiProject[]>("/projects");
  return projects.map(({ coverUrl, ...project }) => ({ ...project, cover: coverUrl ?? undefined }));
}

export async function getPublicProject(slug: string): Promise<Project | null> {
  try {
    const { coverUrl, ...project } = await fetchPublic<ApiProject>(`/projects/${encodeURIComponent(slug)}`);
    return { ...project, cover: coverUrl ?? undefined };
  } catch (error) {
    if (error instanceof PublicApiError && error.status === 404) return null;
    throw error;
  }
}

export async function getPublicCertifications(): Promise<Certification[]> {
  const certifications = await fetchPublic<ApiCertification[]>("/certifications");
  return certifications.map(({ coverUrl, ...certification }) => ({ ...certification, cover: coverUrl ?? undefined }));
}

export async function getPublicActivities(): Promise<Activity[]> {
  return fetchPublic<ApiActivity[]>("/activities");
}

export async function getPublicPosts(): Promise<Post[]> {
  const posts = await fetchPublic<ApiPost[]>("/posts");
  return posts
    .map(({ coverUrl, ...post }) => ({ ...post, content: post.content ?? [], cover: coverUrl ?? undefined }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getPublicPost(slug: string): Promise<Post | null> {
  try {
    const { coverUrl, ...post } = await fetchPublic<ApiPost>(`/posts/${encodeURIComponent(slug)}`);
    return { ...post, content: post.content ?? [], cover: coverUrl ?? undefined };
  } catch (error) {
    if (error instanceof PublicApiError && error.status === 404) return null;
    throw error;
  }
}

export async function getPublicSettings(): Promise<SiteSettings> {
  return fetchPublic<SiteSettings>("/settings");
}

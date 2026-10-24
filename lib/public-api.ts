// Data publik website, dibaca langsung dari Supabase.
// Nama fungsi dan bentuk hasil sengaja sama dengan versi Laravel sebelumnya,
// jadi halaman dan komponen yang memakainya tidak perlu diubah.
// Yang boleh dibaca (mis. hanya proyek berstatus Terbit) diatur oleh RLS di database.
import type { Activity } from "@/lib/activities";
import type { Certification } from "@/lib/certifications";
import type { Post, PostBlock } from "@/lib/posts";
import type { CoverTone, Project } from "@/lib/projects";
import { getPublicClient } from "@/lib/supabase/client";

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

// ---------------------------------------------------------------------------
// Bentuk baris di database (snake_case) → tipe yang dipakai komponen (camelCase)
// ---------------------------------------------------------------------------

type ProjectRow = {
  slug: string;
  title: string;
  title_jp: string;
  kanji: string;
  tone: CoverTone;
  category: string;
  year: string;
  role: string;
  duration: string;
  summary: string;
  overview: string;
  challenge: string;
  approach: string[];
  results: Project["results"];
  stack: string[];
  links: Project["links"];
  cover_url: string | null;
};

type CertificationRow = {
  title: string;
  title_jp: string;
  kanji: string;
  tone: CoverTone;
  category: string;
  issuer: string;
  year: string | null;
  score: string | null;
  note: string | null;
  credential_url: string | null;
  cover_url: string | null;
};

type ActivityRow = {
  title: string;
  role: string;
  organizer: string;
  year: string | null;
  description: string;
  title_jp: string;
  kanji: string;
  tone: CoverTone;
  category: string;
  photos: string[];
  focus: string | null;
};

type PostRow = {
  slug: string;
  title: string;
  title_jp: string;
  kanji: string;
  tone: CoverTone;
  category: string;
  date: string;
  read_time: string;
  excerpt: string;
  content: PostBlock[] | null;
  cover_url: string | null;
};

type SettingsRow = {
  brand: string;
  name: string;
  name_jp: string | null;
  role: string;
  description: string;
  location: string;
  email: string;
  photo_url: string | null;
  cv_url: string | null;
  availability: SiteSettings["availability"];
  socials: SiteSettings["socials"];
  features: SiteSettings["features"];
};

const toProject = (r: ProjectRow): Project => ({
  slug: r.slug,
  title: r.title,
  titleJp: r.title_jp,
  kanji: r.kanji,
  tone: r.tone,
  category: r.category,
  year: r.year,
  role: r.role,
  duration: r.duration,
  summary: r.summary,
  overview: r.overview,
  challenge: r.challenge,
  approach: r.approach ?? [],
  results: r.results ?? [],
  stack: r.stack ?? [],
  links: r.links ?? {},
  cover: r.cover_url ?? undefined,
});

const toCertification = (r: CertificationRow): Certification => ({
  title: r.title,
  titleJp: r.title_jp,
  kanji: r.kanji,
  tone: r.tone,
  category: r.category,
  issuer: r.issuer,
  year: r.year ?? undefined,
  score: r.score ?? undefined,
  note: r.note ?? undefined,
  credentialUrl: r.credential_url ?? undefined,
  cover: r.cover_url ?? undefined,
});

const toActivity = (r: ActivityRow): Activity => ({
  title: r.title,
  role: r.role,
  organizer: r.organizer,
  year: r.year ?? undefined,
  description: r.description,
  titleJp: r.title_jp,
  kanji: r.kanji,
  tone: r.tone,
  category: r.category,
  photos: r.photos?.length ? r.photos : undefined,
  focus: r.focus ?? undefined,
});

const toPost = (r: PostRow): Post => ({
  slug: r.slug,
  title: r.title,
  titleJp: r.title_jp,
  kanji: r.kanji,
  tone: r.tone,
  category: r.category,
  date: r.date,
  readTime: r.read_time,
  excerpt: r.excerpt,
  content: r.content ?? [],
  cover: r.cover_url ?? undefined,
});

const toSettings = (r: SettingsRow): SiteSettings => ({
  brand: r.brand,
  name: r.name,
  nameJp: r.name_jp,
  role: r.role,
  description: r.description,
  location: r.location,
  email: r.email,
  photoUrl: r.photo_url,
  cvUrl: r.cv_url,
  availability: r.availability,
  socials: r.socials ?? [],
  features: r.features,
});

function fail(what: string, error: { message: string }): never {
  throw new Error(`Gagal memuat ${what} dari Supabase: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Fungsi publik
// ---------------------------------------------------------------------------

export async function getPublicProjects(): Promise<Project[]> {
  const { data, error } = await getPublicClient().from("projects").select("*").order("id");
  if (error) fail("proyek", error);
  return (data as ProjectRow[]).map(toProject);
}

export async function getPublicProject(slug: string): Promise<Project | null> {
  const { data, error } = await getPublicClient().from("projects").select("*").eq("slug", slug).maybeSingle();
  if (error) fail("proyek", error);
  return data ? toProject(data as ProjectRow) : null;
}

export async function getPublicCertifications(): Promise<Certification[]> {
  const { data, error } = await getPublicClient().from("certifications").select("*").order("id");
  if (error) fail("sertifikasi", error);
  return (data as CertificationRow[]).map(toCertification);
}

export async function getPublicActivities(): Promise<Activity[]> {
  const { data, error } = await getPublicClient().from("activities").select("*").order("id");
  if (error) fail("kegiatan", error);
  return (data as ActivityRow[]).map(toActivity);
}

export async function getPublicPosts(): Promise<Post[]> {
  const { data, error } = await getPublicClient().from("posts").select("*").order("date", { ascending: false });
  if (error) fail("artikel", error);
  return (data as PostRow[]).map(toPost);
}

export async function getPublicPost(slug: string): Promise<Post | null> {
  const { data, error } = await getPublicClient().from("posts").select("*").eq("slug", slug).maybeSingle();
  if (error) fail("artikel", error);
  return data ? toPost(data as PostRow) : null;
}

export async function getPublicSettings(): Promise<SiteSettings> {
  const { data, error } = await getPublicClient().from("settings").select("*").eq("id", 1).single();
  if (error) fail("pengaturan", error);
  return toSettings(data as SettingsRow);
}

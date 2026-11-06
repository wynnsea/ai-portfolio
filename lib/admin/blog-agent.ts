// Akses data Agen Blog dari panel admin (browser). Baca/tulis biasa lewat Supabase + RLS admin;
// aksi yang memanggil AI (buat draft, revisi) lewat /api/admin/blog-agent dengan token sesi.
import type { PostBlock } from "@/lib/posts";
import { getAdminClient } from "@/lib/supabase/client";

const db = () => getAdminClient();

export type AgentSettings = {
  enabled: boolean;
  interval_days: number;
  default_category: string;
  tone: string;
  target_words: number;
  last_run_at: string | null;
  last_status: string | null;
  last_error: string | null;
  running_since: string | null;
};

export type BlogIdea = { id: number; title: string; notes: string; status: "Antri" | "Dipakai" | "Dilewati"; created_at: string };

export type AiDraft = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  read_time: string;
  status: string;
  content: PostBlock[];
  seo_title: string | null;
  meta_description: string | null;
  keywords: string[];
  ai_notes: string[];
  ai_revisions: { at: string; type: "generate" | "revise"; feedback?: string; model?: string }[];
};

function fail(message: string | undefined): never {
  throw new Error(message || "Terjadi kesalahan.");
}

export async function getAgentSettings(): Promise<AgentSettings> {
  const { data, error } = await db().from("blog_agent_settings").select("*").eq("id", 1).maybeSingle();
  if (error) fail(error.message);
  if (!data) fail("Pengaturan agen belum ada. Jalankan migration 20261106030000_blog_agent.sql di Supabase.");
  return data as AgentSettings;
}

export async function saveAgentSettings(
  settings: Pick<AgentSettings, "enabled" | "interval_days" | "default_category" | "tone" | "target_words">,
): Promise<AgentSettings> {
  const { data, error } = await db().from("blog_agent_settings").update(settings).eq("id", 1).select("*").single();
  if (error) fail(error.message);
  return data as AgentSettings;
}

export async function listIdeas(): Promise<BlogIdea[]> {
  const { data, error } = await db().from("blog_ideas").select("*").order("created_at", { ascending: false }).limit(50);
  if (error) fail(error.message);
  return (data ?? []) as BlogIdea[];
}

export async function addIdea(title: string, notes: string): Promise<void> {
  const { error } = await db().from("blog_ideas").insert({ title: title.trim(), notes: notes.trim() });
  if (error) fail(error.message);
}

export async function deleteIdea(id: number): Promise<void> {
  const { error } = await db().from("blog_ideas").delete().eq("id", id);
  if (error) fail(error.message);
}

export async function listAiDrafts(): Promise<AiDraft[]> {
  const { data, error } = await db()
    .from("posts")
    .select("id, slug, title, excerpt, category, date, read_time, status, content, seo_title, meta_description, keywords, ai_notes, ai_revisions")
    .eq("ai_generated", true)
    .eq("status", "Draft")
    .order("created_at", { ascending: false });
  if (error) fail(error.message);
  return (data ?? []) as AiDraft[];
}

export async function publishPost(id: number): Promise<void> {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
  const { error } = await db().from("posts").update({ status: "Terbit", date: today }).eq("id", id);
  if (error) fail(error.message);
}

export async function archivePost(id: number): Promise<void> {
  const { error } = await db().from("posts").update({ status: "Arsip" }).eq("id", id);
  if (error) fail(error.message);
}

async function callAgent<T>(payload: Record<string, unknown>): Promise<T> {
  const { data } = await db().auth.getSession();
  const token = data.session?.access_token;
  if (!token) fail("Sesi berakhir, silakan login lagi.");

  const res = await fetch("/api/admin/blog-agent", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) fail(body.error || body.reason || `Permintaan gagal (${res.status}).`);
  return body as T;
}

export type GenerateResult = { status: "created"; postId: number; title: string; notes: string[]; issues: string[] };

export const generateDraftNow = () => callAgent<GenerateResult>({ action: "generate" });

export const reviseDraft = (postId: number, feedback: string) =>
  callAgent<{ ok: true; issues: string[]; notes: string[] }>({ action: "revise", postId, feedback });

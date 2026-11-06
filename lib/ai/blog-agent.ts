import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { invokeStructuredWithFallback } from "@/lib/ai/langchain-llm";
import { getPortfolioVectorStore } from "@/lib/ai/rag";
import { blocksToText, readTimeOf, slugify } from "@/lib/admin/content";
import type { PostBlock } from "@/lib/posts";

/**
 * Agen Blog: menulis draft artikel dari antrian ide (atau usulan sendiri kalau antrian kosong),
 * berdasarkan fakta di knowledge base portfolio (RAG). Hasilnya selalu berstatus Draft;
 * pemilik website yang memutuskan terbit atau minta revisi.
 *
 * Graph: pilihTopik → ambilKonteks → tulis → cekSEO ─(ada masalah, maks 1x)→ tulis
 *                                                   └→ simpan
 */

// Menulis artikel panjang: model Flash dengan thinking LOW. Tidak ada yang menunggu, jadi kualitas didahulukan.
const WRITER_MODELS = ["gemini-3.5-flash", "gemini-3.8-flash", "gemini-flash-lite-latest"] as const;
const WRITER_TIMEOUT_MS = 100_000;
const MAX_REWRITES = 1;

export type BlogAgentSettings = {
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

type Idea = { id: number; title: string; notes: string };
type Topic = { title: string; angle: string; notes: string };

// ---------------------------------------------------------------------------
// Skema output LLM
// ---------------------------------------------------------------------------

const topicSchema = z.object({
  title: z.string().describe("Judul kerja artikel, spesifik (bukan topik umum seperti 'Apa itu RAG')."),
  angle: z.string().describe("Sudut pandang unik: pengalaman/keputusan nyata pemilik yang jadi inti artikel."),
  notes: z.string().describe("Poin-poin fakta dari konteks yang akan dipakai sebagai bahan."),
});

const blockSchema = z.object({
  type: z.enum(["p", "h2", "quote", "list", "code"]).describe("p=paragraf, h2=subjudul, quote=kutipan, list=daftar, code=blok kode"),
  text: z.string().optional().describe("Isi untuk p, h2, dan quote"),
  items: z.array(z.string()).optional().describe("Isi untuk list"),
  lang: z.string().optional().describe("Bahasa kode untuk code, mis. ts, python, sql"),
  code: z.string().optional().describe("Isi untuk code"),
});

const articleSchema = z.object({
  title: z.string().describe("Judul artikel yang menarik, jelas, dan ringkas: maksimal 70 karakter, bahasa Indonesia."),
  seoTitle: z.string().describe("Judul untuk mesin pencari, 30-60 karakter, memuat keyword utama di depan."),
  metaDescription: z.string().describe("Meta description 120-155 karakter, memuat keyword utama, mengajak klik."),
  excerpt: z.string().describe("Ringkasan 1-2 kalimat untuk kartu artikel."),
  slug: z.string().describe("Slug URL kebab-case huruf kecil, 3-7 kata, memuat keyword utama."),
  category: z.string().describe("Kategori singkat, mis. 'Catatan Teknis', 'Studi Kasus'."),
  titleJp: z.string().describe("Terjemahan judul singkat dalam bahasa Jepang (untuk aksen desain)."),
  kanji: z.string().describe("Satu karakter kanji yang mewakili tema artikel."),
  keywords: z.array(z.string()).describe("3-6 keyword SEO, keyword utama di urutan pertama."),
  blocks: z.array(blockSchema).describe("Isi artikel berurutan. Mulai dengan paragraf pembuka, minimal 3 subjudul h2."),
  notesForAuthor: z
    .array(z.string())
    .describe("Hal yang harus dicek/dilengkapi pemilik sebelum terbit: angka yang perlu diisi, klaim yang perlu dipastikan, dll."),
});

export type Article = z.infer<typeof articleSchema>;

// ---------------------------------------------------------------------------
// Utilitas
// ---------------------------------------------------------------------------

function toPostBlocks(blocks: Article["blocks"]): PostBlock[] {
  const out: PostBlock[] = [];
  for (const b of blocks) {
    if ((b.type === "p" || b.type === "h2" || b.type === "quote") && b.text?.trim()) {
      out.push({ type: b.type, text: b.text.trim() });
    } else if (b.type === "list" && b.items?.some((i) => i.trim())) {
      out.push({ type: "list", items: b.items.map((i) => i.trim()).filter(Boolean) });
    } else if (b.type === "code" && b.code?.trim()) {
      out.push({ type: "code", lang: b.lang?.trim() || "text", code: b.code });
    }
  }
  return out;
}

function wordCount(blocks: PostBlock[]): number {
  return blocksToText(blocks).split(/\s+/).filter(Boolean).length;
}

/** Checklist SEO & struktur yang dicek tanpa LLM. Kosong = lolos. */
export function seoIssues(article: Article, targetWords: number): string[] {
  const issues: string[] = [];
  const blocks = toPostBlocks(article.blocks);
  const words = wordCount(blocks);
  const h2 = blocks.filter((b) => b.type === "h2").length;
  const mainKeyword = article.keywords[0]?.toLowerCase().trim();

  if (article.title.length > 70) issues.push(`title maksimal 70 karakter (sekarang ${article.title.length}); ringkas tanpa kehilangan inti.`);
  if (article.seoTitle.length < 30 || article.seoTitle.length > 60) issues.push(`seoTitle harus 30-60 karakter (sekarang ${article.seoTitle.length}).`);
  if (article.metaDescription.length < 120 || article.metaDescription.length > 160)
    issues.push(`metaDescription harus 120-155 karakter (sekarang ${article.metaDescription.length}).`);
  if (!/^[a-z0-9]+(-[a-z0-9]+){2,8}$/.test(article.slug)) issues.push("slug harus kebab-case huruf kecil, 3-9 kata.");
  if (h2 < 3) issues.push(`Minimal 3 subjudul h2 (sekarang ${h2}).`);
  if (blocks[0]?.type !== "p") issues.push("Artikel harus dibuka dengan paragraf, bukan subjudul/daftar.");
  if (words < targetWords * 0.7) issues.push(`Terlalu pendek: ${words} kata, target sekitar ${targetWords}.`);
  if (words > targetWords * 1.6) issues.push(`Terlalu panjang: ${words} kata, target sekitar ${targetWords}.`);
  if (article.keywords.length < 3) issues.push("Butuh 3-6 keyword.");
  if (mainKeyword) {
    if (!article.seoTitle.toLowerCase().includes(mainKeyword)) issues.push(`Keyword utama "${mainKeyword}" harus ada di seoTitle.`);
    // Pembuka = paragraf sebelum subjudul pertama (maks 3 paragraf)
    const firstH2 = blocks.findIndex((b) => b.type === "h2");
    const intro = blocks
      .slice(0, firstH2 === -1 ? 3 : firstH2)
      .filter((b): b is Extract<PostBlock, { type: "p" }> => b.type === "p")
      .slice(0, 3)
      .map((b) => b.text.toLowerCase())
      .join(" ");
    if (intro && !intro.includes(mainKeyword)) issues.push(`Keyword utama "${mainKeyword}" harus muncul di paragraf pembuka.`);
  }
  return issues;
}

function todayWib(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

async function retrieveContext(query: string): Promise<string> {
  const { store } = await getPortfolioVectorStore();
  const docs = await store.similaritySearch(query, 8);
  return docs.map((d) => d.pageContent).join("\n\n---\n\n");
}

function writerSystemPrompt(settings: BlogAgentSettings): string {
  return `Kamu penulis blog teknis untuk website portofolio seorang Junior AI Engineer. Tulis dalam bahasa Indonesia.

GAYA: ${settings.tone}
TARGET PANJANG: sekitar ${settings.target_words} kata.

ATURAN KONTEN (WAJIB):
1. Semua fakta tentang pemilik (proyek, angka hasil, pengalaman, tech stack) HANYA boleh diambil dari <konteks_portfolio> dan <catatan_pemilik>. Jangan mengarang angka, nama perusahaan, klien, atau pengalaman.
2. Jangan mengarang kronologi atau cerita pribadi ("awalnya saya mencoba X lalu gagal", "waktu itu klien minta..."). Ceritakan hanya urutan kejadian yang tertulis di catatan/konteks. Kalau artikel butuh cerita seperti itu, tulis netral (mis. "masalah dengan pendekatan X adalah...") dan minta ceritanya lewat notesForAuthor.
3. Kalau sebuah bagian butuh detail yang tidak ada di konteks (angka, contoh kasus, screenshot), tulis kalimat yang tetap benar tanpa detail itu, lalu masukkan permintaannya ke notesForAuthor.
4. Tonjolkan pengalaman dan keputusan nyata pemilik (kenapa memilih X, apa masalahnya, apa hasilnya). Ini yang membuat artikel bernilai, bukan definisi umum yang ada di mana-mana.
5. Penjelasan konsep umum boleh, secukupnya, untuk membantu pembaca memahami.
6. Blok kode hanya kalau relevan, singkat, dan benar.

ATURAN SEO:
- Keyword utama (keywords[0]) muncul di seoTitle, paragraf pembuka, dan setidaknya satu subjudul.
- Subjudul h2 deskriptif (bukan "Pendahuluan"/"Penutup" saja).
- Paragraf pendek (2-4 kalimat), mudah dipindai.
- Tutup dengan kesimpulan/pelajaran yang bisa dibawa pembaca.`;
}

// ---------------------------------------------------------------------------
// Graph pembuatan draft
// ---------------------------------------------------------------------------

const DraftState = Annotation.Root({
  settings: Annotation<BlogAgentSettings>(),
  idea: Annotation<Idea | null>(),
  existingTitles: Annotation<string[]>(),
  topic: Annotation<Topic | null>(),
  context: Annotation<string>(),
  article: Annotation<Article | null>(),
  issues: Annotation<string[]>(),
  rewrites: Annotation<number>(),
  model: Annotation<string>(),
});

type DraftStateType = typeof DraftState.State;

async function pickTopicNode(state: DraftStateType): Promise<Partial<DraftStateType>> {
  if (state.idea) {
    return { topic: { title: state.idea.title, angle: "", notes: state.idea.notes } };
  }

  // Antrian kosong: usulkan topik dari proyek & skill yang belum pernah dibahas
  const context = await retrieveContext("proyek integrasi AI tantangan pendekatan hasil keahlian");
  const res = await invokeStructuredWithFallback({
    schema: topicSchema,
    schemaName: "BlogTopic",
    temperature: 0.7,
    messages: [
      new SystemMessage(
        `Usulkan SATU topik artikel blog untuk portofolio Junior AI Engineer. Topik harus berangkat dari pengalaman nyata di <konteks_portfolio> (proyek, keputusan teknis, pelajaran), bukan topik umum. Jangan mengulang judul yang sudah ada.`,
      ),
      new HumanMessage(
        `<konteks_portfolio>\n${context}\n</konteks_portfolio>\n\n<judul_yang_sudah_ada>\n${state.existingTitles.join("\n") || "(belum ada)"}\n</judul_yang_sudah_ada>`,
      ),
    ],
  });
  if (!res) throw new Error("Gagal mengusulkan topik (semua model Gemini gagal/limit).");
  return { topic: res.data };
}

async function retrieveNode(state: DraftStateType): Promise<Partial<DraftStateType>> {
  const t = state.topic!;
  return { context: await retrieveContext(`${t.title} ${t.angle} ${t.notes}`.slice(0, 1000)) };
}

async function writeNode(state: DraftStateType): Promise<Partial<DraftStateType>> {
  const t = state.topic!;
  const revisionPart =
    state.article && state.issues.length
      ? `\n\n<draf_sebelumnya>\n${JSON.stringify(state.article)}\n</draf_sebelumnya>\n\n<masalah_yang_harus_diperbaiki>\n${state.issues.map((i) => `- ${i}`).join("\n")}\n</masalah_yang_harus_diperbaiki>\nPerbaiki semua masalah di atas, pertahankan isi yang sudah baik.`
      : "";

  const res = await invokeStructuredWithFallback({
    schema: articleSchema,
    schemaName: "BlogArticle",
    models: WRITER_MODELS,
    thinkingLevel: "LOW",
    timeoutMs: WRITER_TIMEOUT_MS,
    temperature: 0.6,
    messages: [
      new SystemMessage(writerSystemPrompt(state.settings)),
      new HumanMessage(
        `<topik>\nJudul kerja: ${t.title}\n${t.angle ? `Sudut pandang: ${t.angle}\n` : ""}Kategori default: ${state.settings.default_category}\n</topik>\n\n<catatan_pemilik>\n${t.notes || "(tidak ada)"}\n</catatan_pemilik>\n\n<konteks_portfolio>\n${state.context}\n</konteks_portfolio>\n\n<judul_yang_sudah_ada>\n${state.existingTitles.join("\n") || "(belum ada)"}\n</judul_yang_sudah_ada>${revisionPart}`,
      ),
    ],
  });
  if (!res) throw new Error("Gagal menulis artikel (semua model Gemini gagal/limit).");
  return { article: res.data, model: res.model, rewrites: state.article ? state.rewrites + 1 : state.rewrites };
}

async function reviewNode(state: DraftStateType): Promise<Partial<DraftStateType>> {
  return { issues: seoIssues(state.article!, state.settings.target_words) };
}

function afterReview(state: DraftStateType): "write" | typeof END {
  return state.issues.length && state.rewrites < MAX_REWRITES ? "write" : END;
}

const draftGraph = new StateGraph(DraftState)
  .addNode("pickTopic", pickTopicNode)
  .addNode("retrieve", retrieveNode)
  .addNode("write", writeNode)
  .addNode("review", reviewNode)
  .addEdge(START, "pickTopic")
  .addEdge("pickTopic", "retrieve")
  .addEdge("retrieve", "write")
  .addEdge("write", "review")
  .addConditionalEdges("review", afterReview, ["write", END])
  .compile();

/** Jalankan graph penulisan saja (tanpa database). Dipakai runBlogAgent dan untuk pengujian. */
export function generateArticle(settings: BlogAgentSettings, idea: Idea | null, existingTitles: string[]) {
  return draftGraph.invoke({
    settings,
    idea,
    existingTitles,
    topic: null,
    context: "",
    article: null,
    issues: [],
    rewrites: 0,
    model: "",
  });
}

// ---------------------------------------------------------------------------
// Menjalankan agen (dipanggil cron harian atau tombol "Buat draft sekarang")
// ---------------------------------------------------------------------------

export type AgentRunResult =
  | { status: "created"; postId: number; title: string; slug: string; notes: string[]; issues: string[] }
  | { status: "skipped"; reason: string }
  | { status: "error"; error: string };

const LOCK_MINUTES = 10;

export async function runBlogAgent(db: SupabaseClient, options: { force?: boolean } = {}): Promise<AgentRunResult> {
  const { data: settings, error: settingsError } = await db.from("blog_agent_settings").select("*").eq("id", 1).maybeSingle();
  if (settingsError || !settings) {
    return { status: "error", error: settingsError?.message ?? "Pengaturan agen blog belum ada. Jalankan migration blog_agent." };
  }
  const s = settings as BlogAgentSettings;

  if (!options.force) {
    if (!s.enabled) return { status: "skipped", reason: "Agen blog nonaktif." };
    const due = !s.last_run_at || Date.now() - new Date(s.last_run_at).getTime() >= s.interval_days * 86_400_000 - 3_600_000;
    if (!due) return { status: "skipped", reason: "Belum waktunya sesuai interval." };
  }

  // Kunci supaya cron dan tombol manual tidak membuat dua draft bersamaan
  const staleBefore = new Date(Date.now() - LOCK_MINUTES * 60_000).toISOString();
  const { data: claimed } = await db
    .from("blog_agent_settings")
    .update({ running_since: new Date().toISOString() })
    .eq("id", 1)
    .or(`running_since.is.null,running_since.lt.${staleBefore}`)
    .select("id");
  if (!claimed?.length) return { status: "skipped", reason: "Agen sedang berjalan, coba lagi beberapa menit lagi." };

  try {
    const [{ data: ideas }, { data: posts }] = await Promise.all([
      db.from("blog_ideas").select("id, title, notes").eq("status", "Antri").order("created_at").limit(1),
      db.from("posts").select("title, slug"),
    ]);
    const idea = (ideas?.[0] as Idea | undefined) ?? null;
    const existing = (posts ?? []) as { title: string; slug: string }[];

    const final = await generateArticle(s, idea, existing.map((p) => p.title));

    const article = final.article!;
    const blocks = toPostBlocks(article.blocks);
    if (blocks.length < 3) throw new Error("Artikel yang dihasilkan kosong/tidak valid.");

    // Slug unik (draft lain bisa saja memakai slug yang sama)
    const taken = new Set(existing.map((p) => p.slug));
    const base = slugify(article.slug || article.title) || `artikel-${Date.now()}`;
    let slug = base;
    for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;

    const notes = [...article.notesForAuthor, ...final.issues.map((i) => `Belum lolos cek SEO: ${i}`)];
    const { data: inserted, error: insertError } = await db
      .from("posts")
      .insert({
        slug,
        title: article.title,
        title_jp: article.titleJp,
        kanji: [...(article.kanji || "書")][0],
        tone: "dark",
        category: article.category || s.default_category,
        date: todayWib(),
        read_time: readTimeOf(blocksToText(blocks)),
        excerpt: article.excerpt,
        content: blocks,
        status: "Draft",
        seo_title: article.seoTitle,
        meta_description: article.metaDescription,
        keywords: article.keywords,
        ai_generated: true,
        ai_notes: notes,
        ai_revisions: [{ at: new Date().toISOString(), type: "generate", model: final.model, topic: final.topic?.title }],
        idea_id: idea?.id ?? null,
      })
      .select("id")
      .single();
    if (insertError || !inserted) throw new Error(`Gagal menyimpan draft: ${insertError?.message}`);

    if (idea) await db.from("blog_ideas").update({ status: "Dipakai", post_id: inserted.id }).eq("id", idea.id);

    await db
      .from("blog_agent_settings")
      .update({ last_run_at: new Date().toISOString(), last_status: `Draft dibuat: ${article.title}`, last_error: null, running_since: null })
      .eq("id", 1);

    return { status: "created", postId: inserted.id, title: article.title, slug, notes, issues: final.issues };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Kesalahan tidak diketahui.";
    console.error("[blog-agent] Gagal:", err);
    // last_run_at sengaja tidak diubah supaya cron besok mencoba lagi
    await db.from("blog_agent_settings").update({ last_status: "Gagal", last_error: message, running_since: null }).eq("id", 1);
    return { status: "error", error: message };
  }
}

// ---------------------------------------------------------------------------
// Revisi berdasarkan masukan pemilik
// ---------------------------------------------------------------------------

type PostForRevision = {
  id: number;
  slug: string;
  title: string;
  title_jp: string;
  kanji: string;
  category: string;
  excerpt: string;
  content: PostBlock[];
  seo_title: string | null;
  meta_description: string | null;
  keywords: string[];
  ai_revisions: unknown[];
};

export async function reviseBlogPost(
  db: SupabaseClient,
  postId: number,
  feedback: string,
): Promise<{ ok: true; issues: string[]; notes: string[] } | { ok: false; error: string }> {
  const [{ data: post, error }, { data: settings }] = await Promise.all([
    db.from("posts").select("*").eq("id", postId).maybeSingle(),
    db.from("blog_agent_settings").select("*").eq("id", 1).maybeSingle(),
  ]);
  if (error || !post) return { ok: false, error: error?.message ?? "Artikel tidak ditemukan." };
  const p = post as PostForRevision;
  const s = (settings as BlogAgentSettings | null) ?? {
    enabled: false,
    interval_days: 7,
    default_category: p.category,
    tone: "Santai tapi informatif.",
    target_words: 900,
    last_run_at: null,
    last_status: null,
    last_error: null,
    running_since: null,
  };

  const current: Article = {
    title: p.title,
    seoTitle: p.seo_title ?? p.title,
    metaDescription: p.meta_description ?? p.excerpt,
    excerpt: p.excerpt,
    slug: p.slug,
    category: p.category,
    titleJp: p.title_jp,
    kanji: p.kanji,
    keywords: p.keywords ?? [],
    blocks: p.content,
    notesForAuthor: [],
  };

  const context = await retrieveContext(`${p.title} ${p.excerpt}`);
  const res = await invokeStructuredWithFallback({
    schema: articleSchema,
    schemaName: "BlogArticleRevision",
    models: WRITER_MODELS,
    thinkingLevel: "LOW",
    timeoutMs: WRITER_TIMEOUT_MS,
    temperature: 0.4,
    messages: [
      new SystemMessage(
        `${writerSystemPrompt(s)}\n\nTUGAS SEKARANG: revisi artikel yang sudah ada sesuai <masukan_pemilik>. Ubah hanya yang diminta (dan yang perlu agar tetap konsisten), pertahankan bagian lain apa adanya. Pertahankan slug.`,
      ),
      new HumanMessage(
        `<artikel_sekarang>\n${JSON.stringify(current)}\n</artikel_sekarang>\n\n<masukan_pemilik>\n${feedback}\n</masukan_pemilik>\n\n<konteks_portfolio>\n${context}\n</konteks_portfolio>`,
      ),
    ],
  });
  if (!res) return { ok: false, error: "Gagal merevisi (semua model Gemini gagal/limit). Coba lagi nanti." };

  const article = res.data;
  const blocks = toPostBlocks(article.blocks);
  if (blocks.length < 3) return { ok: false, error: "Hasil revisi tidak valid, coba ulangi dengan masukan yang lebih jelas." };

  const issues = seoIssues({ ...article, slug: p.slug }, s.target_words);
  const notes = [...article.notesForAuthor, ...issues.map((i) => `Belum lolos cek SEO: ${i}`)];
  const revisions = [...(Array.isArray(p.ai_revisions) ? p.ai_revisions : []), { at: new Date().toISOString(), type: "revise", feedback, model: res.model }];

  const { error: updateError } = await db
    .from("posts")
    .update({
      title: article.title,
      title_jp: article.titleJp,
      kanji: [...(article.kanji || p.kanji)][0],
      category: article.category || p.category,
      excerpt: article.excerpt,
      content: blocks,
      read_time: readTimeOf(blocksToText(blocks)),
      seo_title: article.seoTitle,
      meta_description: article.metaDescription,
      keywords: article.keywords,
      ai_notes: notes,
      ai_revisions: revisions,
    })
    .eq("id", postId);
  if (updateError) return { ok: false, error: updateError.message };

  return { ok: true, issues, notes };
}

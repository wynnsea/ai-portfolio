import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { Project } from "@/lib/projects";
import type { Post } from "@/lib/posts";
import type { ExplainLevel, SearchItem } from "@/lib/ai/types";
import { invokeStructuredWithFallback } from "@/lib/ai/langchain-llm";
import { getPortfolioVectorStore } from "@/lib/ai/rag";
import { mockExplain, mockTldr } from "@/lib/ai/mock";
import { buildSearchIndex } from "@/lib/ai/search-index";

// Cache server untuk hasil Explain dan TL;DR agar tidak memanggil LLM berulang kali untuk artikel/proyek yang sama
const globalForWorkflowCache = globalThis as unknown as {
  __wynnseaExplainCacheV3?: Map<string, string>;
  __wynnseaTldrCacheV3?: Map<string, string[]>;
};

const explainCache = (globalForWorkflowCache.__wynnseaExplainCacheV3 ??= new Map<string, string>());
const tldrCache = (globalForWorkflowCache.__wynnseaTldrCacheV3 ??= new Map<string, string[]>());

// ---------------------------------------------------------------------------
// 1. LangGraph Workflow: Project Explainer (/api/explain)
// ---------------------------------------------------------------------------

const explainSchema = z.object({
  explanation: z
    .string()
    .describe("Penjelasan proyek dalam 1 paragraf santai (3-5 kalimat) sesuai gaya audiens yang diminta dan 100% akurat sesuai data proyek."),
});

const ExplainGraphAnnotation = Annotation.Root({
  project: Annotation<Project>(),
  level: Annotation<ExplainLevel>(),
  ownerName: Annotation<string>(),
  ragContext: Annotation<string>(),
  generatedText: Annotation<string | null>(),
  finalText: Annotation<string>(),
});

type ExplainState = typeof ExplainGraphAnnotation.State;

async function retrieveExplainContextNode(state: ExplainState): Promise<Partial<ExplainState>> {
  const { store } = await getPortfolioVectorStore();
  const docs = await store.similaritySearch(`${state.project.title} ${state.project.stack.join(" ")}`, 3);
  const ragContext = docs.map((d) => d.pageContent).join("\n\n---\n\n");
  return { ragContext };
}

async function generateExplainNode(state: ExplainState): Promise<Partial<ExplainState>> {
  const { project: p, level, ownerName } = state;

  const audienceInstruction: Record<ExplainLevel, string> = {
    recruiter: `Audiens: REKRUTER / HR.
Jelaskan dengan gaya ngobrol santai tapi tetap profesional: fokus ke masalah nyata yang diberesin proyek ini, peran ${ownerName} (${p.role} selama ${p.duration}), hasil yang didapat, dan stack utama yang dipakai (${p.stack.join(", ")}).`,
    engineer: `Audiens: SESAMA DEVELOPER / ENGINEER.
Jelaskan dengan gaya ngobrol antar-engineer yang santai: bahas tech stack-nya (${p.stack.join(", ")}), tantangan teknisnya, dan gimana cara ${ownerName} ngerakit alur sistem serta integrasi AI-nya.`,
    awam: `Audiens: ORANG AWAM / BOCIL ("Jelasin kayak ke bocil").
Pakai perumpamaan sehari-hari yang gampang banget dibayangin, seru, dan sama sekali gak pakai istilah teknis yang njelimet. Intinya biar orang langsung paham apa yang dibikin ${ownerName} dan kenapa itu ngebantu banget.`,
  };

  const projectFacts = [
    `Judul Proyek: ${p.title} (${p.titleJp})`,
    `Kategori: ${p.category} | Tahun: ${p.year}`,
    `Peran ${ownerName}: ${p.role} | Durasi: ${p.duration}`,
    `Tech Stack: ${p.stack.join(", ")}`,
    `Ringkasan: ${p.summary}`,
    `Overview: ${p.overview}`,
    `Tantangan: ${p.challenge}`,
    `Pendekatan: ${p.approach.map((a, i) => `(${i + 1}) ${a}`).join(" ")}`,
    `Hasil: ${p.results.map((r) => `${r.value} (${r.label})`).join(", ")}`,
  ].join("\n");

  const systemPrompt = `Kamu adalah SEA AI, asisten AI pribadi di website portofolio milik ${ownerName} (Wynnsea).
Tugasmu jelasin proyek "${p.title}" buatan bos kamu dalam 1 paragraf yang ngalir santai, gak kaku, dan enak dibaca (3–5 kalimat, bahasa Indonesia kasual).

CARA MEMANGGIL & GAYA BAHASA:
- Jangan melulu menyebut nama "${ownerName}". Panggil dia dengan sebutan akrab seperti **"bos saya"**, **"si bos"**, atau kata ganti **"dia"**.
- Pakai kata-kata santai ("bikin", "pakai", "nyambungin", "gak", "banget", "biar") dan sapa pembaca dengan "kamu" kalau perlu.
- Hindari bahasa kaku seperti "merupakan", "menggarap", "ia", "Anda", atau "mengandalkan".

ATURAN ANTI-HALUSINASI:
- Gunakan HANYA fakta dari <fakta_proyek> dan <konteks_rag>.
- Jangan ngarang fitur, angka metrik, atau teknologi di luar data proyek.

${audienceInstruction[level]}`;

  const userPrompt = `<fakta_proyek>
${projectFacts}
</fakta_proyek>

<konteks_rag>
${state.ragContext}
</konteks_rag>`;

  const res = await invokeStructuredWithFallback({
    schema: explainSchema,
    schemaName: "ProjectExplanation",
    messages: [new SystemMessage(systemPrompt), new HumanMessage(userPrompt)],
    temperature: 0.35,
  });

  return {
    generatedText: res?.data.explanation?.trim() || null,
  };
}

async function finalizeExplainNode(state: ExplainState): Promise<Partial<ExplainState>> {
  const text =
    state.generatedText ||
    mockExplain(state.project.slug, state.level, state.project, state.ownerName) ||
    state.project.summary;
  return { finalText: text };
}

const explainCompiledGraph = new StateGraph(ExplainGraphAnnotation)
  .addNode("retrieveContext", retrieveExplainContextNode)
  .addNode("generateExplanation", generateExplainNode)
  .addNode("finalize", finalizeExplainNode)
  .addEdge(START, "retrieveContext")
  .addEdge("retrieveContext", "generateExplanation")
  .addEdge("generateExplanation", "finalize")
  .addEdge("finalize", END)
  .compile();

export async function runProjectExplainGraph(
  project: Project,
  level: ExplainLevel,
  ownerName = "Wayan",
): Promise<string> {
  const cacheKey = `${project.slug}:${level}:${project.summary.length}:${ownerName}`;
  const cached = explainCache.get(cacheKey);
  if (cached) return cached;

  const result = await explainCompiledGraph.invoke({
    project,
    level,
    ownerName,
    ragContext: "",
    generatedText: null,
    finalText: "",
  });

  if (result.generatedText) {
    explainCache.set(cacheKey, result.finalText);
  }
  return result.finalText;
}

// ---------------------------------------------------------------------------
// 2. LangGraph Workflow: Blog TL;DR (/api/tldr)
// ---------------------------------------------------------------------------

const tldrSchema = z.object({
  points: z
    .array(z.string().describe("Satu poin ringkasan penting yang santai, jelas, gak kaku (1 kalimat per poin)."))
    .min(3)
    .max(4),
});

const TldrGraphAnnotation = Annotation.Root({
  post: Annotation<Post>(),
  articleBody: Annotation<string>(),
  generatedPoints: Annotation<string[] | null>(),
  finalPoints: Annotation<string[]>(),
});

type TldrState = typeof TldrGraphAnnotation.State;

async function prepareTldrNode(state: TldrState): Promise<Partial<TldrState>> {
  const body = state.post.content
    .map((block) => {
      if (block.type === "h2") return `## ${block.text}`;
      if (block.type === "quote") return `> "${block.text}"`;
      if (block.type === "list") return block.items.map((item) => `- ${item}`).join("\n");
      if (block.type === "code") return `[Kode ${block.lang}]: ${block.code}`;
      return block.text;
    })
    .join("\n\n");

  return { articleBody: body };
}

async function generateTldrNode(state: TldrState): Promise<Partial<TldrState>> {
  const { post, articleBody } = state;

  const systemPrompt = `Kamu adalah SEA AI yang ngeringkas artikel blog milik Wayan (Wynnsea) jadi 3–4 poin TL;DR yang santai, jelas, dan gampang ditangkap intinya.

GAYA BAHASA & ATURAN:
- Pakai bahasa Indonesia kasual yang enak dibaca dan gak kaku (hindari kata "merupakan", "ia", "Anda").
- Ringkasan WAJIB 100% berasal dari isi <artikel> di bawah, jangan ngarang fakta di luar artikel.
- Setiap poin cukup 1 kalimat singkat yang langsung ke intinya.`;

  const userPrompt = `<artikel>
Judul: ${post.title}
Kategori: ${post.category}
Waktu Baca: ${post.readTime}
Ringkasan Awal: ${post.excerpt}

Isi Lengkap:
${articleBody}
</artikel>`;

  const res = await invokeStructuredWithFallback({
    schema: tldrSchema,
    schemaName: "BlogTldrSummary",
    messages: [new SystemMessage(systemPrompt), new HumanMessage(userPrompt)],
    temperature: 0.25,
  });

  return {
    generatedPoints: res?.data.points?.length ? res.data.points : null,
  };
}

async function finalizeTldrNode(state: TldrState): Promise<Partial<TldrState>> {
  const points = state.generatedPoints ?? mockTldr(state.post.slug, state.post) ?? [state.post.excerpt];
  return { finalPoints: points };
}

const tldrCompiledGraph = new StateGraph(TldrGraphAnnotation)
  .addNode("prepare", prepareTldrNode)
  .addNode("summarize", generateTldrNode)
  .addNode("finalize", finalizeTldrNode)
  .addEdge(START, "prepare")
  .addEdge("prepare", "summarize")
  .addEdge("summarize", "finalize")
  .addEdge("finalize", END)
  .compile();

export async function runBlogTldrGraph(post: Post): Promise<string[]> {
  const cacheKey = `${post.slug}:${post.date}:${post.content.length}`;
  const cached = tldrCache.get(cacheKey);
  if (cached) return cached;

  const result = await tldrCompiledGraph.invoke({
    post,
    articleBody: "",
    generatedPoints: null,
    finalPoints: [],
  });

  if (result.generatedPoints) {
    tldrCache.set(cacheKey, result.finalPoints);
  }
  return result.finalPoints;
}

// ---------------------------------------------------------------------------
// 3. Semantic + Hybrid RAG Search untuk Command Palette (/api/search)
// ---------------------------------------------------------------------------

export async function runSemanticSearch(query: string): Promise<SearchItem[]> {
  const trimmed = query.trim();
  const { store, data } = await getPortfolioVectorStore();

  if (!trimmed) {
    return buildSearchIndex(data.projects, data.posts).filter((i) => i.type !== "Blog").slice(0, 6);
  }

  const scoredDocs = await store.similaritySearchWithScore(trimmed, 8);
  const seenHrefs = new Set<string>();
  const items: SearchItem[] = [];

  for (const [doc, score] of scoredDocs) {
    if (score <= 0.02) continue;
    const meta = doc.metadata;
    if (!meta.href || !meta.searchType) continue;
    if (seenHrefs.has(meta.href)) continue;
    seenHrefs.add(meta.href);

    items.push({
      type: meta.searchType,
      title: meta.title,
      subtitle: meta.subtitle ?? "",
      href: meta.href,
      keywords: meta.keywords ?? "",
    });
  }

  return items;
}

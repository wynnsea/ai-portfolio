import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { getPortfolioVectorStore, type PortfolioKnowledgeInput } from "@/lib/ai/rag";
import { invokeStructuredWithFallback } from "@/lib/ai/langchain-llm";
import { mockSeaReply } from "@/lib/ai/mock";
import type { SeaAction, SeaReply } from "@/lib/ai/types";

export type ChatTurn = {
  role: "user" | "assistant";
  text: string;
};

const seaStructuredSchema = z.object({
  reply: z
    .string()
    .describe(
      "Jawaban SEA AI dalam bahasa Indonesia sehari-hari yang santai, akrab, gak kaku (2-4 kalimat), dan 100% sesuai fakta di <konteks_portfolio>.",
    ),
  actionHref: z
    .string()
    .optional()
    .describe(
      "Pilih satu href dari daftar <aksi_tersedia> yang paling relevan untuk dibuka pengunjung, atau kosongkan jika tidak perlu tombol navigasi.",
    ),
  actionLabel: z
    .string()
    .optional()
    .describe("Label tombol navigasi singkat (maksimal 4 kata), misalnya 'Buka Minori AI RCR' atau 'Lihat sertifikasi'."),
});

const SeaGraphAnnotation = Annotation.Root({
  question: Annotation<string>(),
  history: Annotation<ChatTurn[]>(),
  knowledgeInput: Annotation<PortfolioKnowledgeInput>(),
  ownerName: Annotation<string>(),
  contextText: Annotation<string>(),
  allowedActions: Annotation<{ href: string; label: string }[]>(),
  rawResult: Annotation<z.infer<typeof seaStructuredSchema> | null>(),
  finalReply: Annotation<SeaReply>(),
});

type SeaGraphState = typeof SeaGraphAnnotation.State;

/**
 * Node 1 (LangGraph): Retrieve dokumen relevan dari PortfolioVectorStore (RAG).
 */
async function retrieveNode(state: SeaGraphState): Promise<Partial<SeaGraphState>> {
  const { store, data } = await getPortfolioVectorStore(state.knowledgeInput);
  const ownerName = data.settings.name || "Wayan";

  const lastUserTurns = state.history
    .filter((h) => h.role === "user")
    .slice(-2)
    .map((h) => h.text)
    .join(" ");
  const retrievalQuery = lastUserTurns ? `${lastUserTurns} ${state.question}` : state.question;

  const retrievedWithScores = await store.similaritySearchWithScore(retrievalQuery, 6);
  const allDocs = store.getDocuments();
  const identityDoc = allDocs.find((d) => d.metadata.id === "identity-core");
  const skillsDoc = allDocs.find((d) => d.metadata.id === "skills-matrix");

  const selectedDocs = new Map<string, string>();
  if (identityDoc) selectedDocs.set(identityDoc.metadata.id, identityDoc.pageContent);
  if (skillsDoc) selectedDocs.set(skillsDoc.metadata.id, skillsDoc.pageContent);

  const actionMap = new Map<string, string>();
  for (const [doc] of retrievedWithScores) {
    selectedDocs.set(doc.metadata.id, doc.pageContent);
    if (doc.metadata.href && doc.metadata.actionLabel) {
      actionMap.set(doc.metadata.href, doc.metadata.actionLabel);
    }
  }

  const defaultActions: [string, string][] = [
    ["/#projects", "Lihat semua proyek"],
    ["/#about", "Lihat profil & keahlian"],
    ["/#certifications", "Lihat sertifikasi"],
    ["/#activities", "Lihat kegiatan"],
    ["/#job-match", "Coba Job Match"],
    ["/#contact", "Ke bagian kontak"],
  ];
  for (const [href, label] of defaultActions) {
    if (!actionMap.has(href)) actionMap.set(href, label);
  }
  for (const p of data.projects) {
    actionMap.set(`/projects/${p.slug}`, `Buka ${p.title}`);
  }
  for (const post of data.posts) {
    actionMap.set(`/blog/${post.slug}`, `Baca ${post.title}`);
  }

  const allowedActions = Array.from(actionMap.entries()).map(([href, label]) => ({ href, label }));
  const contextText = Array.from(selectedDocs.values()).join("\n\n---\n\n");

  return {
    ownerName,
    contextText,
    allowedActions,
    knowledgeInput: data,
  };
}

/**
 * Node 2 (LangGraph): Generate jawaban terstruktur dengan gaya bahasa santai & ramah.
 */
async function generateNode(state: SeaGraphState): Promise<Partial<SeaGraphState>> {
  const actionsListText = state.allowedActions.map((a) => `- href: "${a.href}" | label default: "${a.label}"`).join("\n");

  const historyText =
    state.history.length > 0
      ? state.history
          .slice(-6)
          .map((h) => `${h.role === "user" ? "Pengunjung" : "SEA AI"}: ${h.text}`)
          .join("\n")
      : "(Belum ada riwayat percakapan sebelumnya)";

  const systemPrompt = `Kamu adalah SEA AI, asisten AI pribadi di website portofolio milik ${state.ownerName} (brand: Wynnsea).
Tugasmu ngobrol sama pengunjung atau rekruter yang pengen tau soal bos kamu (${state.ownerName}).

CARA MEMANGGIL PEMILIK WEBSITE (PENTING!):
- JANGAN terus-menerus memanggil nama "${state.ownerName}".
- Gunakan sebutan asisten pribadi yang akrab dan santai seperti **"bos saya"**, **"si bos"**, **"bos"**, atau kata ganti **"dia"** sebagai panggilan utama!
- Nama "${state.ownerName}" cukup disebut sesekali saja (misalnya hanya saat pengunjung spesifik bertanya "siapa namanya?").

GAYA BAHASA (WAJIB SANTAI & GAK FORMAL):
- Pakai bahasa Indonesia kasual sehari-hari yang ramah, hangat, dan enak dibaca (2–4 kalimat).
- Sapa pengunjung dengan "kamu" (JANGAN pakai "Anda").
- Gunakan kata-kata santai seperti "udah", "bikin", "pakai", "nyambungin", "ngulik", "gak", "banget", "soal", "nih", "kok", "yuk".
- HINDARI kata-kata baku/kaku seperti: "merupakan", "menggarap", "mengandalkan", "menjabat", "terlibat dalam", "ia", "beliau", "Anda", "memiliki", "apabila", "namun demikian".
- Contoh nada bicara yang pas:
  * "Sekarang bos saya kerja sebagai Junior AI Engineer di Global Collabo Tech. Sebelumnya dia sempet jadi IT Coordinator di Politeknik Takumi, makanya si bos kebiasaan selalu mikirin kenyamanan user pas bikin sistem."
  * "Paling gampang hubungi bos saya lewat email ke wayaandeva123@gmail.com, atau mampir ke GitHub sama LinkedIn-nya. Biasanya si bos fast response kok!"
  * "Kalau soal Kubernetes atau training model dari nol, bos saya emang belum fokus ke sana nih. Sehari-hari dia lebih banyak ngulik integrasi AI ke web kayak LLM API, RAG, sama full-stack dev."

ATURAN ANTI-HALUSINASI (WAJIB DITAATI 100%):
1. Kamu HANYA BOLEH menjawab berdasarkan fakta di dalam <konteks_portfolio>.
2. DILARANG KERAS ngarang info yang gak ada di <konteks_portfolio> (jangan ngarang proyek lain, perusahaan, IPK, gaji, nomor WA/telepon, alamat, atau skill di luar konteks).
3. Kalau ditanya skill yang statusnya "BELUM Dikuasai" atau info yang gak ada di <konteks_portfolio>, bilang aja jujur dan santai kalau itu belum ada di portofolio bos saya atau dia lagi fokus di integrasi AI ke produk web.
4. Kalau yang nanya rekruter atau nanya kecocokan loker, ajak coba fitur Job Match (href: "/#job-match").
5. Jangan pernah menyebut istilah internal seperti "Berdasarkan konteks portofolio" atau "Menurut data RAG". Jawab langsung seolah kamu emang asisten pribadinya yang kenal baik sama si bos.
6. Pilih actionHref HANYA dari daftar <aksi_tersedia> kalau relevan. Kalau cuma sapaan santai, kosongin aja actionHref-nya.

<konteks_portfolio>
${state.contextText}
</konteks_portfolio>

<aksi_tersedia>
${actionsListText}
</aksi_tersedia>`;

  const userPrompt = `<riwayat_chat>
${historyText}
</riwayat_chat>

<pertanyaan_pengunjung>
${state.question}
</pertanyaan_pengunjung>`;

  const res = await invokeStructuredWithFallback({
    schema: seaStructuredSchema,
    schemaName: "SeaAiRagResponse",
    messages: [new SystemMessage(systemPrompt), new HumanMessage(userPrompt)],
    temperature: 0.35,
  });

  return {
    rawResult: res?.data ?? null,
  };
}

/**
 * Node 3 (LangGraph): Validasi output & anti-hallucinated-link guardrail (dengan fallback ke mock jika API gagal).
 */
async function finalizeNode(state: SeaGraphState): Promise<Partial<SeaGraphState>> {
  if (!state.rawResult || !state.rawResult.reply?.trim()) {
    return {
      finalReply: mockSeaReply(state.question, state.knowledgeInput),
    };
  }

  let action: SeaAction | undefined;
  const requestedHref = state.rawResult.actionHref?.trim();
  if (requestedHref) {
    const matched = state.allowedActions.find((a) => a.href === requestedHref);
    if (matched) {
      action = {
        type: "navigate",
        href: matched.href,
        label: state.rawResult.actionLabel?.trim() || matched.label,
      };
    }
  }

  return {
    finalReply: {
      reply: state.rawResult.reply.trim(),
      ...(action ? { action } : {}),
    },
  };
}

const seaCompiledGraph = new StateGraph(SeaGraphAnnotation)
  .addNode("retrieve", retrieveNode)
  .addNode("generate", generateNode)
  .addNode("finalize", finalizeNode)
  .addEdge(START, "retrieve")
  .addEdge("retrieve", "generate")
  .addEdge("generate", "finalize")
  .addEdge("finalize", END)
  .compile();

/**
 * Menjalankan LangGraph RAG Agent untuk SEA AI Chatbot (/api/sea).
 */
export async function runSeaRagAgent(params: {
  message: string;
  history?: ChatTurn[];
  knowledgeInput?: PortfolioKnowledgeInput;
}): Promise<SeaReply> {
  const result = await seaCompiledGraph.invoke({
    question: params.message,
    history: params.history ?? [],
    knowledgeInput: params.knowledgeInput ?? {},
    ownerName: "Wayan",
    contextText: "",
    allowedActions: [],
    rawResult: null,
    finalReply: { reply: "" },
  });

  return result.finalReply;
}

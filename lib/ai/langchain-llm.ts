import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
  type GoogleGenerativeAIChatInput,
} from "@langchain/google-genai";
import type { BaseMessageLike } from "@langchain/core/messages";
import type { z } from "zod";

/**
 * Urutan model Gemini: gemini-flash-lite-latest (gemini-3.5-flash-lite) diprioritaskan pertama
 * karena kuota free-tier paling longgar dan paling cepat.
 */
export const GEMINI_CHAT_MODELS = [
  "gemini-flash-lite-latest",
  "gemini-3.5-flash",
  "gemini-3.8-flash",
] as const;

export const GEMINI_EMBEDDING_MODEL = "gemini-embedding-001";

/**
 * Dimensi embedding. gemini-embedding-001 defaultnya 3072, tapi mendukung dimensi lebih kecil
 * (Matryoshka). 768 cukup akurat untuk korpus portfolio, 4x lebih hemat ruang, dan muat di index HNSW.
 * Harus sama dengan kolom vector(768) di migration rag_chunks.
 */
export const EMBEDDING_DIMENSIONS = 768;

/** Penanda model + dimensi; ikut di-hash supaya ganti model otomatis memicu embed ulang. */
export const EMBEDDING_MODEL_KEY = `${GEMINI_EMBEDDING_MODEL}@${EMBEDDING_DIMENSIONS}`;

export function getGeminiApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  return key && key.trim().length > 0 ? key.trim() : null;
}

/**
 * Level thinking paling rendah. "MINIMAL" mematikan thinking (0 thought token) di model Flash/Flash-Lite.
 * Sebagian model tidak mendukung MINIMAL; untuk model itu dipakai "LOW", level terendah berikutnya.
 * Jangan pernah mengirim tanpa thinkingConfig: model akan berpikir dengan level default (lebih lambat).
 */
export type ThinkingLevel = "MINIMAL" | "LOW";

export function createChatModel(
  modelName: string = GEMINI_CHAT_MODELS[0],
  temperature = 0.2,
  thinkingLevel: ThinkingLevel = "MINIMAL",
): ChatGoogleGenerativeAI {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY belum diatur di .env.local");
  }
  return new ChatGoogleGenerativeAI({
    apiKey,
    model: modelName,
    temperature,
    maxRetries: 0,
    // Tipe LangChain belum mengenal thinkingLevel, tapi nilainya diteruskan apa adanya ke API
    // (sudah dicek: thought token = 0 untuk MINIMAL).
    thinkingConfig: { thinkingLevel } as unknown as GoogleGenerativeAIChatInput["thinkingConfig"],
  });
}

/**
 * Gemini membedakan embedding untuk dokumen yang disimpan (RETRIEVAL_DOCUMENT) dan
 * untuk pertanyaan pengguna (RETRIEVAL_QUERY); memakai pasangan ini meningkatkan akurasi retrieval.
 */
export function createEmbeddingsModel(
  purpose: "document" | "query" = "document",
): GoogleGenerativeAIEmbeddings {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY belum diatur di .env.local");
  }
  return new GoogleGenerativeAIEmbeddings({
    apiKey,
    model: GEMINI_EMBEDDING_MODEL,
    taskType: (purpose === "document" ? "RETRIEVAL_DOCUMENT" : "RETRIEVAL_QUERY") as GoogleGenerativeAIEmbeddings["taskType"],
    outputDimensionality: EMBEDDING_DIMENSIONS,
    maxRetries: 0,
  });
}

/** Ringkas pesan error Gemini untuk log: buang URL panjang supaya kode status (429/503) kelihatan. */
function describeError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.replace(/https:\/\/\S+/g, "").replace(/\s+/g, " ").trim().slice(0, 200);
}

/** Error 400 "Thinking level MINIMAL is not supported for this model". */
export function isThinkingLevelUnsupported(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return msg.includes("thinking level") && msg.includes("not supported");
}

/**
 * Memanggil LangChain ChatGoogleGenerativeAI dengan Structured Output (Zod schema),
 * thinking serendah mungkin (MINIMAL, atau LOW kalau model tidak mendukung MINIMAL), dan fallback otomatis.
 */
export async function invokeStructuredWithFallback<TSchema extends z.ZodTypeAny>(params: {
  schema: TSchema;
  schemaName: string;
  messages: BaseMessageLike[];
  temperature?: number;
  /** Urutan model yang dicoba. Default GEMINI_CHAT_MODELS. */
  models?: readonly string[];
  /** "LOW" untuk tugas berat yang tidak ditunggu pengguna (mis. menulis artikel). Default MINIMAL. */
  thinkingLevel?: ThinkingLevel;
  timeoutMs?: number;
}): Promise<{ data: z.infer<TSchema>; model: string } | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const levels: ThinkingLevel[] = params.thinkingLevel === "LOW" ? ["LOW"] : ["MINIMAL", "LOW"];
  for (const modelName of params.models ?? GEMINI_CHAT_MODELS) {
    for (const thinkingLevel of levels) {
      try {
        const structured = createChatModel(modelName, params.temperature ?? 0.2, thinkingLevel).withStructuredOutput(
          params.schema,
          { name: params.schemaName },
        );
        const result = await structured.invoke(params.messages, { signal: AbortSignal.timeout(params.timeoutMs ?? 25_000) });
        if (result) return { data: result as z.infer<TSchema>, model: modelName };
        break;
      } catch (err) {
        // MINIMAL ditolak model ini → coba lagi dengan LOW; error lain → pindah ke model berikutnya
        if (thinkingLevel === "MINIMAL" && isThinkingLevelUnsupported(err)) continue;
        console.warn(
          `[langchain-llm] Model ${modelName} gagal (${describeError(err)}), beralih ke fallback berikutnya...`,
        );
        break;
      }
    }
  }

  return null;
}

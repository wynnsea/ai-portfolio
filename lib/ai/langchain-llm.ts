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

export const GEMINI_EMBEDDING_MODELS = [
  "gemini-embedding-001",
] as const;

export function getGeminiApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  return key && key.trim().length > 0 ? key.trim() : null;
}

export function createChatModel(
  modelName: string = GEMINI_CHAT_MODELS[0],
  temperature = 0.2,
  disableThinking = true,
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
    ...(disableThinking
      ? {
          thinkingConfig: {
            // Pada model seri Gemini 3.5/3.8, MINIMAL mematikan thinking (thoughtsTokenCount = 0)
            thinkingLevel: "MINIMAL",
          } as unknown as GoogleGenerativeAIChatInput["thinkingConfig"],
        }
      : {}),
  });
}

export function createEmbeddingsModel(modelName: string = GEMINI_EMBEDDING_MODELS[0]): GoogleGenerativeAIEmbeddings {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY belum diatur di .env.local");
  }
  return new GoogleGenerativeAIEmbeddings({
    apiKey,
    model: modelName,
    maxRetries: 0,
  });
}

function isThinkingUnsupportedError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return msg.includes("thinking") || msg.includes("400") || msg.includes("invalid argument");
}

/**
 * Memanggil LangChain ChatGoogleGenerativeAI dengan Structured Output (Zod schema),
 * thinking dimatikan (thinkingLevel: MINIMAL -> 0 thought tokens), dan fallback otomatis.
 */
export async function invokeStructuredWithFallback<TSchema extends z.ZodTypeAny>(params: {
  schema: TSchema;
  schemaName: string;
  messages: BaseMessageLike[];
  temperature?: number;
}): Promise<{ data: z.infer<TSchema>; model: string } | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  for (const modelName of GEMINI_CHAT_MODELS) {
    try {
      const llm = createChatModel(modelName, params.temperature ?? 0.2, true);
      const structured = llm.withStructuredOutput(params.schema, {
        name: params.schemaName,
      });

      const result = await structured.invoke(params.messages, {
        signal: AbortSignal.timeout(25_000),
      });
      if (result) {
        return { data: result as z.infer<TSchema>, model: modelName };
      }
    } catch (err) {
      if (isThinkingUnsupportedError(err)) {
        try {
          const llmNoThinkingCfg = createChatModel(modelName, params.temperature ?? 0.2, false);
          const structured = llmNoThinkingCfg.withStructuredOutput(params.schema, {
            name: params.schemaName,
          });
          const result = await structured.invoke(params.messages, {
            signal: AbortSignal.timeout(25_000),
          });
          if (result) {
            return { data: result as z.infer<TSchema>, model: modelName };
          }
        } catch {
          // lanjut ke model berikutnya
        }
      }

      console.warn(`[langchain-llm] Model ${modelName} sibuk/limit, beralih ke fallback berikutnya...`);
      continue;
    }
  }

  return null;
}

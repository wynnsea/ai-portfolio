import { createHash } from "node:crypto";
import type { Document } from "@langchain/core/documents";
import type { Embeddings } from "@langchain/core/embeddings";
import { getServiceClient } from "@/lib/supabase/server";
import type { ChunkMetadata } from "@/lib/ai/chunking";

/**
 * Penyimpanan embedding permanen di Supabase (tabel rag_chunks, kolom pgvector).
 *
 * Tanpa ini, setiap server baru menyala (cold start di serverless) semua potongan di-embed ulang
 * ke Gemini: lambat dan menghabiskan kuota. Dengan ini, setiap potongan diberi hash isinya;
 * hanya potongan yang baru atau berubah yang di-embed, sisanya dibaca dari database.
 */

export function chunkHash(modelKey: string, content: string): string {
  return createHash("sha256").update(`${modelKey}\n${content}`).digest("hex");
}

type StoredRow = { id: string; content_hash: string; embedding: string | number[] | null };

function parseVector(value: StoredRow["embedding"]): number[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    // PostgREST mengirim kolom pgvector sebagai teks "[0.1,0.2,...]"
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const toPgVector = (v: number[]) => `[${v.join(",")}]`;

async function embedSafely(embeddings: Embeddings, texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];
  try {
    const vectors = await embeddings.embedDocuments(texts);
    // Batch yang gagal dikembalikan LangChain sebagai array kosong, bukan error
    return texts.map((_, i) => (Array.isArray(vectors[i]) ? vectors[i] : []));
  } catch (err) {
    console.warn("[rag] Embedding dokumen gagal:", err instanceof Error ? err.message : err);
    return texts.map(() => []);
  }
}

/**
 * Kembalikan embedding untuk setiap potongan (urutan sama dengan `chunks`).
 * Potongan yang gagal di-embed mendapat array kosong dan otomatis dicari lewat skor kata kunci saja.
 */
export async function getChunkEmbeddings<M extends ChunkMetadata>(
  chunks: Document<M>[],
  embeddings: Embeddings,
  modelKey: string,
): Promise<number[][]> {
  const hashes = chunks.map((c) => chunkHash(modelKey, c.pageContent));
  const client = getServiceClient();

  // Tanpa service role: embed langsung di memori seperti sebelumnya
  if (!client) return embedSafely(embeddings, chunks.map((c) => c.pageContent));

  const byHash = new Map<string, number[]>();
  const existingIds: string[] = [];
  const { data, error } = await client.from("rag_chunks").select("id, content_hash, embedding");
  if (error) {
    console.warn("[rag] Gagal membaca rag_chunks, embed ulang di memori:", error.message);
    return embedSafely(embeddings, chunks.map((c) => c.pageContent));
  }
  for (const row of (data ?? []) as StoredRow[]) {
    existingIds.push(row.id);
    const vector = parseVector(row.embedding);
    if (vector.length) byHash.set(row.content_hash, vector);
  }

  const missing = chunks.map((c, i) => ({ chunk: c, hash: hashes[i] })).filter(({ hash }) => !byHash.has(hash));
  if (missing.length) {
    console.log(`[rag] Meng-embed ${missing.length} dari ${chunks.length} potongan yang baru/berubah.`);
    const vectors = await embedSafely(embeddings, missing.map((m) => m.chunk.pageContent));

    const rows = missing
      .map((m, i) => ({ m, vector: vectors[i] }))
      .filter(({ vector }) => vector.length > 0)
      .map(({ m, vector }) => {
        byHash.set(m.hash, vector);
        return {
          id: m.chunk.metadata.id,
          parent_id: m.chunk.metadata.parentId ?? m.chunk.metadata.id,
          content_hash: m.hash,
          content: m.chunk.pageContent,
          metadata: m.chunk.metadata,
          model: modelKey,
          embedding: toPgVector(vector),
          updated_at: new Date().toISOString(),
        };
      });

    if (rows.length) {
      const { error: upsertError } = await client.from("rag_chunks").upsert(rows, { onConflict: "id" });
      if (upsertError) console.warn("[rag] Gagal menyimpan embedding:", upsertError.message);
    }
  }

  // Hapus potongan yang sudah tidak ada (konten dihapus atau jumlah potongan berkurang)
  const currentIds = new Set(chunks.map((c) => c.metadata.id));
  const stale = existingIds.filter((id) => !currentIds.has(id));
  if (stale.length) {
    const { error: deleteError } = await client.from("rag_chunks").delete().in("id", stale);
    if (deleteError) console.warn("[rag] Gagal menghapus potongan lama:", deleteError.message);
  }

  return hashes.map((h) => byHash.get(h) ?? []);
}

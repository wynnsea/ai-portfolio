import { Document } from "@langchain/core/documents";

/**
 * Chunking untuk RAG.
 *
 * Dokumen panjang (artikel blog, detail proyek, daftar sertifikasi) dipecah jadi potongan kecil
 * supaya embedding tiap potongan fokus ke satu topik. Retrieval jadi lebih presisi, dan konteks
 * yang dikirim ke LLM cuma bagian yang relevan, bukan seluruh artikel.
 *
 * Strateginya "recursive": coba pecah per paragraf dulu, lalu per baris, per kalimat, baru per kata.
 * Antar-potongan diberi overlap supaya kalimat di perbatasan tidak kehilangan konteks.
 */

export type ChunkOptions = {
  /** Panjang maksimal satu potongan (karakter). */
  chunkSize: number;
  /** Karakter dari akhir potongan sebelumnya yang diulang di awal potongan berikutnya. */
  overlap: number;
};

export const DEFAULT_CHUNK_OPTIONS: ChunkOptions = { chunkSize: 900, overlap: 150 };

const SEPARATORS = ["\n\n", "\n", ". ", " "];

/** Pecah teks jadi potongan ≤ chunkSize, memotong di batas paling "alami" yang tersedia. */
export function splitText(text: string, options: ChunkOptions = DEFAULT_CHUNK_OPTIONS): string[] {
  const clean = text.trim();
  if (clean.length <= options.chunkSize) return clean ? [clean] : [];
  return mergeWithOverlap(splitRecursive(clean, options.chunkSize, 0, ""), options);
}

/** Potongan kecil + pemisah yang dipakai untuk menyambungnya ke potongan sebelumnya. */
type Piece = { text: string; joiner: string };

function splitRecursive(text: string, chunkSize: number, level: number, joiner: string): Piece[] {
  if (text.length <= chunkSize) return [{ text, joiner }];

  if (level >= SEPARATORS.length) {
    // Tidak ada pemisah lagi (mis. URL sangat panjang): potong paksa
    const out: Piece[] = [];
    for (let i = 0; i < text.length; i += chunkSize) out.push({ text: text.slice(i, i + chunkSize), joiner: i ? "" : joiner });
    return out;
  }

  const sep = SEPARATORS[level];
  const parts = text.split(sep).filter((p) => p.trim());
  if (parts.length <= 1) return splitRecursive(text, chunkSize, level + 1, joiner);

  const partJoiner = sep === "\n\n" || sep === "\n" ? sep : " ";
  return parts.flatMap((part, i) => {
    // Kembalikan titik yang ikut terbuang saat memecah per kalimat
    const restored = sep === ". " && i < parts.length - 1 ? `${part}.` : part;
    return splitRecursive(restored.trim(), chunkSize, level + 1, i === 0 ? joiner : partJoiner);
  });
}

function mergeWithOverlap(pieces: Piece[], { chunkSize, overlap }: ChunkOptions): string[] {
  const chunks: string[] = [];
  let current = "";

  for (const piece of pieces) {
    const candidate = current ? current + (piece.joiner || " ") + piece.text : piece.text;
    if (candidate.length <= chunkSize) {
      current = candidate;
      continue;
    }
    if (current) chunks.push(current.trim());
    const tail = overlapTail(current, overlap);
    current = tail && tail.length + piece.text.length + 1 <= chunkSize ? `${tail} ${piece.text}` : piece.text;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

/** Ambil ±`overlap` karakter terakhir, dimulai di awal kata supaya tidak terpotong di tengah kata. */
function overlapTail(text: string, overlap: number): string {
  if (overlap <= 0 || !text) return "";
  const slice = text.trim().slice(-overlap);
  const firstSpace = slice.indexOf(" ");
  return (firstSpace > 0 ? slice.slice(firstSpace + 1) : slice).trim();
}

export type ChunkMetadata = {
  id: string;
  /** id dokumen asal, sama untuk semua potongan dari dokumen yang sama */
  parentId?: string;
  chunkIndex?: number;
  chunkCount?: number;
};

/**
 * Pecah dokumen jadi potongan. Baris pertama dokumen dianggap judul dan diulang di setiap potongan,
 * supaya potongan tengah artikel tetap "tahu" ia bagian dari artikel apa (penting untuk embedding).
 */
export function chunkDocuments<M extends ChunkMetadata>(
  docs: Document<M>[],
  options: ChunkOptions = DEFAULT_CHUNK_OPTIONS,
): Document<M>[] {
  const out: Document<M>[] = [];

  for (const doc of docs) {
    const parentId = doc.metadata.id;
    if (doc.pageContent.length <= options.chunkSize) {
      out.push(
        new Document<M>({
          pageContent: doc.pageContent,
          metadata: { ...doc.metadata, parentId, chunkIndex: 0, chunkCount: 1 },
        }),
      );
      continue;
    }

    const newline = doc.pageContent.indexOf("\n");
    const header = newline > 0 ? doc.pageContent.slice(0, newline).trim() : "";
    const body = newline > 0 ? doc.pageContent.slice(newline + 1) : doc.pageContent;
    const bodyChunks = splitText(body, { ...options, chunkSize: Math.max(200, options.chunkSize - header.length - 20) });

    bodyChunks.forEach((chunk, i) => {
      out.push(
        new Document<M>({
          pageContent: header ? `${header} (bagian ${i + 1}/${bodyChunks.length})\n${chunk}` : chunk,
          metadata: {
            ...doc.metadata,
            id: `${parentId}#${i + 1}`,
            parentId,
            chunkIndex: i,
            chunkCount: bodyChunks.length,
          },
        }),
      );
    });
  }

  return out;
}

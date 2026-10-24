// Konversi isi artikel antara blok (format database) dan teks di textarea admin.
// Formatnya bolak-balik tanpa kehilangan struktur:
//   paragraf      → teks biasa, dipisah baris kosong
//   ## Subjudul   → blok h2
//   - poin        → blok list (baris berurutan)
//   > kutipan     → blok quote
//   ```bahasa     → blok code sampai ``` penutup
import type { PostBlock } from "@/lib/posts";

export function blocksToText(blocks: PostBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "h2":
          return `## ${block.text}`;
        case "quote":
          return `> ${block.text}`;
        case "list":
          return block.items.map((item) => `- ${item}`).join("\n");
        case "code":
          return `\`\`\`${block.lang}\n${block.code}\n\`\`\``;
        default:
          return block.text;
      }
    })
    .join("\n\n");
}

const isSpecial = (line: string) => /^(## |> |[-*] |```)/.test(line);

export function textToBlocks(text: string): PostBlock[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: PostBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
    } else if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) code.push(lines[i++]);
      i++; // lewati ``` penutup
      blocks.push({ type: "code", lang, code: code.join("\n") });
    } else if (line.startsWith("## ")) {
      blocks.push({ type: "h2", text: line.slice(3).trim() });
      i++;
    } else if (line.startsWith("> ")) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) quote.push(lines[i++].slice(2).trim());
      blocks.push({ type: "quote", text: quote.join(" ") });
    } else if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) items.push(lines[i++].slice(2).trim());
      blocks.push({ type: "list", items });
    } else {
      const paragraph: string[] = [];
      while (i < lines.length && lines[i].trim() && !isSpecial(lines[i])) paragraph.push(lines[i++].trim());
      blocks.push({ type: "p", text: paragraph.join(" ") });
    }
  }

  return blocks;
}

/** Perkiraan waktu baca: sekitar 200 kata per menit. */
export function readTimeOf(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} menit baca`;
}

/** "Cerita Bikin AI!" → "cerita-bikin-ai" */
export function slugify(title: string): string {
  const slug = title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "tanpa-judul";
}

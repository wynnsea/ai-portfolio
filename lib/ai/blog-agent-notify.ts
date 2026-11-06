import { sendOwnerEmail } from "@/lib/contact-guard";
import { siteUrl } from "@/lib/site-url";
import type { AgentRunResult } from "@/lib/ai/blog-agent";

/** Email ke pemilik saat agen selesai membuat draft atau gagal. */
export async function notifyAgentResult(result: AgentRunResult) {
  const reviewUrl = new URL("/admin/agen-blog", siteUrl).toString();
  if (result.status === "created") {
    await sendOwnerEmail({
      subject: `[Agen Blog] Draft baru: ${result.title}`,
      text: [
        `Agen blog baru saja menulis draft "${result.title}".`,
        "",
        result.notes.length ? `Yang perlu kamu cek/lengkapi:\n${result.notes.map((n) => `- ${n}`).join("\n")}` : "Tidak ada catatan khusus.",
        "",
        `Review, minta revisi, atau terbitkan di: ${reviewUrl}`,
      ].join("\n"),
    });
  } else if (result.status === "error") {
    await sendOwnerEmail({
      subject: "[Agen Blog] Gagal membuat draft",
      text: `Agen blog gagal membuat draft terjadwal.\n\nError: ${result.error}\n\nCek di: ${reviewUrl}`,
    });
  }
}

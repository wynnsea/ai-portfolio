import { requireAdmin } from "@/lib/admin-auth";
import { reviseBlogPost, runBlogAgent } from "@/lib/ai/blog-agent";

export const maxDuration = 300;

/**
 * Aksi Agen Blog dari panel admin:
 * - { action: "generate" }                      → buat draft sekarang (mengabaikan jadwal)
 * - { action: "revise", postId, feedback }      → revisi draft sesuai masukan
 */
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);

  if (body?.action === "generate") {
    const result = await runBlogAgent(auth.client, { force: true });
    const status = result.status === "error" ? 500 : result.status === "skipped" ? 409 : 200;
    return Response.json(result, { status });
  }

  if (body?.action === "revise") {
    const postId = Number(body.postId);
    const feedback = typeof body.feedback === "string" ? body.feedback.trim().slice(0, 2000) : "";
    if (!Number.isInteger(postId) || feedback.length < 3) {
      return Response.json({ error: "Artikel atau masukan revisi tidak valid." }, { status: 400 });
    }
    const result = await reviseBlogPost(auth.client, postId, feedback);
    return Response.json(result, { status: result.ok ? 200 : 500 });
  }

  return Response.json({ error: "Aksi tidak dikenal." }, { status: 400 });
}

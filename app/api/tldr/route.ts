import { runBlogTldrGraph } from "@/lib/ai/workflows";
import { getPublicPost } from "@/lib/public-api";
import { getPost } from "@/lib/posts";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const slug = typeof body?.slug === "string" ? body.slug : null;
  if (!slug) {
    return Response.json({ error: "Slug artikel wajib diisi" }, { status: 400 });
  }

  const publicPost = await getPublicPost(slug).catch(() => null);
  const post = publicPost ?? getPost(slug) ?? null;
  if (!post) {
    return Response.json({ error: "Artikel tidak ditemukan" }, { status: 404 });
  }

  const points = await runBlogTldrGraph(post);
  return Response.json({ points });
}

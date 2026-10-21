import { mockTldr, wait } from "@/lib/ai/mock";

// DEMO: ganti mockTldr dengan LLM yang merangkum isi artikel (hasilnya sebaiknya di-cache).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const points = typeof body?.slug === "string" ? mockTldr(body.slug) : null;
  if (!points) return Response.json({ error: "Artikel tidak ditemukan" }, { status: 404 });

  await wait(900 + Math.random() * 500);
  return Response.json({ points });
}

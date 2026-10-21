import { mockSeaReply, wait } from "@/lib/ai/mock";

// DEMO: ganti mockSeaReply dengan panggilan LLM asli (API key disimpan di env server).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.slice(0, 500) : "";
  if (!message.trim()) return Response.json({ error: "Pesan kosong" }, { status: 400 });

  await wait(700 + Math.random() * 600);
  return Response.json(mockSeaReply(message));
}

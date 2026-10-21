import { mockJobMatch, wait } from "@/lib/ai/mock";

// DEMO: ganti mockJobMatch dengan LLM + output terstruktur (skema JobMatchResult).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const jd = typeof body?.jd === "string" ? body.jd.slice(0, 6000) : "";
  if (jd.trim().length < 20) return Response.json({ error: "Deskripsi lowongan terlalu pendek" }, { status: 400 });

  await wait(1400 + Math.random() * 800);
  return Response.json(mockJobMatch(jd));
}

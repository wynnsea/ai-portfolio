import { mockExplain, wait } from "@/lib/ai/mock";
import type { ExplainLevel } from "@/lib/ai/types";

const LEVELS: ExplainLevel[] = ["recruiter", "engineer", "awam"];

// DEMO: ganti mockExplain dengan LLM yang menulis ulang isi project sesuai level pembaca.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const level = LEVELS.find((l) => l === body?.level);
  const text = level && typeof body?.slug === "string" ? mockExplain(body.slug, level) : null;
  if (!text) return Response.json({ error: "Project atau level tidak valid" }, { status: 400 });

  await wait(800 + Math.random() * 500);
  return Response.json({ text });
}

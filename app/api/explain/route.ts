import { mockExplain, wait } from "@/lib/ai/mock";
import type { ExplainLevel } from "@/lib/ai/types";
import { getPublicProject, getPublicSettings } from "@/lib/public-api";

const LEVELS: ExplainLevel[] = ["recruiter", "engineer", "awam"];

// DEMO: ganti mockExplain dengan LLM yang menulis ulang isi project sesuai level pembaca.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const level = LEVELS.find((l) => l === body?.level);
  const slug = typeof body?.slug === "string" ? body.slug : null;
  const [project, settings] = slug
    ? await Promise.all([getPublicProject(slug), getPublicSettings()])
    : [null, null];
  const text = level && project && settings ? mockExplain(project.slug, level, project, settings.name) : null;
  if (!text) return Response.json({ error: "Project atau level tidak valid" }, { status: 400 });

  await wait(800 + Math.random() * 500);
  return Response.json({ text });
}

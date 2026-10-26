import type { ExplainLevel } from "@/lib/ai/types";
import { runProjectExplainGraph } from "@/lib/ai/workflows";
import { getPublicProject, getPublicSettings } from "@/lib/public-api";
import { getProject } from "@/lib/projects";
import { site } from "@/lib/site";

const LEVELS: ExplainLevel[] = ["recruiter", "engineer", "awam"];

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const level = LEVELS.find((l) => l === body?.level);
  const slug = typeof body?.slug === "string" ? body.slug : null;
  if (!level || !slug) {
    return Response.json({ error: "Project atau level tidak valid" }, { status: 400 });
  }

  const [publicProject, settings] = await Promise.all([
    getPublicProject(slug).catch(() => null),
    getPublicSettings().catch(() => null),
  ]);

  const project = publicProject ?? getProject(slug) ?? null;
  if (!project) {
    return Response.json({ error: "Project tidak ditemukan" }, { status: 404 });
  }

  const ownerName = settings?.name ?? site.name;
  const text = await runProjectExplainGraph(project, level, ownerName);

  return Response.json({ text });
}

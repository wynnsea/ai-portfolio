import { runJobMatchGraph } from "@/lib/ai/job-match";
import { getPublicProjects, getPublicSettings } from "@/lib/public-api";
import { projects as fallbackProjects } from "@/lib/projects";
import { site } from "@/lib/site";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const jd = typeof body?.jd === "string" ? body.jd.slice(0, 6000) : "";
  if (jd.trim().length < 20) {
    return Response.json({ error: "Deskripsi lowongan terlalu pendek" }, { status: 400 });
  }

  const [projects, settings] = await Promise.all([
    getPublicProjects().catch(() => fallbackProjects),
    getPublicSettings().catch(() => null),
  ]);

  const ownerName = settings?.name ?? site.name;
  const { result, notAJobError, model } = await runJobMatchGraph({
    jd,
    projects,
    ownerName,
  });

  if (notAJobError) {
    return Response.json({ error: notAJobError }, { status: 422 });
  }

  if (model) {
    console.log(`[job-match] dijawab oleh LangGraph (${model})`);
  }

  return Response.json(result);
}

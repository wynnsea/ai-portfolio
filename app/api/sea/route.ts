import { runSeaRagAgent, type ChatTurn } from "@/lib/ai/sea-graph";
import {
  getPublicActivities,
  getPublicCertifications,
  getPublicPosts,
  getPublicProjects,
  getPublicSettings,
} from "@/lib/public-api";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.slice(0, 500) : "";
  if (!message.trim()) return Response.json({ error: "Pesan kosong" }, { status: 400 });

  const rawHistory: unknown[] = Array.isArray(body?.history) ? body.history : [];
  const history: ChatTurn[] = rawHistory
    .filter(
      (item: unknown): item is { role: "user" | "assistant"; text: string } =>
        typeof item === "object" &&
        item !== null &&
        ((item as { role?: unknown }).role === "user" || (item as { role?: unknown }).role === "assistant") &&
        typeof (item as { text?: unknown }).text === "string" &&
        Boolean((item as { text: string }).text.trim()),
    )
    .slice(-6)
    .map((item: { role: "user" | "assistant"; text: string }) => ({
      role: item.role,
      text: item.text.slice(0, 500),
    }));

  const [projects, posts, certifications, activities, settings] = await Promise.all([
    getPublicProjects(),
    getPublicPosts(),
    getPublicCertifications(),
    getPublicActivities(),
    getPublicSettings(),
  ]);

  const reply = await runSeaRagAgent({
    message,
    history,
    knowledgeInput: { projects, posts, certifications, activities, settings },
  });

  return Response.json(reply);
}

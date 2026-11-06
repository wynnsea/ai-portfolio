import { limitAiRequest, type RateLimitRule } from "@/lib/rate-limit";
import { runSemanticSearch } from "@/lib/ai/workflows";

const RATE_LIMIT: RateLimitRule = { name: "search", limit: 60, windowSeconds: 10 * 60 };

export async function POST(request: Request) {
  const limited = await limitAiRequest(request, RATE_LIMIT);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const query = typeof body?.query === "string" ? body.query.slice(0, 200) : "";

  const items = await runSemanticSearch(query);
  return Response.json({ items });
}

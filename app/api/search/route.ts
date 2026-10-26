import { runSemanticSearch } from "@/lib/ai/workflows";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const query = typeof body?.query === "string" ? body.query.slice(0, 200) : "";

  const items = await runSemanticSearch(query);
  return Response.json({ items });
}

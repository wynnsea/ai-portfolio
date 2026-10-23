import { mockJobMatch } from "@/lib/ai/mock";
import { extractJob } from "@/lib/ai/job-match";
import { buildJobMatchResult, scoreJob } from "@/lib/ai/job-match-score";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const jd = typeof body?.jd === "string" ? body.jd.slice(0, 6000) : "";
  if (jd.trim().length < 20) return Response.json({ error: "Deskripsi lowongan terlalu pendek" }, { status: 400 });

  const ai = await extractJob(jd);

  // Semua model gagal atau API key tidak ada → cadangan mock
  if (!ai) return Response.json(mockJobMatch(jd));

  if (!ai.data.isJobPosting) {
    return Response.json(
      { error: "Teks ini kayaknya bukan lowongan kerja. Coba tempel deskripsi lowongan ya." },
      { status: 422 },
    );
  }

  console.log(`[job-match] dijawab oleh ${ai.model}`);
  return Response.json(buildJobMatchResult(ai.data, scoreJob(ai.data)));
}

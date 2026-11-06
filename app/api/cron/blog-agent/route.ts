import { after } from "next/server";
import { runBlogAgent } from "@/lib/ai/blog-agent";
import { notifyAgentResult } from "@/lib/ai/blog-agent-notify";
import { getServiceClient } from "@/lib/supabase/server";

// Menulis artikel bisa makan 1-3 menit (Vercel Hobby + Fluid Compute mengizinkan sampai 300 detik).
export const maxDuration = 300;

/**
 * Dipanggil Vercel Cron sekali sehari (lihat vercel.json). Vercel otomatis mengirim
 * `Authorization: Bearer <CRON_SECRET>` kalau env CRON_SECRET diisi.
 * Agen sendiri yang memutuskan apakah sudah waktunya menulis (interval di pengaturan admin).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "CRON_SECRET belum diatur." }, { status: 500 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getServiceClient();
  if (!db) return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY belum diatur." }, { status: 500 });

  const result = await runBlogAgent(db);
  after(() => notifyAgentResult(result));
  return Response.json(result, { status: result.status === "error" ? 500 : 200 });
}

import { scoreJob } from "@/lib/ai/job-match-score";
import type { Extraction } from "@/lib/ai/job-match";

// Hasil ekstraksi ditulis manual, jadi tesnya gratis, instan, dan hasilnya selalu sama
const kasus: Record<string, Extraction> = {
  normal: {
    isJobPosting: true,
    position: "Junior AI Engineer",
    seniority: "junior",
    requirements: [
        {
        "text": "Integrasi API LLM OpenAI Claude",
        "importance": "wajib",
        "skillId": "llm-api",
        "relevan": true
      },
      {
        "text": "Membangun pipeline RAG",
        "importance": "wajib",
        "skillId": "lainnya",
        "relevan": true
      },
      {
        "text": "Mengelola vector database",
        "importance": "wajib",
        "skillId": "lainnya",
        "relevan": true
      },
      {
        "text": "Membuat API Python FastAPI",
        "importance": "wajib",
        "skillId": "lainnya",
        "relevan": true
      },
      {
        "text": "Pengembangan frontend Next.js",
        "importance": "wajib",
        "skillId": "lainnya",
        "relevan": true
      },
      {
        "text": "Memahami prompt engineering",
        "importance": "wajib",
        "skillId": "lainnya",
        "relevan": true
      },
      {
        "text": "Memahami Docker",
        "importance": "wajib",
        "skillId": "lainnya",
        "relevan": true
      },
      {
        "text": "Pengalaman AWS",
        "importance": "plus",
        "skillId": "lainnya",
        "relevan": true
      },
      {
        "text": "Pengalaman Kubernetes",
        "importance": "plus",
        "skillId": "kubernetes",
        "relevan": true
      },
      {
        "text": "Menguasai bahasa Jepang",
        "importance": "plus",
        "skillId": "lainnya",
        "relevan": true
      }
    ]
  },
}

for (const [nama, ex] of Object.entries(kasus)) {
  console.log(`\n=== ${nama} ===`);
  console.log(scoreJob(ex));
}

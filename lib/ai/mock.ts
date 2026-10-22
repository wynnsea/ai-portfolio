// DEMO: semua "jawaban AI" di file ini masih simulasi berbasis aturan sederhana.
// Saat integrasi beneran, ganti isi fungsi-fungsi ini dengan panggilan LLM
// (dari API route) dan kirim data profil/project sebagai konteks.
import { about, site } from "@/lib/site";
import { getProject, projects } from "@/lib/projects";
import { getPost, sortedPosts } from "@/lib/posts";
import { certifications } from "@/lib/certifications";
import { activities } from "@/lib/activities";
import type { ExplainLevel, JobMatchResult, SeaReply } from "@/lib/ai/types";

/** Jeda buatan supaya terasa seperti menunggu respons model. */
export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const has = (text: string, words: string[]) => words.some((w) => text.includes(w));
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
/** Data project ditulis dengan "saya"; SEA AI membicarakan Wayan sebagai orang ketiga. */
const thirdPerson = (s: string) => s.replace(/\bsaya\b/gi, site.name);

// ---------------------------------------------------------------------------
// SEA AI chat
// ---------------------------------------------------------------------------

export function mockSeaReply(message: string): SeaReply {
  const q = message.toLowerCase();
  const name = site.name;

  const project = projects.find((p) => q.includes(p.title.toLowerCase()) || q.includes(p.slug.replace("-", " ")));
  if (project) {
    return {
      reply: `${project.title} itu ${thirdPerson(lowerFirst(project.summary))} Di project ini ${name} jadi ${project.role} selama ${project.duration}, pakai ${project.stack.slice(0, 3).join(", ")}, dan lain-lain.`,
      action: { type: "navigate", href: `/projects/${project.slug}`, label: `Buka ${project.title}` },
    };
  }

  if (has(q, ["lowongan", "recruit", "hire", "hiring", "cocok", "job", "loker", "rekrut", "kandidat"])) {
    return {
      reply: `Kamu lagi nyari kandidat? Coba fitur Job Match: tempel deskripsi lowongannya, nanti saya cek seberapa cocok ${name} sama posisinya, lengkap sama project yang relevan.`,
      action: { type: "navigate", href: "/#job-match", label: "Coba Job Match" },
    };
  }

  if (has(q, ["project", "proyek", "portfolio", "portofolio", "karya", "bikin apa"])) {
    const list = projects.map((p) => p.title).join(", ");
    return {
      reply: `${name} udah ngerjain ${projects.length} project, di antaranya ${list}. Hampir semuanya soal integrasi AI ke produk nyata, dan banyak yang nyambung sama Jepang. Mau saya tunjukin yang mana?`,
      action: { type: "navigate", href: "/#projects", label: "Lihat semua project" },
    };
  }

  if (has(q, ["kegiatan", "organisasi", "fasilitator", "panitia", "volunteer", "relawan", "pemateri", "lomba", "aktivitas", "activit"])) {
    const roles = [...new Set(activities.map((a) => a.role.toLowerCase()))].slice(0, 4).join(", ");
    return {
      reply: `Di luar kerjaan, ${name} aktif di ${activities.length} kegiatan, misalnya jadi ${roles}. Salah satunya ${activities[0].title} sebagai ${activities[0].role.toLowerCase()}.`,
      action: { type: "navigate", href: "/#activities", label: "Lihat kegiatan" },
    };
  }

  if (has(q, ["sertifikat", "sertifikasi", "certif", "toefl", "itep", "jlpt", "bahasa inggris", "english"])) {
    const list = certifications.map((c) => c.title).join(", ");
    return {
      reply: `${name} punya ${certifications.length} sertifikasi: ${list}. Ada sertifikat bahasa Inggris (TOEFL & iTEP), bahasa Jepang (JLPT N4), dan kompetensi Junior Web Developer.`,
      action: { type: "navigate", href: "/#certifications", label: "Lihat sertifikasi" },
    };
  }

  if (has(q, ["skill", "bisa apa", "keahlian", "tech", "stack", "jago", "kemampuan"])) {
    const groups = about.skills.map((s) => `${s.group} (${s.items.slice(0, 3).join(", ")})`).join("; ");
    return {
      reply: `Skill utama ${name} ada di tiga area: ${groups}. Fokusnya lebih ke nyambungin AI ke aplikasi, bukan training model dari nol.`,
      action: { type: "navigate", href: "/#about", label: "Lihat detail skill" },
    };
  }

  if (has(q, ["kontak", "contact", "email", "hubungi", "linkedin", "github", "ngobrol"])) {
    return {
      reply: `Paling gampang lewat email ke ${site.email}. Bisa juga cek GitHub (github.com/wynnsea) atau LinkedIn-nya. ${name} biasanya fast response kok.`,
      action: { type: "navigate", href: "/#contact", label: "Ke bagian kontak" },
    };
  }

  if (has(q, ["kerja", "pengalaman", "experience", "kantor", "karier", "karir"])) {
    const [now, before] = about.experience;
    return {
      reply: `Sekarang ${name} kerja sebagai ${now.role} di ${now.company} (${now.period}). Sebelumnya dia jadi ${before.role} di ${before.company} (${before.period}), dan dari situ dia kebiasaan selalu mikirin sisi pengguna.`,
      action: { type: "navigate", href: "/#about", label: "Lihat pengalaman" },
    };
  }

  if (has(q, ["kuliah", "pendidikan", "takumi", "lulus", "kampus", "education"])) {
    const e = about.education;
    return {
      reply: `${name} lulusan ${e.degree} di ${e.school} (${e.period}). Tugas akhirnya bikin sistem absensi pakai face recognition.`,
      action: { type: "navigate", href: "/projects/face-attendance", label: "Lihat tugas akhirnya" },
    };
  }

  if (has(q, ["jepang", "japan", "nihongo", "anime", "jlpt", "kanji"])) {
    return {
      reply: `Yap, ${name} suka banget sama budaya Jepang! Itu kebawa ke project-nya juga, misalnya Nihongo Buddy (tutor bahasa Jepang pakai RAG) sama Kanji Lens (baca kanji dari kamera).`,
      action: { type: "navigate", href: "/projects/nihongo-buddy", label: "Buka Nihongo Buddy" },
    };
  }

  if (has(q, ["blog", "artikel", "tulisan", "nulis"])) {
    const latest = sortedPosts[0];
    return {
      reply: `Tulisan terbaru ${name} judulnya "${latest.title}". Isinya soal ${lowerFirst(latest.excerpt)}`,
      action: { type: "navigate", href: `/blog/${latest.slug}`, label: "Baca artikelnya" },
    };
  }

  if (has(q, ["halo", "hai", "hi", "hello", "pagi", "siang", "malam", "konnichiwa"])) {
    return { reply: `Haii! Saya SEA AI, asistennya ${name}. Kamu bisa tanya soal project, skill, pengalaman, atau cara ngontak dia.` };
  }

  return {
    reply: `Hmm, saya masih versi demo jadi belum ngerti semua pertanyaan. Coba tanya soal project, skill, pengalaman kerja, pendidikan, atau kontak ${name} ya!`,
  };
}

// ---------------------------------------------------------------------------
// Job Match
// ---------------------------------------------------------------------------

// Kosakata skill yang dikenali dari teks lowongan. `owned` = dimiliki Wayan.
// `patterns` berupa regex yang dicocokkan di awal kata, jadi "git" tidak cocok dengan "digital".
const SKILLS: { label: string; patterns: string[]; owned: boolean }[] = [
  { label: "Integrasi LLM API", patterns: ["llm", "openai", "gpt", "claude", "gemini", "large language model", "generative ai", "genai"], owned: true },
  { label: "RAG", patterns: ["rag\\b", "retrieval"], owned: true },
  { label: "Vector database", patterns: ["vector", "pgvector", "pinecone", "embedding"], owned: true },
  { label: "Prompt engineering", patterns: ["prompt"], owned: true },
  { label: "LangChain", patterns: ["langchain", "llamaindex"], owned: true },
  { label: "Python", patterns: ["python"], owned: true },
  { label: "TypeScript", patterns: ["typescript", "javascript"], owned: true },
  { label: "React", patterns: ["react"], owned: true },
  { label: "Next.js", patterns: ["next\\.?js"], owned: true },
  { label: "FastAPI", patterns: ["fastapi", "flask"], owned: true },
  { label: "REST API", patterns: ["rest\\b", "restful", "api\\b"], owned: true },
  { label: "PostgreSQL", patterns: ["postgres", "sql", "mysql"], owned: true },
  { label: "Docker", patterns: ["docker", "container"], owned: true },
  { label: "Git", patterns: ["git\\b", "github", "gitlab"], owned: true },
  { label: "Computer vision", patterns: ["computer vision", "opencv", "vision"], owned: true },
  { label: "Bahasa Jepang (JLPT N4)", patterns: ["jepang", "japanese", "jlpt"], owned: true },
  { label: "Bahasa Inggris (TOEFL, iTEP)", patterns: ["inggris", "english", "toefl", "ielts"], owned: true },
  { label: "Kubernetes", patterns: ["kubernetes", "k8s"], owned: false },
  { label: "AWS / GCP", patterns: ["aws", "gcp", "google cloud", "azure"], owned: false },
  { label: "Fine-tuning model", patterns: ["fine-?tun", "training model", "pytorch", "tensorflow"], owned: false },
  { label: "MLOps", patterns: ["mlops", "mlflow"], owned: false },
  { label: "Java / Go", patterns: ["java(?!script)", "golang"], owned: false },
  { label: "Data engineering", patterns: ["spark", "airflow", "etl\\b", "data pipeline"], owned: false },
];

const matchesSkill = (text: string, patterns: string[]) =>
  patterns.some((p) => new RegExp(`(^|[^a-z])${p}`, "i").test(text));

export function mockJobMatch(jd: string): JobMatchResult {
  const text = jd.toLowerCase();
  const found = SKILLS.filter((s) => matchesSkill(text, s.patterns));
  const matched = found.filter((s) => s.owned).map((s) => s.label);
  const missing = found.filter((s) => !s.owned).map((s) => s.label);

  // Kalau skill yang terdeteksi sedikit, skor ditarik ke tengah (kurang yakin)
  const raw = found.length ? matched.length / found.length : 0.5;
  const confidence = Math.min(1, found.length / 5);
  const score = Math.round(Math.min(96, Math.max(30, 50 + (raw * 100 - 50) * confidence - missing.length * 2)));

  const ranked = projects
    .map((p) => {
      const hay = `${p.category} ${p.stack.join(" ")} ${p.summary}`.toLowerCase();
      const hits = found.filter((s) => matchesSkill(hay, s.patterns)).map((s) => s.label);
      return { p, hits };
    })
    .sort((a, b) => b.hits.length - a.hits.length)
    .slice(0, 3);

  const verdict = score >= 80 ? "Cocok banget" : score >= 60 ? "Cukup cocok" : "Ada beberapa gap";
  const unsure = found.length < 3 ? " (tapi saya cuma nemu sedikit skill teknis, jadi kurang yakin)" : "";

  return {
    score,
    summary: found.length
      ? `${verdict}${unsure}! ${site.name} udah punya ${matched.length} dari ${found.length} skill yang disebut di lowongan ini. ${
          missing.length ? `Yang masih perlu dikejar: ${missing.join(", ")}.` : "Gak ada skill yang kelewat."
        } Fokusnya di integrasi AI juga pas buat posisi yang banyak nyambungin LLM ke produk.`
      : "Saya gak nemu skill teknis spesifik di teks ini. Coba tempel deskripsi lowongan yang lebih lengkap biar analisisnya lebih akurat.",
    matched,
    missing,
    projects: ranked.map(({ p, hits }) => ({
      slug: p.slug,
      title: p.title,
      reason: hits.length ? `Nyambung lewat ${hits.slice(0, 3).join(", ")}` : p.category,
    })),
  };
}

// ---------------------------------------------------------------------------
// Penjelas project per level
// ---------------------------------------------------------------------------

export function mockExplain(slug: string, level: ExplainLevel): string | null {
  const p = getProject(slug);
  if (!p) return null;
  const name = site.name;
  const summary = thirdPerson(p.summary);
  const results = p.results.map((r) => `${r.label.toLowerCase()} ${r.value}`).join(", ");

  if (level === "recruiter") {
    return `Singkatnya, ${p.title} adalah ${lowerFirst(summary)} ${name} pegang peran ${p.role} selama ${p.duration}. Hasil yang kelihatan: ${results}. Skill yang kepake di sini: ${p.stack.slice(0, 4).join(", ")}. Ini nunjukin dia bisa bawa AI dari ide sampai jadi produk yang dipakai orang.`;
  }
  if (level === "engineer") {
    const steps = p.approach.map((a, i) => `(${i + 1}) ${lowerFirst(thirdPerson(a)).replace(/\.$/, "")}`).join("; ");
    return `Stack: ${p.stack.join(", ")}. Masalah utamanya: ${lowerFirst(thirdPerson(p.challenge))} Pendekatannya: ${steps}. Metrik akhirnya ${results}.`;
  }
  return `Bayangin kamu punya temen yang pinter banget tapi kadang suka asal jawab. ${p.title} itu caranya ${name} ngarahin temen pinter itu (AI) biar jawabannya bener dan berguna. Hasilnya? ${summary} Jadi ${name} gak bikin otak AI-nya dari nol, tapi bikin AI yang udah ada jadi gampang dan aman dipakai siapa aja.`;
}

// ---------------------------------------------------------------------------
// TL;DR artikel
// ---------------------------------------------------------------------------

export function mockTldr(slug: string): string[] | null {
  const post = getPost(slug);
  if (!post) return null;
  const headings = post.content.flatMap((b) => (b.type === "h2" ? [b.text.replace(/^\d+\.\s*/, "")] : []));
  const quote = post.content.find((b) => b.type === "quote");
  return [
    ...headings.slice(0, 3).map((h) => `Poin penting: ${lowerFirst(h)}.`),
    ...(quote?.type === "quote" ? [`Intinya: ${quote.text}`] : []),
    `Artikel aslinya ${post.readTime}, ringkasan ini cuma butuh 20 detik.`,
  ];
}

import { Document } from "@langchain/core/documents";
import { Embeddings } from "@langchain/core/embeddings";
import { VectorStore } from "@langchain/core/vectorstores";
import { about, site } from "@/lib/site";
import { projects as fallbackProjects, type Project } from "@/lib/projects";
import { sortedPosts as fallbackPosts, type Post } from "@/lib/posts";
import { certifications as fallbackCertifications, type Certification } from "@/lib/certifications";
import { activities as fallbackActivities, type Activity } from "@/lib/activities";
import { skillProfile } from "@/lib/ai/skill-profile";
import type { SiteSettings } from "@/lib/public-api";
import {
  getPublicActivities,
  getPublicCertifications,
  getPublicPosts,
  getPublicProjects,
  getPublicSettings,
} from "@/lib/public-api";
import { createEmbeddingsModel, GEMINI_EMBEDDING_MODELS, getGeminiApiKey } from "@/lib/ai/langchain-llm";
import type { SearchItem } from "@/lib/ai/types";

export type PortfolioKnowledgeInput = {
  projects?: Project[];
  posts?: Post[];
  certifications?: Certification[];
  activities?: Activity[];
  settings?: SiteSettings;
};

export type PortfolioDocMetadata = {
  id: string;
  category: "identity" | "skills" | "experience" | "project" | "certification" | "activity" | "blog" | "feature";
  title: string;
  subtitle?: string;
  href?: string;
  actionLabel?: string;
  searchType?: SearchItem["type"];
  slug?: string;
  keywords?: string;
};

const STOPWORDS = new Set([
  "yang", "di", "ke", "dari", "dan", "atau", "untuk", "buat", "dengan", "pada", "adalah", "itu", "ini",
  "saya", "aku", "kamu", "dia", "apa", "aja", "saja", "bagaimana", "gimana", "siapa", "kapan", "dimana",
  "the", "a", "an", "of", "to", "in", "for", "on", "with", "is", "are", "tentang", "soal", "nya",
]);

const SYNONYM_MAP: Record<string, string[]> = {
  proyek: ["project", "portfolio", "portofolio", "karya", "aplikasi", "sistem"],
  project: ["proyek", "portfolio", "portofolio", "karya"],
  kerja: ["pengalaman", "experience", "karier", "karir", "kantor", "perusahaan", "riwayat"],
  pengalaman: ["kerja", "experience", "karier", "karir", "magang"],
  kuliah: ["pendidikan", "kampus", "education", "takumi", "politeknik", "lulusan", "d3"],
  pendidikan: ["kuliah", "kampus", "education", "takumi", "politeknik"],
  sertifikat: ["sertifikasi", "certification", "jlpt", "toefl", "itep", "bnsp", "lisensi"],
  sertifikasi: ["sertifikat", "certification", "jlpt", "toefl", "itep", "bnsp"],
  jepang: ["japan", "japanese", "nihongo", "jlpt", "n4", "kanji", "bunkasai", "kaizen", "minori"],
  inggris: ["english", "toefl", "itep", "b1"],
  skill: ["keahlian", "kemampuan", "stack", "teknologi", "tech", "bisa", "jago"],
  keahlian: ["skill", "kemampuan", "stack", "teknologi", "tech"],
  kontak: ["contact", "email", "hubungi", "linkedin", "github", "wa", "pesan", "hire"],
  kegiatan: ["aktivitas", "organisasi", "volunteer", "fasilitator", "panitia", "acara", "komunitas"],
  blog: ["artikel", "tulisan", "post", "bacaan"],
  artikel: ["blog", "tulisan", "post"],
  rekruter: ["recruiter", "hrd", "lowongan", "loker", "hiring", "rekrut", "cocok", "kandidat"],
};

function tokenize(text: string): string[] {
  const raw = text
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u30ff\u4e00-\u9faf\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));

  const expanded = new Set<string>();
  for (const token of raw) {
    expanded.add(token);
    const syns = SYNONYM_MAP[token];
    if (syns) {
      for (const s of syns) expanded.add(s);
    }
  }
  return [...expanded];
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function lexicalSimilarity(query: string, docText: string, title = ""): number {
  const qTokens = tokenize(query);
  if (!qTokens.length) return 0;
  const hayLower = `${title} ${docText}`.toLowerCase();
  const titleLower = title.toLowerCase();

  let hits = 0;
  for (const token of qTokens) {
    if (titleLower.includes(token)) {
      hits += 2.0;
    } else if (hayLower.includes(token)) {
      hits += 1.0;
    }
  }
  return Math.min(1, hits / (qTokens.length * 1.35));
}

/**
 * Custom LangChain In-Memory VectorStore dengan Hybrid Search
 * (Dense Gemini Embeddings Cosine Similarity + Lexical Keyword Scoring).
 */
export class PortfolioVectorStore extends VectorStore {
  declare FilterType: (doc: Document<PortfolioDocMetadata>) => boolean;

  private memoryVectors: {
    content: string;
    embedding: number[];
    metadata: PortfolioDocMetadata;
  }[] = [];

  private queryEmbeddingCache = new Map<string, number[]>();

  private hasDenseEmbeddings = false;

  _vectorstoreType(): string {
    return "portfolio_hybrid_memory";
  }

  constructor(embeddings: Embeddings) {
    super(embeddings, {});
  }

  getDocuments(): Document<PortfolioDocMetadata>[] {
    return this.memoryVectors.map(
      (v) =>
        new Document<PortfolioDocMetadata>({
          pageContent: v.content,
          metadata: v.metadata,
        }),
    );
  }

  async addDocuments(documents: Document<PortfolioDocMetadata>[]): Promise<void> {
    const texts = documents.map((d) => d.pageContent);
    let vectors: number[][] = [];

    if (getGeminiApiKey()) {
      for (const modelName of GEMINI_EMBEDDING_MODELS) {
        try {
          const embModel = createEmbeddingsModel(modelName);
          vectors = await embModel.embedDocuments(texts);
          if (vectors.length === documents.length && vectors[0]?.length > 0) {
            this.embeddings = embModel;
            this.hasDenseEmbeddings = true;
            break;
          }
        } catch (err) {
          console.warn(`[rag] Embeddings model ${modelName} gagal, mencoba fallback:`, err instanceof Error ? err.message : err);
        }
      }
    }

    if (!this.hasDenseEmbeddings) {
      vectors = documents.map(() => []);
    }

    await this.addVectors(vectors, documents);
  }

  async addVectors(vectors: number[][], documents: Document<PortfolioDocMetadata>[]): Promise<void> {
    for (let i = 0; i < documents.length; i++) {
      this.memoryVectors.push({
        content: documents[i].pageContent,
        embedding: vectors[i] ?? [],
        metadata: documents[i].metadata as PortfolioDocMetadata,
      });
    }
  }

  async similaritySearchVectorWithScore(
    queryVector: number[],
    k: number,
    filter?: this["FilterType"],
  ): Promise<[Document<PortfolioDocMetadata>, number][]> {
    const results: [Document<PortfolioDocMetadata>, number][] = [];

    for (const item of this.memoryVectors) {
      const doc = new Document<PortfolioDocMetadata>({
        pageContent: item.content,
        metadata: item.metadata,
      });
      if (filter && !filter(doc)) continue;

      const score = queryVector.length && item.embedding.length ? cosineSimilarity(queryVector, item.embedding) : 0;
      results.push([doc, score]);
    }

    return results.sort((a, b) => b[1] - a[1]).slice(0, k);
  }

  /**
   * Hybrid Search: menggabungkan skor Dense Vector Embeddings (70%) + Lexical/Keyword (30%).
   * Jika API embedding sedang limit/offline, otomatis memakai skor Lexical (100%).
   */
  override async similaritySearchWithScore(
    query: string,
    k = 5,
    filter?: this["FilterType"],
  ): Promise<[Document<PortfolioDocMetadata>, number][]> {
    const cacheKey = query.trim().toLowerCase();
    let queryVector: number[] = this.queryEmbeddingCache.get(cacheKey) ?? [];
    if (!queryVector.length && this.hasDenseEmbeddings && getGeminiApiKey()) {
      try {
        queryVector = await Promise.race([
          this.embeddings.embedQuery(query),
          new Promise<number[]>((_, reject) => setTimeout(() => reject(new Error("embed timeout")), 3_000)),
        ]);
        if (queryVector.length > 0) {
          this.queryEmbeddingCache.set(cacheKey, queryVector);
        }
      } catch {
        queryVector = [];
      }
    }

    const scored: [Document<PortfolioDocMetadata>, number][] = [];
    for (const item of this.memoryVectors) {
      const doc = new Document<PortfolioDocMetadata>({
        pageContent: item.content,
        metadata: item.metadata,
      });
      if (filter && !filter(doc)) continue;

      const lex = lexicalSimilarity(query, item.content, item.metadata.title);
      const dense =
        queryVector.length > 0 && item.embedding.length > 0
          ? Math.max(0, cosineSimilarity(queryVector, item.embedding))
          : 0;

      const finalScore = queryVector.length > 0 && item.embedding.length > 0 ? dense * 0.65 + lex * 0.35 : lex;
      scored.push([doc, finalScore]);
    }

    return scored.sort((a, b) => b[1] - a[1]).slice(0, k);
  }

  override async similaritySearch(
    query: string,
    k = 5,
    filter?: this["FilterType"],
  ): Promise<Document<PortfolioDocMetadata>[]> {
    const withScores = await this.similaritySearchWithScore(query, k, filter);
    return withScores.map(([doc]) => doc);
  }
}

/**
 * Fallback Embeddings dummy jika API key tidak ada, agar VectorStore tetap berjalan dengan mode lexical.
 */
class FallbackEmbeddings extends Embeddings {
  constructor() {
    super({});
  }
  async embedDocuments(documents: string[]): Promise<number[][]> {
    return documents.map(() => []);
  }
  async embedQuery(): Promise<number[]> {
    return [];
  }
}

/**
 * Menyusun seluruh dokumen Knowledge Base (RAG) tentang Wayan (Wynnsea)
 * dari data live Supabase + data profil terverifikasi di repo.
 */
export function buildPortfolioDocuments(input: PortfolioKnowledgeInput = {}): Document<PortfolioDocMetadata>[] {
  const settings = input.settings;
  const ownerName = settings?.name ?? site.name;
  const brand = settings?.brand ?? site.brand;
  const nameJp = settings?.nameJp ?? site.nameJp;
  const role = settings?.role ?? site.role;
  const description = settings?.description ?? site.description;
  const location = settings?.location ?? site.location;
  const email = settings?.email ?? site.email;
  const availability = settings?.availability ?? site.availability;
  const socials = settings?.socials ?? site.socials;

  const projectList = input.projects?.length ? input.projects : fallbackProjects;
  const postList = input.posts?.length ? input.posts : fallbackPosts;
  const certificationList = input.certifications?.length ? input.certifications : fallbackCertifications;
  const activityList = input.activities?.length ? input.activities : fallbackActivities;

  const docs: Document<PortfolioDocMetadata>[] = [];

  // 1. Dokumen Identitas Utama & Cerita Diri Wayan
  const socialText = socials.map((s) => `${s.label}: ${s.href}`).join(", ");
  const availabilityText = availability.open
    ? `Terbuka untuk kesempatan kerja (${availability.label ?? "Siap bekerja"} — ${availability.detail ?? "Full-time & freelance"})`
    : "Saat ini belum membuka status ketersediaan baru";

  docs.push(
    new Document<PortfolioDocMetadata>({
      pageContent: [
        `Profil Pemilik Website Portofolio (${brand}):`,
        `Nama: ${ownerName} (${nameJp})`,
        `Brand Personal: ${brand}`,
        `Peran Utama: ${role}`,
        `Lokasi: ${location}`,
        `Email Resmi: ${email}`,
        `Sosial Media & Tautan: ${socialText}`,
        `Status Ketersediaan Kerja: ${availabilityText}`,
        `Deskripsi Singkat: ${description}`,
        `Cerita Tentang ${ownerName}: ${about.story.join(" ")}`,
        `Minat & Prinsip: ${about.interests.map((i) => `${i.label} (${i.jp})`).join(", ")}.`,
      ].join("\n"),
      metadata: {
        id: "identity-core",
        category: "identity",
        title: `Tentang ${ownerName} (${brand})`,
        subtitle: "Profil, cerita diri, kontak, dan status ketersediaan",
        href: "/#about",
        actionLabel: "Lihat profil Wayan",
        searchType: "Section",
        keywords: "profil wayan wynnsea siapa owner pemilik website tentang saya about kontak email github linkedin lokasi",
      },
    }),
  );

  // 2. Dokumen Pendidikan & Pengalaman Kerja
  const expLines = about.experience.map((e) => `- ${e.role} di ${e.company} (${e.period})`).join("\n");
  docs.push(
    new Document<PortfolioDocMetadata>({
      pageContent: [
        `Pendidikan & Pengalaman Kerja ${ownerName}:`,
        `Pendidikan Formal: ${about.education.degree} di ${about.education.school} (${about.education.period}).`,
        `Pengalaman Kerja / Karier:`,
        expLines,
        `Catatan Karier: Sebelum menjadi Junior AI Engineer di Global Collabo Tech, ${ownerName} pernah menjadi IT Coordinator di Politeknik Takumi sehingga terbiasa memastikan sistem mudah digunakan oleh pengguna akhir.`,
      ].join("\n"),
      metadata: {
        id: "experience-education",
        category: "experience",
        title: "Pendidikan & Pengalaman Kerja",
        subtitle: `${about.education.degree} ${about.education.school} · ${about.experience[0]?.role} di ${about.experience[0]?.company}`,
        href: "/#about",
        actionLabel: "Lihat pengalaman & pendidikan",
        searchType: "Section",
        keywords: "pendidikan kuliah kampus politeknik takumi d3 teknologi informasi pengalaman kerja karier global collabo tech it coordinator",
      },
    }),
  );

  // 3. Dokumen Keahlian (Skill Profile Lengkap: Solid, Dasar, dan Belum Dikuasai agar jujur & anti-halusinasi)
  const solidSkills = skillProfile.filter((s) => s.level === "solid");
  const basicSkills = skillProfile.filter((s) => s.level === "dasar");
  const unlearnedSkills = skillProfile.filter((s) => s.level === "belum");

  docs.push(
    new Document<PortfolioDocMetadata>({
      pageContent: [
        `Daftar Keahlian & Tech Stack ${ownerName}:`,
        `Kelompok Keahlian Utama: ${about.skills.map((g) => `${g.group}: ${g.items.join(", ")}`).join(" | ")}.`,
        `Keahlian Level Solid (Kuat): ${solidSkills.map((s) => `${s.label} (${s.description})`).join("; ")}.`,
        `Keahlian Level Dasar: ${basicSkills.map((s) => `${s.label} (${s.description})`).join("; ")}.`,
        `Area yang Jujur BELUM Dikuasai / Bukan Fokus ${ownerName} Saat Ini: ${unlearnedSkills.map((s) => s.label).join(", ")}.`,
        `Fokus Utama ${ownerName}: Integrasi AI ke aplikasi web nyata (LLM API, RAG, LangChain, LangGraph, Vector DB, Prompt Engineering, Full-stack Next.js/React/FastAPI/Laravel), BUKAN melatih (pre-training/fine-tuning) model deep learning dari nol.`,
      ].join("\n"),
      metadata: {
        id: "skills-matrix",
        category: "skills",
        title: "Keahlian & Tech Stack",
        subtitle: "Integrasi AI (LLM, RAG, LangChain), Web Dev (Next.js, React, FastAPI, Laravel), Tools",
        href: "/#about",
        actionLabel: "Lihat detail keahlian",
        searchType: "Section",
        keywords: "skill keahlian kemampuan tech stack bahasa pemrograman llm rag langchain langgraph nextjs react typescript python fastapi laravel sql docker",
      },
    }),
  );

  // 4. Dokumen Kontak & Sosial Media
  docs.push(
    new Document<PortfolioDocMetadata>({
      pageContent: [
        `Cara Menghubungi ${ownerName} (Kontak):`,
        `Email: ${email}`,
        `Sosial Media: ${socialText}`,
        `Status Ketersediaan: ${availabilityText}`,
        `${ownerName} terbuka untuk diskusi kerja full-time, freelance, maupun kolaborasi proyek integrasi AI dan pengembangan web.`,
      ].join("\n"),
      metadata: {
        id: "contact-info",
        category: "identity",
        title: "Kontak",
        subtitle: `Email (${email}), GitHub, dan LinkedIn`,
        href: "/#contact",
        actionLabel: "Ke bagian kontak",
        searchType: "Section",
        keywords: "kontak contact hubungi email github linkedin sosial media alamat",
      },
    }),
  );

  // 5. Dokumen Fitur Job Match untuk Rekruter
  docs.push(
    new Document<PortfolioDocMetadata>({
      pageContent: [
        `Fitur Job Match untuk Rekruter / HR:`,
        `Website portofolio ${ownerName} memiliki fitur interaktif bernama Job Match di bagian /#job-match.`,
        `Rekruter dapat menempelkan deskripsi lowongan kerja (Job Description), lalu SEA AI akan mengekstrak syarat wajib dan nilai plus, mencocokkannya secara objektif dan transparan dengan profil skill ${ownerName}, menghitung persentase kecocokan, serta menampilkan proyek bukti yang relevan.`,
      ].join("\n"),
      metadata: {
        id: "feature-job-match",
        category: "feature",
        title: "Job Match",
        subtitle: "Cek kecocokan kandidat dengan deskripsi lowongan kerja",
        href: "/#job-match",
        actionLabel: "Coba Job Match",
        searchType: "Section",
        keywords: "job match rekruter recruiter lowongan kerja loker hiring cocok kandidat hr",
      },
    }),
  );

  // 6. Dokumen per Proyek + Ringkasan Daftar Proyek
  if (projectList.length > 0) {
    docs.push(
      new Document<PortfolioDocMetadata>({
        pageContent: [
          `Daftar Proyek Portofolio ${ownerName} (Total ${projectList.length} proyek):`,
          ...projectList.map(
            (p, idx) =>
              `${idx + 1}. ${p.title} (${p.category}, ${p.year}) — Peran: ${p.role} (${p.duration}). Ringkasan: ${p.summary} Tech Stack: ${p.stack.join(", ")}. Link halaman: /projects/${p.slug}`,
          ),
        ].join("\n"),
        metadata: {
          id: "projects-overview",
          category: "project",
          title: "Semua Proyek",
          subtitle: `${projectList.length} proyek integrasi AI & pengembangan web`,
          href: "/#projects",
          actionLabel: "Lihat semua proyek",
        },
      }),
    );
  }

  for (const p of projectList) {
    const resultsText = p.results.map((r) => `${r.value} (${r.label})`).join(", ");
    docs.push(
      new Document<PortfolioDocMetadata>({
        pageContent: [
          `Detail Proyek: ${p.title} (${p.titleJp})`,
          `Slug URL: /projects/${p.slug}`,
          `Kategori: ${p.category} | Tahun: ${p.year}`,
          `Peran ${ownerName}: ${p.role} | Durasi Pengerjaan: ${p.duration}`,
          `Tech Stack: ${p.stack.join(", ")}`,
          `Ringkasan: ${p.summary}`,
          `Overview: ${p.overview}`,
          `Tantangan (Challenge): ${p.challenge}`,
          `Pendekatan (Approach): ${p.approach.map((step, i) => `(${i + 1}) ${step}`).join(" ")}`,
          `Hasil (Results): ${resultsText}`,
          p.links?.demo ? `Link Demo: ${p.links.demo}` : "",
          p.links?.source ? `Link Source Code: ${p.links.source}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
        metadata: {
          id: `project-${p.slug}`,
          category: "project",
          title: p.title,
          subtitle: p.summary,
          href: `/projects/${p.slug}`,
          actionLabel: `Buka ${p.title}`,
          searchType: "Project",
          slug: p.slug,
          keywords: `${p.title} ${p.titleJp} ${p.category} ${p.role} ${p.stack.join(" ")} ${p.summary}`,
        },
      }),
    );
  }

  // 7. Dokumen Sertifikasi
  if (certificationList.length > 0) {
    docs.push(
      new Document<PortfolioDocMetadata>({
        pageContent: [
          `Daftar Sertifikasi Resmi ${ownerName} (Total ${certificationList.length} sertifikasi):`,
          ...certificationList.map(
            (c, i) =>
              `${i + 1}. ${c.title} (${c.category}) — Penerbit: ${c.issuer}${c.year ? `, Tahun: ${c.year}` : ""}${c.score ? `, Skor/Level: ${c.score}` : ""}${c.note ? `. Catatan: ${c.note}` : ""}.`,
          ),
        ].join("\n"),
        metadata: {
          id: "certifications-all",
          category: "certification",
          title: "Sertifikasi",
          subtitle: certificationList.map((c) => c.title).join(", "),
          href: "/#certifications",
          actionLabel: "Lihat sertifikasi",
          searchType: "Section",
          keywords: `sertifikasi sertifikat ${certificationList.map((c) => `${c.title} ${c.issuer} ${c.category} ${c.note ?? ""}`).join(" ")}`,
        },
      }),
    );
  }

  // 8. Dokumen Kegiatan & Organisasi
  if (activityList.length > 0) {
    docs.push(
      new Document<PortfolioDocMetadata>({
        pageContent: [
          `Daftar Kegiatan, Program Industri, & Organisasi ${ownerName} (Total ${activityList.length} kegiatan):`,
          ...activityList.map(
            (a, i) =>
              `${i + 1}. ${a.title} — Peran: ${a.role}, Penyelenggara: ${a.organizer}${a.year ? ` (${a.year})` : ""}. Kategori: ${a.category}. Deskripsi: ${a.description}`,
          ),
        ].join("\n"),
        metadata: {
          id: "activities-all",
          category: "activity",
          title: "Kegiatan",
          subtitle: "Program industri, fasilitator, dan kegiatan kampus",
          href: "/#activities",
          actionLabel: "Lihat kegiatan",
          searchType: "Section",
          keywords: `kegiatan aktivitas organisasi ${activityList.map((a) => `${a.title} ${a.role} ${a.organizer} ${a.description}`).join(" ")}`,
        },
      }),
    );
  }

  // 9. Dokumen Artikel Blog
  if (postList.length === 0) {
    docs.push(
      new Document<PortfolioDocMetadata>({
        pageContent: `Status Blog / Artikel ${ownerName}: Saat ini belum ada artikel blog yang diterbitkan di website portofolio. Tulisan pertama sedang disiapkan.`,
        metadata: {
          id: "blog-empty",
          category: "blog",
          title: "Blog",
          subtitle: "Tulisan dan catatan teknis Wayan",
          href: "/#blog",
          actionLabel: "Ke bagian blog",
        },
      }),
    );
  } else {
    for (const post of postList) {
      const bodyText = post.content
        .map((b) => {
          if (b.type === "list") return b.items.join("; ");
          if (b.type === "code") return b.code;
          return b.text;
        })
        .join("\n");

      docs.push(
        new Document<PortfolioDocMetadata>({
          pageContent: [
            `Artikel Blog: ${post.title} (${post.titleJp})`,
            `URL: /blog/${post.slug}`,
            `Kategori: ${post.category} | Tanggal: ${post.date} | Waktu Baca: ${post.readTime}`,
            `Ringkasan (Excerpt): ${post.excerpt}`,
            `Isi Artikel:\n${bodyText}`,
          ].join("\n"),
          metadata: {
            id: `post-${post.slug}`,
            category: "blog",
            title: post.title,
            subtitle: post.excerpt,
            href: `/blog/${post.slug}`,
            actionLabel: `Baca "${post.title}"`,
            searchType: "Blog",
            slug: post.slug,
            keywords: `${post.title} ${post.category} ${post.excerpt}`,
          },
        }),
      );
    }
  }

  return docs;
}

// ---------------------------------------------------------------------------
// Server-side Cache untuk In-Memory Vector Store (TTL 5 menit + Fingerprint)
// ---------------------------------------------------------------------------

type CachedRagStore = {
  fingerprint: string;
  createdAt: number;
  store: PortfolioVectorStore;
  rawInput: Required<PortfolioKnowledgeInput>;
};

const CACHE_TTL_MS = 5 * 60 * 1000;

const globalForRag = globalThis as unknown as {
  __wynnseaRagCache?: CachedRagStore;
};

function computeFingerprint(input: PortfolioKnowledgeInput): string {
  const p = (input.projects ?? []).map((x) => `${x.slug}:${x.title}:${x.summary.length}`).join("|");
  const b = (input.posts ?? []).map((x) => `${x.slug}:${x.date}:${x.content.length}`).join("|");
  const c = (input.certifications ?? []).map((x) => `${x.title}:${x.score ?? ""}`).join("|");
  const a = (input.activities ?? []).map((x) => `${x.title}:${x.role}`).join("|");
  const s = input.settings ? `${input.settings.name}:${input.settings.role}:${input.settings.description.length}` : "default";
  return `${s}__${p}__${b}__${c}__${a}`;
}

export async function loadPortfolioKnowledgeData(
  provided?: PortfolioKnowledgeInput,
): Promise<Required<PortfolioKnowledgeInput>> {
  const [projects, posts, certifications, activities, settings] = await Promise.all([
    provided?.projects ? Promise.resolve(provided.projects) : getPublicProjects().catch(() => fallbackProjects),
    provided?.posts ? Promise.resolve(provided.posts) : getPublicPosts().catch(() => fallbackPosts),
    provided?.certifications
      ? Promise.resolve(provided.certifications)
      : getPublicCertifications().catch(() => fallbackCertifications),
    provided?.activities ? Promise.resolve(provided.activities) : getPublicActivities().catch(() => fallbackActivities),
    provided?.settings
      ? Promise.resolve(provided.settings)
      : getPublicSettings().catch(
          (): SiteSettings => ({
            brand: site.brand,
            name: site.name,
            nameJp: site.nameJp,
            role: site.role,
            description: site.description,
            location: site.location,
            email: site.email,
            photoUrl: site.photo,
            cvUrl: site.cv || null,
            availability: {
              open: site.availability.open,
              label: site.availability.label,
              detail: site.availability.detail,
            },
            socials: [...site.socials],
            features: { chatbot: true, preloader: true },
          }),
        ),
  ]);

  return { projects, posts, certifications, activities, settings };
}

/**
 * Mengambil instance PortfolioVectorStore (LangChain VectorStore) yang sudah di-index.
 * Menggunakan cache in-memory di server agar tidak perlu re-embed setiap request.
 */
export async function getPortfolioVectorStore(
  provided?: PortfolioKnowledgeInput,
): Promise<{ store: PortfolioVectorStore; data: Required<PortfolioKnowledgeInput> }> {
  const data = await loadPortfolioKnowledgeData(provided);
  const fingerprint = computeFingerprint(data);
  const now = Date.now();

  const cached = globalForRag.__wynnseaRagCache;
  if (cached && cached.fingerprint === fingerprint && now - cached.createdAt < CACHE_TTL_MS) {
    return { store: cached.store, data: cached.rawInput };
  }

  const docs = buildPortfolioDocuments(data);
  const embeddings = getGeminiApiKey() ? createEmbeddingsModel() : new FallbackEmbeddings();
  const store = new PortfolioVectorStore(embeddings);
  await store.addDocuments(docs);

  globalForRag.__wynnseaRagCache = {
    fingerprint,
    createdAt: now,
    store,
    rawInput: data,
  };

  return { store, data };
}

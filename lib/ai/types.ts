// Tipe data yang dipakai bersama oleh API route (server) dan komponen (client).

export type SeaAction = { type: "navigate"; href: string; label: string };

export type SeaReply = { reply: string; action?: SeaAction };

export type JobMatchResult = {
  score: number;
  summary: string;
  matched: string[];
  missing: string[];
  projects: { slug: string; title: string; reason: string }[];
  source: "ai" | "mock";    // dari mana hasilnya
  lowConfidence?: boolean;  // true = UI tidak menampilkan skor (pilihan B)
  outOfField?: boolean;     // true = posisi di luar bidang Wayan: tanpa skor dan tanpa daftar gap
  seniorityNote?: string;
};


export type ExplainLevel = "recruiter" | "engineer" | "awam";

export type SearchItem = {
  type: "Project" | "Blog" | "Section";
  title: string;
  subtitle: string;
  href: string;
  keywords: string;
};

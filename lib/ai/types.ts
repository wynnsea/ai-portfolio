// Tipe data yang dipakai bersama oleh API route (server) dan komponen (client).

export type SeaAction = { type: "navigate"; href: string; label: string };

export type SeaReply = { reply: string; action?: SeaAction };

export type JobMatchResult = {
  score: number;
  summary: string;
  matched: string[];
  missing: string[];
  projects: { slug: string; title: string; reason: string }[];
};

export type ExplainLevel = "recruiter" | "engineer" | "awam";

export type SearchItem = {
  type: "Project" | "Blog" | "Section";
  title: string;
  subtitle: string;
  href: string;
  keywords: string;
};

// Artikel blog. Masih kosong: section Blog otomatis menampilkan "Belum ada artikel".
// Tambahkan artikel ke array `posts` dengan format seperti contoh di bawah.
import type { CoverTone } from "@/lib/projects";

export type PostBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; items: string[] }
  | { type: "code"; lang: string; code: string };

export type Post = {
  slug: string;
  title: string;
  titleJp: string;
  kanji: string;
  tone: CoverTone;
  category: string;
  date: string; // YYYY-MM-DD
  readTime: string;
  excerpt: string;
  content: PostBlock[];
  cover?: string;
};

/*
Contoh satu artikel:
{
  slug: "bikin-minori-ai-rcr",
  title: "Cerita Bikin Sistem Rekrutmen Berbasis AI",
  titleJp: "採用AI",
  kanji: "採",
  tone: "dark",
  category: "Integrasi AI",
  date: "2026-10-20",
  readTime: "5 menit baca",
  excerpt: "Ringkasan singkat artikel yang tampil di daftar blog.",
  content: [
    { type: "p", text: "Paragraf pembuka..." },
    { type: "h2", text: "Subjudul" },
    { type: "list", items: ["Poin satu", "Poin dua"] },
    { type: "quote", text: "Kutipan penting." },
  ],
},
*/
export const posts: Post[] = [];

export const sortedPosts = [...posts].sort((a, b) => b.date.localeCompare(a.date));

export function getPost(slug: string) {
  return posts.find((p) => p.slug === slug);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** Format tanggal secara deterministik (sama di server & client). */
export function formatDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

// Sertifikasi. Gambar di public/certifications/ sudah disensor (tanggal lahir ditutup).
// File asli disimpan di private/certifications-original/ (tidak ikut ter-publish & di-commit).
// `credentialUrl` opsional: link verifikasi kredensial, tampil sebagai tombol di tampilan penuh.
import type { CoverTone } from "@/lib/projects";

export type Certification = {
  title: string;
  titleJp: string;
  kanji: string;
  tone: CoverTone;
  category: string;
  issuer: string;
  year?: string;
  score?: string;
  note?: string;
  credentialUrl?: string;
  cover?: string;
};

export const certifications: Certification[] = [
  {
    title: "JLPT N4",
    titleJp: "日本語能力試験",
    kanji: "語",
    tone: "dark",
    category: "Japanese",
    issuer: "Japan Foundation & JEES",
    year: "Des 2024",
    note: "Japanese-Language Proficiency Test level N4",
    cover: "/certifications/jlpt-n4.jpg",
  },
  {
    title: "Junior Web Developer",
    titleJp: "ウェブ開発",
    kanji: "網",
    tone: "mid",
    category: "Web Dev",
    issuer: "BNSP · LSP Teknologi Digital",
    year: "2026",
    note: "Sertifikat kompetensi Pengembang Web Pratama, berlaku 3 tahun",
    cover: "/certifications/junior-web-developer.jpg",
  },
  {
    title: "TOEFL Prediction",
    titleJp: "英語能力",
    kanji: "英",
    tone: "dark",
    category: "English",
    issuer: "Central Course, Pare",
    year: "2025",
    score: "477",
    note: "Listening 47 · Structure 50 · Reading 46",
    cover: "/certifications/toefl.jpg",
  },
  {
    title: "iTEP Essential",
    titleJp: "英語試験",
    kanji: "試",
    tone: "mid",
    category: "English",
    issuer: "iTEP International",
    year: "2025",
    score: "B1",
    note: "Intermediate level (CEFR B1)",
    cover: "/certifications/itep.jpg",
    // credentialUrl: "https://www.iteptest.com/certificate?c=...", // isi kode verifikasi dari sertifikat
  },
];

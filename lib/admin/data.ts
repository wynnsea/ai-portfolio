// Data awal panel admin (UI saja, belum tersambung ke Laravel).
// Proyek, sertifikasi, dan kegiatan diambil dari data asli website.
// Artikel & pesan masih CONTOH supaya tampilan tabel bisa dilihat.
import { projects } from "@/lib/projects";
import { certifications } from "@/lib/certifications";
import { activities } from "@/lib/activities";

export type Row = { id: number } & Record<string, string | number>;

export const seed = {
  proyek: projects.map((p, i) => ({
    id: i + 1,
    title: p.title,
    category: p.category,
    year: p.year,
    role: p.role,
    status: "Terbit",
    summary: p.summary,
    stack: p.stack.join(", "),
  })),

  sertifikasi: certifications.map((c, i) => ({
    id: i + 1,
    title: c.title,
    issuer: c.issuer,
    category: c.category,
    year: c.year ?? "",
    score: c.score ?? "",
    credentialUrl: c.credentialUrl ?? "",
  })),

  kegiatan: activities.map((a, i) => ({
    id: i + 1,
    title: a.title,
    role: a.role,
    organizer: a.organizer,
    year: a.year ?? "",
    description: a.description,
  })),

  // CONTOH
  artikel: [
    { id: 1, title: "Cerita Bikin Minori AI RCR (contoh)", category: "Integrasi AI", status: "Draft", date: "2026-10-20", excerpt: "Pengalaman membangun sistem rekrutmen berbasis AI." },
    { id: 2, title: "Belajar JLPT Sambil Ngoding (contoh)", category: "Budaya Jepang", status: "Draft", date: "2026-10-12", excerpt: "Tips membagi waktu belajar bahasa Jepang dan pemrograman." },
  ],

  // CONTOH: nanti berasal dari form kontak website lewat API Laravel
  pesan: [
    { id: 1, name: "Rina Kartika", email: "rina@contoh.id", subject: "Tawaran posisi AI Engineer", message: "Halo Wayan, kami tertarik dengan profil kamu untuk posisi AI Engineer. Apakah bisa interview minggu depan?", date: "2026-10-23", status: "Baru" },
    { id: 2, name: "Budi Santoso", email: "budi@contoh.id", subject: "Kolaborasi project chatbot", message: "Saya punya ide project chatbot untuk UMKM, mau diskusi?", date: "2026-10-22", status: "Baru" },
    { id: 3, name: "Sakura Tanaka", email: "sakura@contoh.jp", subject: "Pertanyaan soal Minori AI RCR", message: "Sistem grading-nya menarik. Apakah pakai LLM atau rule-based?", date: "2026-10-20", status: "Dibaca" },
    { id: 4, name: "Andi Pratama", email: "andi@contoh.id", subject: "Freelance website", message: "Butuh bantuan bikin website company profile, budget fleksibel.", date: "2026-10-18", status: "Dibalas" },
    { id: 5, name: "Dewi Lestari", email: "dewi@contoh.id", subject: "Undangan pembicara", message: "Kami mengundang untuk mengisi sesi integrasi AI di kampus kami.", date: "2026-10-15", status: "Dibalas" },
  ],
} satisfies Record<string, Row[]>;

export type Resource = keyof typeof seed;

/** Pengunjung mingguan untuk grafik dashboard (CONTOH). `future` = hari yang belum terjadi. */
export const weeklyVisitors = [
  { day: "Sen", value: 38, future: false },
  { day: "Sel", value: 64, future: false },
  { day: "Rab", value: 52, future: false },
  { day: "Kam", value: 81, future: false },
  { day: "Jum", value: 70, future: true },
  { day: "Sab", value: 45, future: true },
  { day: "Min", value: 58, future: true },
];

// Kegiatan di luar pekerjaan. Field bertanda "isi" belum diketahui, lengkapi sesuai kegiatan asli.
// `photos`: path foto di public/activities/. Foto pertama jadi cover kartu; lebih dari satu = slideshow.
// `focus`: titik fokus potongan foto di kartu (CSS object-position), berguna untuk foto potret.
// Foto asli (sebelum dikompres) disimpan di private/activities-original/ (tidak ikut di-commit).
import type { CoverTone } from "@/lib/projects";

export type Activity = {
  title: string;
  role: string;
  organizer: string;
  year?: string;
  description: string;
  titleJp: string;
  kanji: string;
  tone: CoverTone;
  category: string;
  photos?: string[];
  focus?: string;
};

export const activities: Activity[] = [
  {
    title: "Nusantara Data Center Academy",
    role: "Peserta",
    organizer: "Nusantara Data Center Academy × Microsoft",
    year: undefined, // isi
    description:
      "Lulus dari Industrial Vocational Class Program Batch 2, program vokasi industri data center yang didukung Microsoft dan mitra industri.", // isi: tambahkan materi/pencapaian
    titleJp: "データセンター",
    kanji: "卒",
    tone: "dark",
    category: "Program",
    photos: ["/activities/nusantara-data-center-academy.jpg"],
  },
  {
    title: "Bunkasai",
    role: "Fasilitator",
    organizer: "Politeknik Takumi", // isi: pastikan penyelenggaranya
    year: undefined, // isi
    description:
      "Mendampingi peserta selama kegiatan festival budaya Jepang, menjelaskan alur acara, dan membantu mereka menyelesaikan tantangan.", // isi: sesuaikan tugasmu
    titleJp: "文化祭",
    kanji: "祭",
    tone: "mid",
    category: "Facilitator",
    photos: ["/activities/fasilitator-bunkasai.jpg"],
  },
  {
    title: "Learning Factory PT Minori",
    role: "Peserta",
    organizer: "PT Minori",
    year: undefined, // isi
    description:
      "Mengikuti program Learning Factory untuk mengenal langsung lingkungan dan budaya kerja industri.", // isi: tambahkan apa yang dipelajari
    titleJp: "ラーニングファクトリー",
    kanji: "工",
    tone: "dark",
    category: "Industry",
    photos: ["/activities/learning-factory-minori.jpg"],
  },
  {
    title: "HI Tech Berbagi",
    role: "Panitia", // isi: pastikan peranmu
    organizer: "Politeknik Takumi",
    year: undefined, // isi
    description: "Kegiatan berbagi sembako dan bingkisan Idul Fitri bersama teman-teman kampus.", // isi: tambahkan penerima/jumlah paket
    titleJp: "分かち合い",
    kanji: "分",
    tone: "mid",
    category: "Social",
    photos: ["/activities/hi-tech-berbagi.jpg"],
    focus: "50% 78%",
  },
  {
    title: "Malam Keakraban HIMA TI",
    role: "Peserta", // isi: ganti jadi "Panitia" kalau kamu ikut menyelenggarakan
    organizer: "HIMA Teknologi Informasi",
    year: undefined, // isi
    description: "Malam keakraban himpunan mahasiswa Teknologi Informasi untuk mempererat hubungan antar angkatan dan dosen.",
    titleJp: "親睦会",
    kanji: "絆",
    tone: "dark",
    category: "Community",
    photos: ["/activities/makrab-hima-ti.jpg"],
  },
];

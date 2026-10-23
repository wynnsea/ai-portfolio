// Data project. Field bertanda "isi" belum diketahui, lengkapi sesuai project asli.
// `cover` opsional: isi dengan path gambar (mis. "/images/projects/minori-ai-rcr.jpg")
// untuk mengganti cover kanji yang dibuat otomatis.

export type CoverTone = "dark" | "mid" | "light";

export type Project = {
  slug: string;
  title: string;
  titleJp: string;
  kanji: string;
  tone: CoverTone;
  category: string;
  year: string;
  role: string;
  duration: string;
  summary: string;
  overview: string;
  challenge: string;
  approach: string[];
  results: { value: string; label: string }[];
  stack: string[];
  links: { demo?: string; source?: string };
  cover?: string;
};

export const projects: Project[] = [
  {
    slug: "minori-ai-rcr",
    title: "Minori AI RCR",
    titleJp: "採用AIシステム",
    kanji: "採",
    tone: "dark",
    category: "AI Grading · Rekrutmen",
    year: "2026", // isi: pastikan tahunnya
    role: "Full-stack & AI Integration",
    duration: "2 bulan", // isi: sesuaikan durasi pengerjaan
    summary:
      "Website walk-in rekrutmen untuk PT Minori dengan AI yang menilai calon pemagang secara otomatis, jadi tim rekrutmen bisa langsung filter kandidat berdasarkan grade.",
    overview:
      "Minori AI RCR adalah website walk-in rekrutmen untuk calon pemagang di PT Minori. Peserta mendaftar dan mengisi biodata langsung di website, lalu mengerjakan tes. Di dalam sistemnya saya integrasikan AI yang mengolah biodata dan hasil tes tiap peserta menjadi satu grade. Dari dashboard, tim rekrutmen tinggal filter dan urutkan kandidat berdasarkan grade, gak perlu cek satu per satu lagi.",
    challenge:
      "Saat walk-in, pendaftar bisa datang banyak dalam waktu singkat. Menilai biodata dan hasil tes satu per satu itu makan waktu, dan hasilnya bisa beda-beda tergantung siapa yang menilai. Sistemnya harus memberi penilaian yang konsisten untuk semua peserta dan tetap mudah dipahami tim rekrutmen.",
    approach: [
      "Membangun alur walk-in di website: pendaftaran, pengisian biodata, sampai tes peserta dalam satu tempat.",
      "Menyusun kriteria penilaian dari biodata dan hasil tes, lalu menerjemahkannya jadi instruksi yang dipakai AI saat memberi grade.",
      "Mengintegrasikan AI ke dalam sistem supaya grade tiap peserta dihitung otomatis setelah tes selesai.",
      "Membuat dashboard rekrutmen untuk memfilter, mengurutkan, dan melihat detail kandidat berdasarkan grade.",
    ],
    // isi: ganti dengan angka asli kalau ada (mis. jumlah peserta, waktu seleksi yang dihemat)
    results: [
      { value: "Otomatis", label: "Grading dari biodata & hasil tes" },
      { value: "Grade", label: "Jadi dasar filter kandidat" },
      {
        value: "1 sistem",
        label: "Daftar, tes, dan penilaian dalam satu website",
      },
    ],
    stack: ["Laravel", "React", "Integrasi LLM", "FastAPI", "MySQL"],
    links: {}, 
  },
];

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}

export function getNextProject(slug: string) {
  const i = projects.findIndex((p) => p.slug === slug);
  return projects[(i + 1) % projects.length];
}

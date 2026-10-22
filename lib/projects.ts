// Data project DUMMY, ganti dengan project asli kamu.
// `cover` opsional: isi dengan path gambar (mis. "/images/projects/kanji-lens.jpg")
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
    slug: "nihongo-buddy",
    title: "Nihongo Buddy",
    titleJp: "日本語バディ",
    kanji: "話",
    tone: "dark",
    category: "LLM · RAG",
    year: "2026",
    role: "AI Integration Engineer",
    duration: "2 bulan",
    summary: "Tutor bahasa Jepang berbasis chat yang benerin grammar kamu dan jelasin alasannya, pakai referensi dari materi asli.",
    overview: "Nihongo Buddy itu tutor chat buat orang Indonesia yang lagi belajar bahasa Jepang. Saya gak training model sendiri. Saya gabungin API LLM yang udah ada sama pipeline RAG dari catatan grammar, jadi tiap koreksi selalu ada rujukan ke materi yang pas.",
    challenge: "LLM umum suka over-correct atau ngarang aturan grammar. Tutornya harus sesuai level (N5 sampai N3), pakai sumber yang bisa dipercaya, dan biaya API-nya harus tetap murah biar bisa gratis.",
    approach: [
      "Mecah dan nge-embed catatan grammar per poin grammar dan level JLPT, terus disimpan di pgvector.",
      "Nyambungin API LLM dengan prompt yang misahin balasan ngobrol sama blok koreksi yang terstruktur.",
      "Filter hasil retrieval sesuai level user biar penjelasannya gak ketinggian.",
      "Nambahin caching dan streaming biar chat tetap cepet dan tagihan token gak bengkak.",
    ],
    results: [
      { value: "87%", label: "Koreksi dinilai membantu" },
      { value: "-60%", label: "Biaya API setelah caching" },
      { value: "4.8", label: "Rating rata-rata user" },
    ],
    stack: ["Next.js", "Vercel AI SDK", "API LLM", "pgvector", "PostgreSQL", "TypeScript"],
    links: { demo: "#", source: "#" },
  },
  {
    slug: "kanji-lens",
    title: "Kanji Lens",
    titleJp: "漢字レンズ",
    kanji: "字",
    tone: "light",
    category: "Vision API",
    year: "2025",
    role: "AI Integration & Frontend",
    duration: "6 minggu",
    summary: "Arahin kamera ke kanji, langsung dapet cara baca, arti, dan contoh kalimatnya.",
    overview: "Kanji Lens itu web app buat pejuang JLPT. Foto papan, menu, atau buku, terus app-nya baca teks Jepangnya dan jelasin tiap kanji: cara baca, arti dalam bahasa Inggris dan Indonesia, plus contoh kalimat. Semuanya hasil ngerangkai vision model sama API kamus.",
    challenge: "Vision model kadang ngasih teks bebas yang susah diolah, dan hasil kamusnya harus tetap akurat walaupun fotonya blur atau miring.",
    approach: [
      "Kirim gambar ke API LLM yang bisa baca gambar, dengan skema JSON yang ketat buat kata dan kanji yang kedeteksi.",
      "Cek ulang tiap kanji ke API kamus Jepang publik biar artinya gak halu.",
      "Bikin tampilan Next.js yang mobile-first, lengkap dengan kamera dan overlay tap-to-explain.",
      "Nambahin fallback dan retry kalau API-nya ngasih hasil yang kurang yakin.",
    ],
    results: [
      { value: "92%", label: "Kanji kebaca dengan benar" },
      { value: "1.8s", label: "Rata-rata sampai penjelasan muncul" },
      { value: "1.2k", label: "Pengguna per bulan" },
    ],
    stack: ["Next.js", "Vision LLM API", "API Kamus", "Zod", "Tailwind CSS"],
    links: { demo: "#", source: "#" },
  },
  {
    slug: "face-attendance",
    title: "Face Attendance",
    titleJp: "顔認証出席",
    kanji: "顔",
    tone: "mid",
    category: "Computer Vision",
    year: "2026",
    role: "Full-stack & AI Integration",
    duration: "Tugas akhir",
    summary: "Absensi kampus pakai face recognition. Ini tugas akhir D3 saya di Politeknik Takumi.",
    overview: "Sistem absensi tanpa sentuh buat kelas. Mahasiswa tinggal lewat depan kamera, model face recognition yang udah jadi langsung ngenalin mereka, absen kecatat otomatis, dan dosen bisa cek semuanya dari dashboard web.",
    challenge: "Pencahayaan di kelas berubah-ubah sepanjang hari, dan sistemnya harus bisa nolak orang yang nyoba curang pakai foto cetak.",
    approach: [
      "Pakai library face recognition yang udah ter-training, bukan bikin model dari nol.",
      "Nambahin cek kedipan mata buat nolak foto palsu.",
      "Bikin dashboard dosen yang bisa export ke spreadsheet.",
    ],
    results: [
      { value: "97%", label: "Akurasi pengenalan wajah" },
      { value: "3s", label: "Rata-rata waktu absen" },
      { value: "A", label: "Nilai tugas akhir" },
    ],
    stack: ["Python", "OpenCV", "face_recognition", "Flask", "MySQL"],
    links: { source: "#" },
  },
];

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}

export function getNextProject(slug: string) {
  const i = projects.findIndex((p) => p.slug === slug);
  return projects[(i + 1) % projects.length];
}

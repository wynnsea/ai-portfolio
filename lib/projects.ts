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
    overview: "Nihongo Buddy itu tutor chat buat orang Indonesia yang lagi belajar bahasa Jepang. Aku gak training model sendiri. Aku gabungin API LLM yang udah ada sama pipeline RAG dari catatan grammar, jadi tiap koreksi selalu ada rujukan ke materi yang pas.",
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
    slug: "animatch",
    title: "AniMatch",
    titleJp: "アニマッチ",
    kanji: "絵",
    tone: "mid",
    category: "Embeddings · Search",
    year: "2025",
    role: "Full-stack & AI",
    duration: "1 bulan",
    summary: "Ceritain vibes anime yang kamu mau, AniMatch cariin yang cocok lengkap sama alasannya.",
    overview: "Di AniMatch kamu bisa nyari anime pakai bahasa sehari-hari, misalnya \"slice of life yang adem, settingnya di desa\". Aku gabungin API embeddings buat semantic search, data dari API database anime publik, dan LLM buat nulis alasan singkat di tiap rekomendasi.",
    challenge: "Search pakai tag genre sering gak nangkep maksud user, dan bikin penjelasan buat tiap hasil bisa lambat sekaligus mahal.",
    approach: [
      "Nge-embed 12 ribu sinopsis anime pakai API embeddings, terus di-index buat vector search.",
      "Sinkronisasi judul, studio, dan skor dari API GraphQL anime secara terjadwal.",
      "Bikin alasan rekomendasi sekaligus dalam satu panggilan LLM per pencarian.",
    ],
    results: [
      { value: "+31%", label: "Klik dibanding search keyword" },
      { value: "12k", label: "Judul ter-index" },
      { value: "<1s", label: "Waktu pencarian" },
    ],
    stack: ["Next.js", "API Embeddings", "GraphQL", "Supabase", "pgvector"],
    links: { demo: "#", source: "#" },
  },
  {
    slug: "sakura-planner",
    title: "Sakura Planner",
    titleJp: "桜旅プランナー",
    kanji: "桜",
    tone: "light",
    category: "AI Agent · Travel",
    year: "2026",
    role: "AI Integration Engineer",
    duration: "5 minggu",
    summary: "AI trip planner yang nyusun itinerary hanami di Jepang berdasarkan prediksi mekar sakura beneran.",
    overview: "Sakura Planner nanya kamu mau ke mana dan kapan di Jepang, ngambil data prediksi mekar sakura dan data peta, terus pakai LLM dengan tool calling buat nyusun itinerary harian yang ngikutin jalur mekarnya sakura ke utara.",
    challenge: "Itinerary-nya harus pakai data asli (tanggal, jarak, jam buka), bukan tebakan model.",
    approach: [
      "Ngasih LLM tools buat prediksi sakura, waktu tempuh, dan detail tempat, jadi dia gak improvisasi sendiri.",
      "Validasi tiap hasil tool dan itinerary pakai skema sebelum ditampilin ke user.",
      "Nampilin rencananya di peta interaktif yang bisa diedit per hari.",
    ],
    results: [
      { value: "58", label: "Kota dengan data prediksi" },
      { value: "0", label: "Tempat ngarang saat testing" },
      { value: "4.7", label: "Rating dari beta tester" },
    ],
    stack: ["Next.js", "LLM tool calling", "Maps API", "Zod", "Mapbox"],
    links: { demo: "#", source: "#" },
  },
  {
    slug: "ramen-insights",
    title: "Ramen Insights",
    titleJp: "ラーメン評判",
    kanji: "麺",
    tone: "dark",
    category: "LLM · Analytics",
    year: "2025",
    role: "AI Integration Engineer",
    duration: "4 minggu",
    summary: "Ngubah ratusan review kedai ramen jadi insight yang jelas soal kuah, mie, pelayanan, dan harga.",
    overview: "Ramen Insights bantu pemilik kedai ngerti review pelanggannya. Review dikumpulin, dianalisis pakai LLM dengan output terstruktur buat dapetin sentimen per aspek, terus trennya ditampilin di dashboard simpel. Gak perlu training model sama sekali.",
    challenge: "Review-nya campur bahasa Indonesia, Inggris, dan istilah makanan Jepang. Satu review juga sering muji satu hal tapi ngeluh soal hal lain.",
    approach: [
      "Bikin prompt dan skema JSON yang ngeluarin sentimen per aspek plus kutipan pendukungnya.",
      "Proses review per batch lewat API LLM, lengkap dengan retry dan penanganan rate limit.",
      "Bikin dashboard yang nunjukin tren sentimen tiap aspek per kedai.",
    ],
    results: [
      { value: "0.88", label: "Kesesuaian dengan label manusia" },
      { value: "4", label: "Aspek yang dipantau" },
      { value: "9k", label: "Review dianalisis" },
    ],
    stack: ["Python", "API LLM", "FastAPI", "PostgreSQL", "Next.js"],
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
    summary: "Absensi kampus pakai face recognition. Ini tugas akhir D3 aku di Politeknik Takumi.",
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

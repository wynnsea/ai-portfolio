// Data artikel blog DUMMY, ganti dengan tulisan asli kamu.
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

export const posts: Post[] = [
  {
    slug: "integrasi-llm-api-nextjs",
    title: "Cara Santai Integrasi API LLM ke Next.js",
    titleJp: "統合",
    kanji: "統",
    tone: "dark",
    category: "Integrasi AI",
    date: "2026-10-12",
    readTime: "8 menit baca",
    excerpt: "Streaming, output terstruktur, error handling, sampai jagain API key. Checklist yang harusnya saya tau dari hari pertama.",
    content: [
      { type: "p", text: "Manggil API LLM itu gampang. Yang susah itu bikin fiturnya tetap cepet, murah, dan gak gampang error pas dipakai user beneran. Ini checklist yang sekarang selalu saya pakai tiap integrasi model ke Next.js." },
      { type: "h2", text: "1. API key wajib di server" },
      { type: "p", text: "Jangan pernah manggil provider langsung dari browser. Taruh di Route Handler atau Server Action, jadi key-nya aman dan kamu bisa pasang rate limit di satu tempat." },
      { type: "code", lang: "ts", code: `// app/api/chat/route.ts\nexport async function POST(req: Request) {\n  const { messages } = await req.json()\n  const stream = await llm.chat({ messages, stream: true })\n  return new Response(stream)\n}` },
      { type: "h2", text: "2. Streaming itu wajib" },
      { type: "p", text: "User lebih sabar kalau bisa lihat jawabannya lagi diketik. Nunggu 6 detik jadi kerasa instan." },
      { type: "h2", text: "3. Minta output terstruktur" },
      { type: "p", text: "Kalau hasilnya mau ditampilin di UI, minta JSON yang sesuai skema terus validasi. Dari yang tadinya \"biasanya jalan\" jadi \"pasti jalan, atau error-nya jelas\"." },
      { type: "list", items: ["Definisiin bentuk datanya pakai library kayak Zod", "Validasi tiap respons sebelum di-render", "Kalau gagal, retry sekali sambil kirim pesan error-nya ke prompt"] },
      { type: "quote", text: "Model itu cuma satu bagian dari fitur. Integrasinya itulah produknya." },
      { type: "p", text: "Kalau dasar-dasar ini udah beres, masalah yang ribet kayak biaya, latency, dan kepercayaan user jadi jauh lebih gampang diurus." },
    ],
  },
  {
    slug: "rag-tanpa-hype",
    title: "RAG Tanpa Hype: Pelajaran dari Bikin Tutor Bahasa Jepang",
    titleJp: "検索",
    kanji: "検",
    tone: "light",
    category: "RAG",
    date: "2026-08-30",
    readTime: "6 menit baca",
    excerpt: "Chunking, filter metadata, dan kenapa bagian retrieval yang ngebosenin justru paling ngaruh.",
    content: [
      { type: "p", text: "Pas bikin Nihongo Buddy, saya kira jawaban jelek bakal beres kalau ganti model yang lebih pinter. Ternyata enggak. Yang beresin justru retrieval-nya." },
      { type: "h2", text: "Potong berdasarkan makna, bukan panjang" },
      { type: "p", text: "Awalnya catatan saya potong tiap 500 token, hasilnya penjelasan grammar kepotong di tengah. Begitu dipotong per poin grammar, jawabannya langsung jauh lebih lengkap." },
      { type: "h2", text: "Metadata itu senjata rahasia" },
      { type: "p", text: "Tiap potongan saya kasih tag level JLPT. Jadi pemula gak bakal dapet penjelasan level N1 yang bikin pusing." },
      { type: "list", items: ["Potong per satuan makna", "Simpan level, sumber, dan topik sebagai metadata", "Tunjukin sumbernya ke user biar lebih dipercaya"] },
      { type: "quote", text: "Kualitas retrieval nentuin batas atasnya. Model cuma nentuin seberapa deket kamu ke batas itu." },
    ],
  },
  {
    slug: "dari-it-coordinator-ke-ai-engineer",
    title: "Dari IT Coordinator Jadi Junior AI Engineer",
    titleJp: "道",
    kanji: "道",
    tone: "mid",
    category: "Karier",
    date: "2026-10-01",
    readTime: "5 menit baca",
    excerpt: "Setahun ngurusin sistem biar tetap jalan ternyata ngajarin saya banyak soal bikin fitur AI yang beneran dipakai orang.",
    content: [
      { type: "p", text: "Sebelum kerja di AI, saya setahun jadi IT Coordinator. Ngurusin jaringan, bantu onboarding, dan jagain sistem sehari-hari biar gak tumbang. Ternyata itu bekal paling berguna buat saya sekarang." },
      { type: "h2", text: "User dulu, teknologi belakangan" },
      { type: "p", text: "Tiap hari bantuin orang bikin saya sadar: tools yang gak dipahami ya gak bakal dipakai. Sekarang saya desain fitur AI dari sisi orang yang make, bukan dari sisi modelnya." },
      { type: "h2", text: "Stabil itu juga fitur" },
      { type: "p", text: "Di dunia IT, downtime itu musuh utama. Mindset itu kebawa sampai sekarang. Fallback, retry, dan pesan error yang jelas sama pentingnya kayak prompt yang pinter." },
      { type: "quote", text: "Tiap bikin sistem, saya selalu nanya: siapa yang bakal make ini besok pagi?" },
    ],
  },
  {
    slug: "prompt-buat-output-json",
    title: "Bikin Prompt yang Output JSON-nya Gak Ngaco",
    titleJp: "構造",
    kanji: "構",
    tone: "dark",
    category: "Prompt Engineering",
    date: "2026-07-18",
    readTime: "7 menit baca",
    excerpt: "Skema, contoh, dan loop validasi biar output model yang random jadi data yang bisa dipercaya app kamu.",
    content: [
      { type: "p", text: "Kebanyakan integrasi AI rusak di titik yang sama: pas output model harus jadi data. Ini cara saya bikin tahap itu jadi ngebosenin dan bisa ditebak." },
      { type: "h2", text: "Kasih contoh bentuknya, jangan cuma dijelasin" },
      { type: "p", text: "Masukin contoh kecil JSON yang kamu mau. Model jauh lebih jago niru struktur daripada ngikutin penjelasan panjang." },
      { type: "code", lang: "ts", code: `const Review = z.object({\n  aspect: z.enum(["broth", "noodles", "service", "price"]),\n  sentiment: z.enum(["positive", "neutral", "negative"]),\n  quote: z.string(),\n})` },
      { type: "h2", text: "Validasi, terus minta perbaiki" },
      { type: "p", text: "Kalau validasi gagal, kirim balik error-nya ke model sekali dan minta dibenerin. Satu kali retry ini udah nyelesain hampir semua kasus." },
    ],
  },
  {
    slug: "kaizen-buat-developer",
    title: "Kaizen buat Developer: Improve Dikit-Dikit Tiap Hari",
    titleJp: "改善",
    kanji: "改",
    tone: "light",
    category: "Budaya Jepang",
    date: "2026-06-05",
    readTime: "4 menit baca",
    excerpt: "Gimana filosofi Jepang soal perbaikan terus-menerus ngubah cara saya ngoding dan belajar hal baru.",
    content: [
      { type: "p", text: "改善 (kaizen) artinya perbaikan terus-menerus. Perubahan kecil tapi konsisten, bukan rombak total. Saya pertama kenal konsep ini pas kuliah di Politeknik Takumi, dan diam-diam ngubah cara saya kerja." },
      { type: "h2", text: "Satu perbaikan kecil tiap hari" },
      { type: "p", text: "Ganti nama variabel yang bikin bingung. Tambahin test yang kelewat. Hapus file yang udah gak kepake. Hal kecil kayak gini numpuknya lebih cepet daripada rewrite gede-gedean." },
      { type: "list", items: ["Tinggalin tiap file sedikit lebih rapi dari sebelumnya", "Ukur dulu sebelum dan sesudah", "Belajar satu hal kecil tiap hari"] },
      { type: "quote", text: "Progress itu sunyi. Bentuknya ratusan hal kecil yang dikerjain dengan bener." },
    ],
  },
];

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

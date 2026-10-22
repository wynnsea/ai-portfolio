// Ubah data di file ini untuk mempersonalisasi seluruh website.
// Data bertanda "dummy" masih contoh dan perlu diganti.
export const site = {
  brand: "WYNNSEA",
  name: "Wayan",
  nameJp: "ワヤン",
  role: "Junior AI Engineer",
  tagline: "junior AI engineer",
  description:
    "Lulusan Politeknik Takumi yang suka ngulik integrasi AI. Saya nyambungin LLM, API, dan data jadi aplikasi web yang beneran kepake.",
  // Deskripsi netral untuk metadata (judul tab & mesin pencari)
  metaDescription:
    "Portfolio Wayan, junior AI engineer lulusan Politeknik Takumi yang berfokus pada integrasi AI ke aplikasi web.",
  location: "Indonesia",
  // Status ketersediaan di hero. Set `open: false` untuk menyembunyikan badge.
  availability: {
    open: true,
    label: "Open to work",
    detail: "Full-time & freelance",
  },
  email: "wayaandeva123@gmail.com",
  // Ganti dengan foto kamu, misalnya "/images/profile.jpg"
  photo: "/images/wyn.jpg",
  stats: [
    { value: "6", label: "Project kelar" }, // dummy
    { value: "3", label: "Tahun ngulik" },
  ],
  nav: [
    { label: "About Me", href: "#about" },
    { label: "Projects", href: "#projects" },
    { label: "Certifications", href: "#certifications" },
    { label: "Activities", href: "#activities" },
    { label: "Blog", href: "#blog" },
  ],
  socials: [
    { label: "GitHub", href: "https://github.com/wynnsea" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/wayan-deva/" },
  ],
  greetings: [
    "Halo",
    "Hello",
    "こんにちは",
    "Hola",
    "Bonjour",
    "ようこそ",
    "Selamat Datang",
  ],
} as const;

export const about = {
  story: [
    "Haii, saya Wayan! Junior AI engineer lulusan D3 Teknologi Informasi Politeknik Takumi. Saya bukan tipe yang bikin model AI dari nol. Yang saya suka itu integrasinya: ambil model yang udah keren, terus dirakit jadi produk yang beneran nyelesain masalah.",
    "Sehari-hari saya main di area pertemuan AI dan software. Nyambungin API LLM, bikin pipeline RAG, ngatur prompt biar output-nya rapi dan konsisten, terus dibungkus jadi web yang cepet dan enak dipakai. Sebelum masuk dunia AI, saya sempet jadi IT Coordinator, dan dari situ saya belajar satu hal penting: sistem sebagus apa pun gak ada artinya kalau penggunanya bingung. Di luar ngoding, saya suka banget sama budaya Jepang, dan prinsip 改善 (kaizen) jadi pegangan saya buat terus improve sedikit demi sedikit.",
  ],
  education: {
    school: "Politeknik Takumi",
    degree: "D3 Teknologi Informasi",
    period: "2023 - 2026",
  },
  experience: [
    { role: "Junior AI Engineer", company: "Global Collabo Tech", period: "Okt 2026 - Sekarang" },
    { role: "IT Coordinator", company: "Politeknik Takumi", period: "Agu 2024 - Agu 2025" },
  ],
  skills: [
    {
      group: "Integrasi AI",
      items: ["API LLM (OpenAI, Claude, Gemini)", "RAG", "Vector database", "Prompt engineering", "LangChain", "Otomasi AI"],
    },
    { group: "Web Dev", items: ["Next.js", "TypeScript", "React", "Tailwind CSS", "FastAPI", "PostgreSQL"] },
    { group: "Tools & Infra", items: ["Git", "Docker", "Vercel", "Linux", "Postman", "Figma"] },
  ],
  interests: [
    { jp: "日本語", label: "Belajar bahasa Jepang" },
    { jp: "文化", label: "Budaya Jepang" },
    { jp: "改善", label: "Mindset kaizen" },
    { jp: "連携", label: "Nyambungin AI ke produk" },
  ],
} as const;

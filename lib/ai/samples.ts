// Contoh teks lowongan untuk mencoba fitur Job Match.
// SAMPLE_JOB masih dipakai oleh script percobaan di folder scripts/.
export const SAMPLE_JOB = `Kami lagi cari Junior AI Engineer buat tim produk.

Tanggung jawab:
- Mengintegrasikan LLM (OpenAI / Claude) ke fitur aplikasi
- Membangun pipeline RAG dan mengelola vector database
- Bikin API pakai Python (FastAPI) dan frontend Next.js

Kualifikasi:
- Paham prompt engineering dan Docker
- Nilai plus: pengalaman AWS, Kubernetes, atau bisa bahasa Jepang`;

export type SampleJob = {
  id: string;
  group: "Relevan" | "Beda bidang" | "Kasus Khusus";
  title: string;
  /** Apa yang sebaiknya diperhatikan pengunjung di hasilnya. */
  hint: string;
  text: string;
};

/** Pilihan contoh lowongan di popup "Pakai contoh lowongan". */
export const SAMPLE_JOBS: SampleJob[] = [
  {
    id: "junior-ai",
    group: "Relevan",
    title: "Junior AI Engineer",
    hint: "Skor normal + proyek bukti",
    text: `Lowongan: Junior AI Engineer – PT Data Nusantara

Tanggung jawab:
- Mengintegrasikan LLM (OpenAI, Gemini) ke fitur chatbot customer service
- Membuat structured output dan prompt yang konsisten
- Membangun API dengan Python FastAPI

Kualifikasi:
- Fresh graduate atau pengalaman maksimal 1 tahun
- Paham Git dan REST API
- Nilai plus: pernah memakai Kubernetes`,
  },
  {
    id: "senior-ml",
    group: "Relevan",
    title: "Senior ML Engineer",
    hint: "Skor kena penalti senioritas",
    text: `Senior Machine Learning Engineer

Kualifikasi:
- Minimal 6 tahun pengalaman di bidang ML/AI
- Ahli integrasi LLM API dan arsitektur RAG skala besar
- Berpengalaman deploy model di Kubernetes dan AWS
- Memimpin tim engineer 3-5 orang
- Nilai plus: publikasi riset atau pengalaman fine-tuning model`,
  },
  {
    id: "ai-solutions",
    group: "Relevan",
    title: "AI Solutions Engineer",
    hint: "Syarat non-teknis diabaikan",
    text: `AI Solutions Engineer (Junior)

Wajib:
- Integrasi API LLM ke aplikasi klien
- Pemrograman Python dan Next.js
- Mampu mencapai target penjualan bulanan
- Memiliki SIM C dan kendaraan pribadi

Nilai plus:
- Pengalaman dengan Kubernetes atau Docker`,
  },
  {
    id: "perawat",
    group: "Beda bidang",
    title: "Perawat Klinik",
    hint: "Tidak dinilai: beda bidang",
    text: `Dicari Perawat Klinik – RS Sehat Sentosa

Kualifikasi:
- Pendidikan D3/S1 Keperawatan
- Memiliki STR aktif
- Berpengalaman di IGD minimal 1 tahun
- Bersedia kerja shift
- Nilai plus: sertifikat BTCLS`,
  },
  {
    id: "finance",
    group: "Beda bidang",
    title: "Staf Keuangan & Akuntansi",
    hint: "Ada sedikit unsur IT, tapi tetap beda bidang",
    text: `Staf Keuangan & Akuntansi

Wajib:
- S1 Akuntansi
- Menguasai penyusunan laporan keuangan dan rekonsiliasi bank
- Paham perpajakan (PPh 21, PPN)
- Terbiasa menggunakan software akuntansi (Accurate/Jurnal)
- Mahir Microsoft Excel`,
  },
  {
    id: "fullstack-ai",
    group: "Relevan",
    title: "Fullstack Web & AI Developer",
    hint: "Next.js + integrasi LLM",
    text: `Fullstack Web & AI Developer – Startup Tech
    
Kualifikasi:
- Menguasai Next.js, React, dan TypeScript
- Pengalaman menghubungkan API LLM (Gemini, Claude, atau OpenAI)
- Terbiasa dengan Tailwind CSS dan PostgreSQL
- Nilai plus: antusias dengan budaya kaizen & otomasi sistem`,
  },
  {
    id: "terlalu-singkat",
    group: "Kasus Khusus",
    title: "Lowongan Singkat / Gig",
    hint: "Deskripsi minimalis",
    text: `Butuh orang yang bisa pakai ChatGPT API buat project kecil. Hubungi HR ya.`,
  },
  {
    id: "bukan-lowongan",
    group: "Kasus Khusus",
    title: "Tawaran Jasa Pembuatan Web",
    hint: "Bukan rekrutmen kerja",
    text: `Halo kak, mau tanya harga jasa bikin website company profile berapa ya? Butuh selesai bulan depan, budget sekitar 5 juta.`,
  },
];

# WYNNSEA — AI Portfolio

Website portofolio personal Wayan, Junior AI Engineer. Dibangun dengan Next.js 16 (App Router), Tailwind CSS v4, Motion (Framer Motion), dan Lenis.

## Tahap 1 (selesai)

- **Hero section**: foto di kiri, "Hello" dan deskripsi di kanan, rail vertikal, statistik, responsif.
- **Palet warna**: `#222222` primary, `#7B7B7B` secondary, `#F8F8F8` tertiary, `#FFFFFF` white.
- **Animasi**: preloader dengan ucapan selamat datang, parallax berlapis, reveal per section, smooth scroll.

## Tahap 2 (selesai)

- Brand **WYNNSEA**, profil Wayan (D3 Teknologi Informasi, Politeknik Takumi) dengan aksen Jepang.
- Section **About Me**: cerita, pendidikan, pengalaman, skill, minat.
- Section **Projects**: 6 proyek dummy dengan susunan acak, masing-masing punya kecepatan parallax berbeda.
- Halaman detail `/projects/[slug]`: overview, tantangan, pendekatan, hasil, galeri, tech stack, proyek berikutnya.
- Tombol mengambang **SEA AI** (panel chat placeholder, siap disambungkan ke chatbot).
- Scrollbar disembunyikan, indikator dev Next.js dimatikan (`devIndicators: false`).

## Tahap 3 (selesai)

- Profil diperbarui: fokus integrasi AI, pengalaman IT Coordinator & Junior AI Engineer, D3 2023–2026.
- Proyek dummy ditulis ulang dengan fokus integrasi AI (LLM API, RAG, embeddings, tool calling).
- **Blog** dengan 5 artikel dummy: artikel unggulan, daftar artikel dengan preview cover yang mengikuti kursor, dan halaman artikel `/blog/[slug]` dengan progress bar membaca.

## Fitur AI

Semua fitur AI berjalan di API route server memakai **Gemini** lewat **LangChain + LangGraph**.
Kalau `GEMINI_API_KEY` kosong atau semua model gagal, jawaban otomatis jatuh ke simulasi di `lib/ai/mock.ts`.

| Fitur | Komponen | API route | Logika |
| --- | --- | --- | --- |
| Chat SEA AI + tombol aksi ke halaman terkait | `components/chat-launcher.tsx` | `/api/sea` | `lib/ai/sea-graph.ts` (retrieve → generate → finalize) |
| Job Match untuk recruiter | `components/ai/job-match-section.tsx` | `/api/job-match` | LLM mengekstrak syarat (`lib/ai/job-match.ts`), skor dihitung deterministik (`lib/ai/job-match-score.ts`) |
| Penjelas project per level pembaca | `components/ai/project-explainer.tsx` | `/api/explain` | `lib/ai/workflows.ts` |
| TL;DR artikel | `components/ai/tldr-box.tsx` | `/api/tldr` | `lib/ai/workflows.ts` |
| Pencarian ⌘K / Ctrl+K | `components/ai/command-palette.tsx` | `/api/search` | Semantic search di `lib/ai/workflows.ts` |

- **RAG** (`lib/ai/rag.ts`), alurnya:
  1. Konten (profil, proyek, artikel, sertifikasi, kegiatan) disusun jadi dokumen.
  2. **Chunking** (`lib/ai/chunking.ts`): dokumen panjang dipecah per paragraf/baris/kalimat (maks 900 karakter,
     overlap 150), judul dokumen diulang di tiap potongan.
  3. **Embedding** Gemini `gemini-embedding-001` (768 dimensi, `RETRIEVAL_DOCUMENT` / `RETRIEVAL_QUERY`).
     Hasilnya disimpan di tabel `rag_chunks` (pgvector) per hash isi (`lib/ai/embedding-store.ts`),
     jadi hanya potongan baru/berubah yang di-embed ulang.
  4. **Retrieval** hybrid di memori: 65% kemiripan embedding + 35% skor kata kunci. Fungsi `match_rag_chunks`
     di database siap dipakai kalau korpus membesar.
- **Fallback model** (`lib/ai/langchain-llm.ts`): mencoba beberapa model Gemini berurutan dengan structured output (Zod).

### Agen Blog (admin → Agen Blog)

AI yang menulis draft artikel secara terjadwal; semua hasil berstatus **Draft** sampai kamu terbitkan.

- **Bahan**: antrian ide + catatan mentah dari admin. Kalau kosong, agen mengusulkan topik dari proyek & skill.
- **Alur** (`lib/ai/blog-agent.ts`, LangGraph): pilih topik → ambil konteks dari RAG → tulis (Gemini Flash, thinking LOW)
  → cek SEO otomatis (panjang judul/meta, slug, subjudul, keyword, jumlah kata) → tulis ulang sekali kalau belum lolos → simpan Draft.
- **Review**: pratinjau tampilan Google, catatan yang perlu dicek, tombol Terbitkan / Arsipkan / Minta revisi.
- **Jadwal**: Vercel Cron (`vercel.json`) memanggil `/api/cron/blog-agent` tiap hari 08.00 WIB; agen menulis kalau sudah lewat
  interval di pengaturan. Wajib isi `CRON_SECRET` dan `SUPABASE_SERVICE_ROLE_KEY` di env Vercel.
- **Notifikasi** email via Resend (opsional) saat draft baru siap atau agen gagal.

### Form kontak & keamanan

- **Anti-bot**: honeypot tersembunyi + Cloudflare Turnstile (`components/turnstile.tsx`, `lib/contact-guard.ts`).
  Isi `NEXT_PUBLIC_TURNSTILE_SITE_KEY` dan `TURNSTILE_SECRET_KEY`; kalau kosong, verifikasi dilewati.
- **Notifikasi email** pesan baru lewat Resend: isi `RESEND_API_KEY` dan `CONTACT_NOTIFY_EMAIL` (opsional).
- **Kunjungan** dicatat lewat `/api/visit` (service role + rate limit), bukan insert langsung dari browser.
- **Security header** (CSP, HSTS, X-Frame-Options, dll.) diatur di `next.config.ts`. CSP memakai `'unsafe-inline'`
  karena nonce tidak cocok dengan Partial Prerendering. Tambahkan domain ke CSP kalau memuat script/gambar dari luar.

### Rate limit

Semua route AI dan form kontak dibatasi lewat `lib/rate-limit.ts`. Hitungannya disimpan di tabel
`public.rate_limits` (migration `20261106000000_rate_limits.sql`) supaya tetap berlaku di hosting serverless.

| Route | Batas per IP |
| --- | --- |
| `/api/sea` | 15 / 10 menit |
| `/api/job-match` | 5 / jam |
| `/api/explain`, `/api/tldr` | 10 / jam |
| `/api/search` | 60 / 10 menit |
| `/api/contact` | 2 / 24 jam per IP **dan** per email |

Seluruh fitur AI juga punya batas global 500 permintaan/jam sebagai rem biaya.
Fungsi `hit_rate_limit` hanya bisa dipanggil service role, jadi **`SUPABASE_SERVICE_ROLE_KEY` wajib diisi di server**.
Tanpa kunci itu, limiter jatuh ke mode in-memory yang hanya berlaku per instance.

IP pengunjung dibaca dari `x-real-ip` / `x-forwarded-for`. Di Vercel header ini diisi platform; kalau self-host,
pastikan reverse proxy menimpa header tersebut supaya tidak bisa dipalsukan klien.

## Setup

Butuh Node.js 20.9 atau lebih baru.

### Backend Supabase

Website dan panel admin memakai Supabase (Postgres, Auth, dan Storage), bukan API Laravel.

1. Salin `.env.example` menjadi `.env.local`, lalu isi `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, dan `GEMINI_API_KEY`.
2. Di Supabase SQL Editor, jalankan semua file di `supabase/migrations/` sesuai urutan nama file
   (`init`, `contact_messages`, `rate_limits`, `page_views_server_only`, `rag_chunks`, `blog_agent`), lalu `supabase/seed.sql` untuk data awal.
3. Buat akun admin di Supabase Authentication, lalu daftarkan UUID user tersebut ke
   `public.admins` agar kebijakan RLS memberi akses tulis ke panel.

Service role key hanya dipakai di server (`lib/supabase/server.ts`, untuk form kontak dan rate limit).
Jangan pernah menaruhnya di variabel `NEXT_PUBLIC_*`; akses database publik dan admin dibatasi oleh RLS di migration.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build production
npm run start      # jalankan hasil build
```

Jika memulai dari nol:

```bash
npx create-next-app@latest ai-portfolio --typescript --tailwind --eslint --app
cd ai-portfolio
npm install motion lenis
```

## Library

| Paket | Kegunaan |
| --- | --- |
| `next`, `react`, `react-dom` | Framework |
| `tailwindcss` v4 | Styling dan design token (`@theme` di `app/globals.css`) |
| `motion` | Framer Motion (nama paket barunya). Import dari `motion/react` |
| `lenis` | Smooth scroll agar parallax terasa halus |
| `@supabase/supabase-js` | Database, Auth panel admin, dan Storage gambar |
| `@langchain/core`, `@langchain/langgraph`, `@langchain/google-genai` | Pipeline AI (graph, RAG, Gemini) |
| `zod` | Skema structured output LLM |

## Struktur folder

```
app/
  layout.tsx                 Font, metadata, provider
  (site)/                    Website publik (navbar, tombol SEA AI)
    page.tsx                 Susunan section halaman utama
    projects/[slug]/         Detail proyek
    blog/[slug]/             Artikel blog
  admin/
    (auth)/login/            Login admin (Supabase Auth)
    (panel)/                 Dashboard, CRUD proyek/artikel/sertifikasi/kegiatan, pesan, pengaturan
  api/
    sea, job-match, explain, tldr, search   Fitur AI
    contact                  Form kontak → tabel messages
  sitemap.ts, robots.ts, opengraph-image.tsx   SEO
components/
  providers/                 Lenis, intro, pengaturan situs
  motion/                    Parallax & reveal
  ai/                        Job Match, explainer, TL;DR, command palette
  admin/                     Shell, CRUD generik, dashboard, pengaturan
  projects/, blog/, certifications/, activities/   Section konten
  chat-launcher.tsx          Tombol & panel SEA AI
  contact-form.tsx           Form kontak
lib/
  ai/                        LangGraph, RAG, Job Match, prompt, mock
  supabase/client.ts         Klien publik & admin (browser)
  supabase/server.ts         Klien service role (server saja)
  ai/chunking.ts             Pemecah dokumen untuk RAG
  ai/embedding-store.ts      Cache embedding di Supabase (pgvector)
  rate-limit.ts              Rate limit API route
  public-api.ts              Pembacaan data publik dari Supabase
  admin/                     Data & API panel admin
  site.ts, projects.ts, posts.ts, certifications.ts, activities.ts   Data cadangan / default
supabase/
  migrations/                Skema, RLS, storage, rate limit
  seed.sql                   Data awal
```

## Personalisasi

1. Edit `lib/site.ts`: profil, statistik, pengalaman, skill, sosial media. Baris bertanda `// dummy` masih contoh.
2. Edit `lib/projects.ts` untuk proyek asli dan `lib/posts.ts` untuk artikel. Isi `cover: "/images/projects/nama.jpg"` untuk memakai screenshot asli menggantikan cover kanji.
3. Taruh foto di `public/images/profile.jpg` lalu ubah `photo: "/images/profile.jpg"`. Foto otomatis dibuat hitam-putih. Rasio potret (4:5) dengan background polos memberi hasil terbaik.
4. Untuk mengulang preloader saat testing, buka tab baru atau hapus `intro-seen` dari Session Storage.

## Memakai font Aeonik (opsional)

Aeonik adalah font berbayar, jadi project ini memakai **Inter Tight** sebagai alternatif gratis. Jika punya lisensi Aeonik, taruh file-nya di `app/fonts/` lalu di `app/layout.tsx`:

```tsx
import localFont from "next/font/local";

const aeonik = localFont({
  variable: "--font-inter-tight", // pakai nama variabel yang sama agar CSS tidak perlu diubah
  src: [
    { path: "./fonts/Aeonik-Light.woff2", weight: "300" },
    { path: "./fonts/Aeonik-Regular.woff2", weight: "400" },
    { path: "./fonts/Aeonik-Medium.woff2", weight: "500" },
  ],
});
```

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

## Fitur AI (versi demo)

Semua fitur sudah lewat API route di server, tapi jawabannya masih simulasi dari `lib/ai/mock.ts`.
Untuk versi asli, cukup ganti isi fungsi mock dengan panggilan LLM (API key di `.env.local`).

| Fitur | Komponen | API route |
| --- | --- | --- |
| Chat SEA AI + tombol aksi ke halaman terkait | `components/chat-launcher.tsx` | `/api/sea` |
| Job Match untuk recruiter | `components/ai/job-match-section.tsx` | `/api/job-match` |
| Penjelas project per level pembaca | `components/ai/project-explainer.tsx` | `/api/explain` |
| TL;DR artikel | `components/ai/tldr-box.tsx` | `/api/tldr` |
| Pencarian ⌘K / Ctrl+K | `components/ai/command-palette.tsx` | (client, nanti pakai embeddings) |

Sebelum dipublikasikan dengan LLM asli: tambahkan rate limit per IP, cache hasil (TL;DR & penjelasan cukup dibuat sekali), dan batasi panjang input.

## Setup

Butuh Node.js 20.9 atau lebih baru.

### Backend Supabase

Website dan panel admin memakai Supabase (Postgres, Auth, dan Storage), bukan API Laravel.

1. Salin `.env.example` menjadi `.env.local`, lalu isi `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, dan `GEMINI_API_KEY`.
2. Di Supabase SQL Editor, jalankan `supabase/migrations/20261024000000_init.sql`,
   lalu `supabase/seed.sql` untuk membuat skema dan data awal.
3. Buat akun admin di Supabase Authentication, lalu daftarkan UUID user tersebut ke
   `public.admins` agar kebijakan RLS memberi akses tulis ke panel.

Jangan gunakan service role key di browser atau variabel `NEXT_PUBLIC_*`; akses database
publik dan admin dibatasi oleh kebijakan RLS di migration.

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

## Struktur folder

```
app/
  layout.tsx            Font, metadata, provider, navbar, tombol SEA AI
  page.tsx              Susunan section halaman utama
  projects/[slug]/page.tsx  Halaman detail proyek (prerender statis)
  blog/[slug]/page.tsx      Halaman artikel blog (prerender statis)
  globals.css           Design token (warna, font, easing)
components/
  providers/
    smooth-scroll.tsx   Lenis + MotionConfig (menghormati reduce motion)
    intro-provider.tsx  Status intro (sekali per sesi browser)
  motion/
    parallax.tsx        Wrapper parallax yang bisa dipakai ulang
    reveal.tsx          Animasi masuk saat section terlihat
    parallax-media.tsx  Gambar yang bergeser di dalam bingkainya
  preloader.tsx         Layar loading + ucapan selamat datang
  navbar.tsx            Navigasi + menu mobile (berfungsi juga dari halaman detail)
  about-section.tsx     Section About Me
  chat-launcher.tsx     Tombol & panel SEA AI
  projects/
    projects-section.tsx  Susunan card acak + parallax
    project-card.tsx      Card proyek (hover, link ke detail)
    project-cover.tsx     Cover kanji generatif / foto asli (dipakai juga oleh blog)
  blog/
    blog-section.tsx      Artikel unggulan + daftar artikel
    blog-list.tsx         Daftar artikel dengan preview mengikuti kursor
    reading-progress.tsx  Progress bar membaca
  hero.tsx              Hero section dengan parallax berlapis
  statement.tsx         Teks yang menyala kata demi kata mengikuti scroll
  contact-footer.tsx    Kontak
lib/
  site.ts               Data personal & About (nama, foto, skill, pengalaman)
  projects.ts           Data proyek (dummy)
  posts.ts              Data artikel blog (dummy)
public/images/          Foto profil
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

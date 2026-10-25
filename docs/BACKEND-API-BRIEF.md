# Brief Backend API: Portfolio WYNNSEA (Legacy)

> **Dokumen ini sudah tidak menggambarkan backend saat ini.** Frontend sekarang memakai Supabase
> langsung (Postgres, Auth, Storage, dan RLS), bukan API Laravel/Sanctum/MySQL. Gunakan
> `supabase/migrations/20261024000000_init.sql`, `supabase/seed.sql`, serta bagian "Backend
> Supabase" di `README.md` untuk konfigurasi aktif. Bagian di bawah dipertahankan hanya sebagai
> referensi historis bagi integrasi Laravel yang lama; jangan dipakai untuk setup baru.

Dokumen ini untuk developer/agent yang membangun **backend Laravel** untuk portfolio WYNNSEA.
Frontend sudah jadi (Next.js) dan saat ini memakai data statis + data mock. Tugas backend:
menyediakan REST API JSON supaya konten bisa dikelola dari panel admin dan dibaca oleh website.

---

## 1. Gambaran sistem

```
┌──────────────────────────┐        HTTPS / JSON        ┌──────────────────────────┐
│  Next.js (frontend)      │  ───────────────────────▶  │  Laravel (backend API)   │
│  - Website portfolio     │   GET publik (tanpa auth)  │  - REST API              │
│  - Panel admin /admin    │   CRUD admin (Bearer token)│  - Laravel Sanctum       │
│  - Fitur AI (Gemini)     │                            │  - MySQL                 │
└──────────────────────────┘                            │  - Storage file (upload) │
                                                        └──────────────────────────┘
```

- **Frontend dan backend beda domain/port** (dev: Next `http://localhost:3000`, Laravel `http://localhost:8000`).
  Frontend membaca base URL dari `NEXT_PUBLIC_API_URL` (mis. `http://localhost:8000/api`).
- **Autentikasi: Laravel Sanctum mode token (Bearer)**, bukan cookie SPA. Token dikirim di header
  `Authorization: Bearer <token>`.
- **Hanya ada satu admin** (pemilik portfolio). Tidak perlu registrasi, role, atau multi-user. Buat lewat seeder.
- **Fitur AI tetap di Next.js** (`/api/sea`, `/api/job-match`, `/api/explain`, `/api/tldr` memakai Gemini dengan
  key di server Next). Backend **tidak perlu** membuat endpoint AI.

### Pemilik & konteks konten
Wayan, Junior AI Engineer, lulusan D3 Teknologi Informasi Politeknik Takumi (2023 - 2026). Fokus integrasi AI
ke aplikasi web, minat budaya Jepang. Karena itu banyak konten punya field nuansa Jepang (`titleJp`, `kanji`).
Bahasa konten: Indonesia santai.

---

## 2. Konvensi API

| Hal | Aturan |
|---|---|
| Prefix | Semua route di `routes/api.php` → `/api/...` |
| Format JSON | **camelCase** di request & response (pakai API Resource untuk konversi). Kolom DB tetap snake_case. |
| Bungkus response | Format default Laravel API Resource: `{ "data": ... }`; list berpaginasi menambah `links` & `meta`. |
| Validasi gagal | `422` format default Laravel: `{ "message": "...", "errors": { "title": ["Judul wajib diisi"] } }`. Pesan validasi **bahasa Indonesia** (frontend menampilkan langsung di bawah input). |
| Tidak login / token salah | `401` `{ "message": "Unauthenticated." }` |
| Tidak ditemukan | `404` `{ "message": "..." }` |
| Tanggal | `YYYY-MM-DD` untuk tanggal; ISO 8601 untuk timestamp (`createdAt`, `updatedAt`). |
| File | Disimpan di `storage/app/public` (`php artisan storage:link`), response mengembalikan **URL absolut**. |
| CORS | Izinkan origin frontend (`http://localhost:3000` + domain produksi) di `config/cors.php`, header `Authorization`. |

### Query param untuk list admin
Tabel admin punya pencarian, filter, dan paginasi (6 baris per halaman):

| Param | Contoh | Arti |
|---|---|---|
| `search` | `?search=minori` | Cari di kolom teks utama (lihat tiap resource) |
| `status` / `category` | `?status=Draft` | Filter (nilai `Semua` atau kosong = tanpa filter) |
| `page`, `perPage` | `?page=2&perPage=6` | Paginasi, default `perPage=6` |
| `sort` | `?sort=-year` | Opsional. `-` = descending. Default: `sortOrder` lalu terbaru |

---

## 3. Autentikasi (Sanctum)

| Method | Endpoint | Body | Response |
|---|---|---|---|
| POST | `/api/admin/login` | `{ email, password, remember }` | `200 { token, user: { id, name, email } }` / `422` jika salah |
| POST | `/api/admin/logout` | – | `204` (hapus token aktif) |
| GET | `/api/admin/me` | – | `200 { data: { id, name, email, photoUrl } }` |
| PUT | `/api/admin/password` | `{ currentPassword, password, passwordConfirmation }` | `204` / `422` |

- Throttle login (mis. 5 percobaan/menit per IP).
- Pesan error login (422): `"Email atau password salah."`
- `remember: true` boleh dipakai untuk token tanpa kadaluarsa; `false` → kadaluarsa (mis. 1 hari).
- Seeder admin: email & password dari `.env` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`), jangan di-hardcode.

---

## 4. Resource & skema data

Ada **5 resource konten** + **1 singleton pengaturan**. Pemetaan nama menu admin → endpoint:

| Menu admin (FE) | Key FE | Endpoint | Tabel |
|---|---|---|---|
| Proyek | `proyek` | `projects` | `projects` |
| Sertifikasi | `sertifikasi` | `certifications` | `certifications` |
| Kegiatan | `kegiatan` | `activities` | `activities` |
| Artikel | `artikel` | `posts` | `posts` |
| Pesan | `pesan` | `messages` | `messages` |
| Pengaturan | – | `settings` | `settings` (1 baris) |

### Field bersama "cover kanji"
Proyek, sertifikasi, kegiatan, dan artikel ditampilkan dengan **cover kanji otomatis** jika tidak ada gambar:

| Field | Tipe | Keterangan |
|---|---|---|
| `titleJp` | string, ≤ 50 | Judul versi Jepang, mis. `"採用AI"` |
| `kanji` | string, 1-2 karakter | Kanji besar di cover, mis. `"採"` |
| `tone` | enum `dark` \| `mid` \| `light` | Warna cover |
| `coverUrl` | string URL, nullable | Jika diisi, mengganti cover kanji |

Semua resource konten juga punya: `id`, `sortOrder` (int, default 0, urutan tampil), `createdAt`, `updatedAt`.

### 4.1 Projects (`projects`)

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `slug` | string, unik | ya | Dibuat otomatis dari `title` jika kosong. URL detail: `/projects/{slug}` |
| `title` | string ≤ 120 | ya | |
| `category` | string ≤ 80 | ya | mis. `"AI Grading · Rekrutmen"` |
| `year` | string(4) | ya | |
| `role` | string ≤ 80 | tidak | mis. `"Full-stack & AI Integration"` |
| `duration` | string ≤ 50 | tidak | mis. `"3 bulan"` |
| `status` | enum `Draft` \| `Terbit` \| `Arsip` | ya | Default `Draft`. Hanya `Terbit` yang tampil publik |
| `summary` | text | ya | Ringkasan di kartu |
| `overview` | text | tidak | Halaman detail |
| `challenge` | text | tidak | Halaman detail |
| `approach` | array of string | tidak | Langkah pendekatan (JSON column) |
| `results` | array of `{ value, label }` | tidak | mis. `[{ "value": "80%", "label": "Lebih cepat" }]` (JSON) |
| `stack` | array of string | tidak | mis. `["Laravel", "React", "MySQL"]` (JSON). Form admin mengirim string dipisah koma → boleh terima keduanya |
| `links` | `{ demo?: url, source?: url }` | tidak | (JSON) |
| + field cover kanji | | | |

Search: `title`, `category`, `stack`. Filter: `status`.

### 4.2 Certifications (`certifications`)

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `title` | string | ya | mis. `"JLPT N4"` |
| `issuer` | string | ya | mis. `"Japan Foundation"` |
| `category` | enum `Japanese` \| `English` \| `Web Dev` \| `AI` | ya | |
| `year` | string, nullable | tidak | Bisa berupa teks bulan, mis. `"Des 2024"` |
| `score` | string, nullable | tidak | Skor/level, mis. `"520"` |
| `note` | string, nullable | tidak | Catatan kecil |
| `credentialUrl` | url, nullable | tidak | Link verifikasi |
| + field cover kanji | | | `coverUrl` = gambar sertifikat |

Search: `title`, `issuer`, `category`. Filter: `category`.

> ⚠️ **Privasi:** gambar sertifikat asli memuat tanggal lahir. Yang di-upload harus versi yang sudah disensor.
> Jangan pernah mengekspos file selain yang di-upload lewat endpoint.

### 4.3 Activities (`activities`)

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `title` | string | ya | |
| `role` | string | ya | mis. `"Fasilitator"` |
| `organizer` | string | tidak | mis. `"Politeknik Takumi"` |
| `category` | string | tidak | |
| `year` | string, nullable | tidak | |
| `description` | text | tidak | |
| `photos` | array of URL | tidak | Foto pertama = cover kartu, >1 = slideshow (JSON atau tabel relasi `activity_photos` dengan `sort_order`) |
| `focus` | string, nullable | tidak | CSS `object-position` untuk potongan foto, mis. `"50% 20%"` |
| + `titleJp`, `kanji`, `tone` | | | |

Search: `title`, `role`, `organizer`.

### 4.4 Posts / Artikel (`posts`)

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `slug` | string, unik | ya | Otomatis dari `title`. URL: `/blog/{slug}` |
| `title` | string | ya | |
| `category` | enum `Integrasi AI` \| `Budaya Jepang` \| `Web Dev` \| `Cerita` | ya | |
| `status` | enum `Draft` \| `Terbit` \| `Arsip` | ya | Default `Draft` |
| `date` | date `YYYY-MM-DD` | tidak | Tanggal terbit (isi otomatis saat pertama `Terbit` jika kosong) |
| `readTime` | string | tidak | Hitung otomatis dari jumlah kata, mis. `"5 menit baca"` |
| `excerpt` | string ≤ 300 | ya | |
| `content` | array of `PostBlock` | tidak | JSON, lihat di bawah |
| + field cover kanji | | | |

```ts
type PostBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; items: string[] }
  | { type: "code"; lang: string; code: string };
```
Validasi `content`: tiap item wajib punya `type` dari daftar di atas dan field sesuai tipenya.
(Sementara form admin masih textarea biasa; backend boleh menerima `content` berupa string lalu
memecahnya per paragraf menjadi blok `p`.)

Search: `title`, `category`, `excerpt`. Filter: `status`.

### 4.5 Messages / Pesan (`messages`)

Berasal dari **form kontak di website** (form publik belum ada di FE, akan dibuat setelah endpoint siap).

| Field | Tipe | Keterangan |
|---|---|---|
| `name` | string ≤ 80, wajib | |
| `email` | email, wajib | |
| `subject` | string ≤ 150, wajib | |
| `message` | text ≤ 2000, wajib | |
| `status` | enum `Baru` \| `Dibaca` \| `Dibalas` | Default `Baru`. Admin hanya mengubah status |
| `date` | date | = tanggal dibuat |

- Admin **tidak bisa membuat** pesan; hanya lihat, ubah status, hapus.
- Endpoint publik wajib **rate limit** (mis. 3/menit per IP) + honeypot field `website` (jika terisi, tolak diam-diam dengan 201 palsu).
- Opsional: kirim notifikasi email ke admin saat ada pesan baru (queue).

Search: `name`, `email`, `subject`. Filter: `status`.

### 4.6 Settings (singleton)

Data profil & tampilan website yang sekarang ada di `lib/site.ts` frontend:

```json
{
  "data": {
    "brand": "Wynnsea",
    "name": "Wayan",
    "nameJp": "ワヤン",
    "role": "Junior AI Engineer",
    "description": "Lulusan Politeknik Takumi yang suka ngulik integrasi AI...",
    "location": "Indonesia",
    "email": "wayaandeva123@gmail.com",
    "photoUrl": "https://.../storage/profile.jpg",
    "cvUrl": null,
    "availability": { "open": true, "label": "Siap bekerja", "detail": "Full-time & freelance" },
    "socials": [
      { "label": "GitHub", "href": "https://github.com/wynnsea" },
      { "label": "LinkedIn", "href": "https://www.linkedin.com/in/wayan-deva/" }
    ],
    "features": { "chatbot": true, "preloader": true }
  }
}
```
Simpan sebagai satu baris (kolom JSON) atau tabel key-value, bebas, asal response seperti di atas.

---

## 5. Daftar endpoint

### 5.1 Publik (tanpa auth, dipakai website)
Hanya mengembalikan data `status = Terbit` (untuk resource yang punya status). Boleh di-cache.

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/projects` | Semua proyek terbit, urut `sortOrder` (tanpa paginasi) |
| GET | `/api/projects/{slug}` | Detail proyek |
| GET | `/api/certifications` | Semua sertifikasi |
| GET | `/api/activities` | Semua kegiatan |
| GET | `/api/posts` | Artikel terbit, urut `date` desc (tanpa `content`) |
| GET | `/api/posts/{slug}` | Detail artikel + `content` |
| GET | `/api/settings` | Profil & pengaturan website |
| POST | `/api/messages` | Kirim pesan dari form kontak → `201` |

### 5.2 Admin (`auth:sanctum`, prefix `/api/admin`)

Untuk tiap resource `{r}` ∈ `projects`, `certifications`, `activities`, `posts`:

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/admin/{r}` | List berpaginasi + `search`, filter, `page`, `perPage` (semua status) |
| POST | `/api/admin/{r}` | Tambah → `201 { data }` |
| GET | `/api/admin/{r}/{id}` | Detail |
| PUT | `/api/admin/{r}/{id}` | Ubah (partial boleh) → `200 { data }` |
| DELETE | `/api/admin/{r}/{id}` | Hapus → `204` (hapus juga file terkait) |
| PATCH | `/api/admin/{r}/reorder` | Opsional: `{ ids: [3,1,2] }` untuk mengatur `sortOrder` |

Messages:

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/admin/messages` | List + `search`, `status` |
| GET | `/api/admin/messages/{id}` | Detail (otomatis set `Baru` → `Dibaca`) |
| PATCH | `/api/admin/messages/{id}` | `{ status }` |
| DELETE | `/api/admin/messages/{id}` | `204` |

Lainnya:

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/admin/settings` | Sama seperti publik |
| PUT | `/api/admin/settings` | Ubah sebagian/semua field settings |
| POST | `/api/admin/uploads` | `multipart/form-data` field `file` + `folder` (`projects`\|`certifications`\|`activities`\|`posts`\|`profile`\|`cv`) → `201 { url, path }`. Gambar: jpg/png/webp ≤ 4 MB; CV: pdf ≤ 5 MB |
| GET | `/api/admin/dashboard` | Data dashboard (lihat di bawah) |

### 5.3 Response dashboard

```json
{
  "data": {
    "counts": { "projects": 1, "certifications": 4, "activities": 5, "posts": 0, "messages": 5, "unreadMessages": 2 },
    "latestMessages": [ { "id": 1, "name": "Rina", "subject": "Tawaran posisi", "status": "Baru", "date": "2026-10-23" } ],
    "latestContent": [ { "type": "project", "title": "Minori AI RCR", "year": "2026" } ],
    "profileCompleteness": {
      "checks": [
        { "label": "Proyek", "done": true },
        { "label": "Sertifikasi", "done": true },
        { "label": "Kegiatan", "done": true },
        { "label": "CV", "done": false },
        { "label": "Artikel terbit", "done": false }
      ]
    },
    "weeklyVisitors": [ { "day": "Sen", "value": 38, "future": false } ]
  }
}
```
`latestMessages` maks 4, `latestContent` maks 5. `weeklyVisitors` **opsional**: boleh dikembalikan array
kosong dulu; nanti bisa diisi dari tabel `page_views` (catat lewat `POST /api/track` publik) atau layanan analytics.
Badge angka di menu "Pesan" dan lonceng notifikasi memakai `unreadMessages`.

---

## 6. Contoh request & response

**Login**
```http
POST /api/admin/login
Content-Type: application/json

{ "email": "wayaandeva123@gmail.com", "password": "********", "remember": true }
```
```json
{ "token": "1|abc...", "user": { "id": 1, "name": "Wayan", "email": "wayaandeva123@gmail.com" } }
```

**Tambah proyek**
```http
POST /api/admin/projects
Authorization: Bearer 1|abc...
Content-Type: application/json

{
  "title": "Minori AI RCR",
  "category": "AI Grading · Rekrutmen",
  "year": "2026",
  "role": "Full-stack & AI Integration",
  "status": "Terbit",
  "summary": "Website walk-in rekrutmen untuk PT Minori dengan AI yang menilai calon pemagang...",
  "stack": "Laravel, React, Integrasi LLM, FastAPI, MySQL",
  "titleJp": "採用AI",
  "kanji": "採",
  "tone": "dark"
}
```
```json
{
  "data": {
    "id": 1,
    "slug": "minori-ai-rcr",
    "title": "Minori AI RCR",
    "category": "AI Grading · Rekrutmen",
    "year": "2026",
    "role": "Full-stack & AI Integration",
    "duration": null,
    "status": "Terbit",
    "summary": "Website walk-in rekrutmen ...",
    "overview": null,
    "challenge": null,
    "approach": [],
    "results": [],
    "stack": ["Laravel", "React", "Integrasi LLM", "FastAPI", "MySQL"],
    "links": {},
    "titleJp": "採用AI",
    "kanji": "採",
    "tone": "dark",
    "coverUrl": null,
    "sortOrder": 0,
    "createdAt": "2026-10-23T08:00:00Z",
    "updatedAt": "2026-10-23T08:00:00Z"
  }
}
```

**List admin berpaginasi**
```http
GET /api/admin/projects?search=ai&status=Terbit&page=1&perPage=6
```
```json
{
  "data": [ { "id": 1, "title": "Minori AI RCR", "...": "..." } ],
  "links": { "first": "...", "last": "...", "prev": null, "next": null },
  "meta": { "current_page": 1, "last_page": 1, "per_page": 6, "total": 1 }
}
```

---

## 7. Data awal (seeder)

Isi seeder dari data yang sudah ada di frontend supaya website langsung sama seperti sekarang:

| Sumber di repo frontend | Isi |
|---|---|
| `lib/projects.ts` | 1 proyek: Minori AI RCR |
| `lib/certifications.ts` | 4 sertifikat: JLPT N4, Junior Web Developer, TOEFL Prediction, iTEP Essential |
| `lib/activities.ts` | 5 kegiatan (Nusantara Data Center Academy, Bunkasai, Learning Factory PT Minori, HI Tech Berbagi, Malam Keakraban HIMA TI) beserta path foto di `public/activities/` |
| `lib/posts.ts` | Kosong (belum ada artikel) |
| `lib/site.ts` | Settings / profil |

Pesan & artikel **tidak** perlu di-seed (data di panel admin saat ini hanya contoh).

---

## 8. Integrasi frontend

Panel admin memakai `NEXT_PUBLIC_API_URL` (contoh lokal: `http://localhost:8000/api`) untuk:
- Login Sanctum, penyimpanan token, validasi sesi melalui `/api/admin/me`, dan logout.
- CRUD admin untuk proyek, sertifikasi, kegiatan, artikel, dan pesan; termasuk pencarian dan paginasi.
- Dashboard, pengaturan profil/website, ubah password, dan upload foto profil.

Integrasi data publik website (`GET /api/projects`, `/api/posts`, dan endpoint lain), perluasan form
admin untuk field konten lanjutan, serta form kontak publik masih menjadi pekerjaan berikutnya.

## 9. Checklist backend

- [ ] Laravel + Sanctum + MySQL, CORS untuk origin frontend
- [ ] Migration 5 tabel konten + `settings` + `personal_access_tokens`
- [ ] Model + cast JSON (`approach`, `results`, `stack`, `links`, `photos`, `content`, settings)
- [ ] API Resource (output camelCase, URL file absolut)
- [ ] Form Request validasi dengan pesan bahasa Indonesia
- [ ] Route publik (read-only, hanya `Terbit`) + route admin (`auth:sanctum`)
- [ ] Auth: login, logout, me, ganti password, throttle
- [ ] Upload file + hapus file lama saat diganti/dihapus
- [ ] `POST /api/messages` publik dengan rate limit + honeypot
- [ ] Endpoint dashboard
- [ ] Seeder admin (dari `.env`) + seeder konten dari data frontend
- [ ] Feature test untuk auth dan CRUD tiap resource

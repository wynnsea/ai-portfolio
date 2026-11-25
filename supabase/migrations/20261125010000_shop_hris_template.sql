-- Template berbayar: Rowan HRIS Dashboard (demo live di hris.demo.wynnsea.my.id).
-- Jalankan di Supabase Dashboard → SQL Editor. Aman dijalankan ulang (upsert berdasarkan slug).
-- Gambar ada di repo shop: public/templates/hris-dashboard/.
-- File zip di-upload lewat Admin → Shop → Template (kolom "File zip template").

insert into public.shop_templates
  (slug, title, summary, description, category, tech_stack, price, demo_url, thumbnail_url, screenshots, mobile_screenshots, features, version, file_size, storage_file_path, status)
values (
  'rowan-hris-dashboard',
  'Rowan HRIS Dashboard',
  'Dashboard HRIS lengkap 12 halaman: karyawan, absensi, cuti, payroll, rekrutmen, performa, dan departemen dengan data contoh.',
  'Template HRIS (Human Resource Information System) siap pakai untuk tim HR atau startup. Ada 12 halaman yang semuanya terisi data contoh dan bisa diklik: dashboard ringkasan, direktori 48 karyawan dengan pencarian, filter, urutan, paginasi, tampilan tabel atau grid, dan export CSV; profil karyawan dengan tab kontrak, absensi, cuti, gaji, dan dokumen; absensi harian; persetujuan cuti dengan kalender; payroll dengan slip gaji yang bisa dicetak; papan kanban kandidat rekrutmen; review performa dan target; departemen; serta pengaturan dengan hak akses dan pilihan warna. Perubahan tersimpan di browser, ada mode gelap, dan semuanya dibuat dengan HTML, Tailwind CSS, dan JavaScript tanpa framework.',
  'Dashboard',
  array['HTML', 'Tailwind'],
  49000,
  'https://hris.demo.wynnsea.my.id',
  '/templates/hris-dashboard/card.webp',
  array[
    '/templates/hris-dashboard/desktop-1.webp',
    '/templates/hris-dashboard/desktop-2.webp',
    '/templates/hris-dashboard/desktop-3.webp',
    '/templates/hris-dashboard/desktop-4.webp',
    '/templates/hris-dashboard/desktop-5.webp',
    '/templates/hris-dashboard/desktop-6.webp'
  ],
  array[
    '/templates/hris-dashboard/mobile-1.webp',
    '/templates/hris-dashboard/mobile-2.webp',
    '/templates/hris-dashboard/mobile-3.webp'
  ],
  array[
    '12 halaman lengkap: dashboard, karyawan, profil, absensi, cuti, payroll, rekrutmen, performa, departemen, pengaturan, login, 404',
    'Direktori karyawan dengan pencarian, filter, urutan, paginasi, dan export CSV',
    'Persetujuan cuti, run payroll, dan slip gaji yang bisa dicetak',
    'Kanban kandidat rekrutmen yang bisa dipindah antar tahap',
    'Mode gelap dan pilihan warna aksen, tersimpan di browser',
    'Pencarian cepat Ctrl/⌘ + K untuk lompat ke halaman atau karyawan',
    'Responsif: sidebar jadi menu geser di tablet dan HP',
    'Tanpa framework dan tanpa library grafik'
  ],
  'v1.0.0',
  null,
  'hris-dashboard/hris-dashboard-v1.0.0.zip',
  'Terbit'
)
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  category = excluded.category,
  tech_stack = excluded.tech_stack,
  price = excluded.price,
  demo_url = excluded.demo_url,
  thumbnail_url = excluded.thumbnail_url,
  screenshots = excluded.screenshots,
  mobile_screenshots = excluded.mobile_screenshots,
  features = excluded.features,
  status = 'Terbit';
-- storage_file_path sengaja tidak ditimpa supaya file zip yang sudah di-upload dari admin tetap terpakai.

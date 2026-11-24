-- Migration: Wynnsea Shop (shop.wynnsea.my.id) di database yang sama dengan portfolio.
-- Jalankan di Supabase Dashboard → SQL Editor.
--
-- - shop_templates : katalog template (dibaca publik, dikelola admin)
-- - shop_orders    : pesanan pembeli (pembeli hanya melihat miliknya, admin melihat semua)
-- - Bucket private "shop-source-files": file zip template, hanya bisa diunduh pembeli yang pesanannya lunas
--
-- Pembeli TIDAK bisa menulis tabel langsung. Pesanan dibuat lewat fungsi (RPC) di bawah,
-- yang menghitung harga dari database supaya harga tidak bisa diubah dari browser.
-- Admin tetap ditentukan oleh tabel public.admins (fungsi is_admin()), bukan sekadar "sudah login".

-- ---------------------------------------------------------------------------
-- Katalog template
-- ---------------------------------------------------------------------------

create table if not exists public.shop_templates (
  id bigint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 3 and 120),
  summary text not null default '' check (char_length(summary) <= 300),
  description text not null default '' check (char_length(description) <= 5000),
  category text not null default 'Landing Page'
    check (category in ('Landing Page', 'Dashboard', 'SaaS', 'Portfolio', 'E-Commerce')),
  tech_stack text[] not null default '{}',
  price integer not null default 0 check (price >= 0),           -- Rupiah, 0 = gratis
  demo_url text,
  thumbnail_url text,                                             -- gambar kartu katalog (4:3)
  screenshots text[] not null default '{}',                       -- galeri desktop
  mobile_screenshots text[] not null default '{}',                -- galeri HP
  features text[] not null default '{}',
  version text not null default 'v1.0.0',
  file_size text,
  storage_file_path text,                                         -- path file zip di bucket shop-source-files
  downloads_count integer not null default 0,
  status text not null default 'Draft' check (status in ('Draft', 'Terbit', 'Arsip')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists shop_templates_updated_at on public.shop_templates;
create trigger shop_templates_updated_at before update on public.shop_templates
  for each row execute function public.set_updated_at();

alter table public.shop_templates enable row level security;

-- Arsip tetap bisa dibaca supaya pembeli lama masih melihat & mengunduh templatenya
drop policy if exists "publik membaca template shop" on public.shop_templates;
create policy "publik membaca template shop" on public.shop_templates
  for select to anon, authenticated using (status in ('Terbit', 'Arsip'));

drop policy if exists "admin mengelola template shop" on public.shop_templates;
create policy "admin mengelola template shop" on public.shop_templates
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Pesanan
-- ---------------------------------------------------------------------------

create table if not exists public.shop_orders (
  id bigint generated always as identity primary key,
  order_code text not null unique,
  template_id bigint references public.shop_templates (id) on delete set null,   -- null = pesanan desain custom
  user_id uuid not null references auth.users (id) on delete cascade,
  buyer_email text not null,
  amount integer not null check (amount >= 0),                                    -- Rupiah
  status text not null default 'PENDING' check (status in ('PENDING', 'PAID', 'EXPIRED')),
  payment_method text not null default 'QRIS'
    check (payment_method in ('QRIS', 'VA_BCA', 'VA_MANDIRI', 'EWALLET_GOPAY', 'FREE_CLAIM')),
  payment_ref text,
  is_custom boolean not null default false,
  custom_summary text check (char_length(custom_summary) <= 2000),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists shop_orders_user_idx on public.shop_orders (user_id, created_at desc);
create index if not exists shop_orders_template_idx on public.shop_orders (template_id);

alter table public.shop_orders enable row level security;

drop policy if exists "pembeli melihat pesanannya" on public.shop_orders;
create policy "pembeli melihat pesanannya" on public.shop_orders
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "admin mengubah pesanan" on public.shop_orders;
create policy "admin mengubah pesanan" on public.shop_orders
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "admin menghapus pesanan" on public.shop_orders;
create policy "admin menghapus pesanan" on public.shop_orders
  for delete to authenticated using ((select public.is_admin()));
-- Tidak ada policy insert: pesanan hanya dibuat lewat fungsi shop_create_* di bawah.

-- Lunas → isi paid_at dan tambah hitungan unduhan template (berlaku juga saat admin menandai lunas)
create or replace function public.shop_orders_on_paid()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.status = 'PAID' and old.status is distinct from 'PAID' then
    new.paid_at := coalesce(new.paid_at, now());
  elsif tg_op = 'INSERT' and new.status = 'PAID' then
    new.paid_at := coalesce(new.paid_at, now());
  end if;

  if new.status = 'PAID' and new.template_id is not null
     and (tg_op = 'INSERT' or old.status is distinct from 'PAID') then
    update public.shop_templates set downloads_count = downloads_count + 1 where id = new.template_id;
  end if;
  return new;
end;
$$;

drop trigger if exists shop_orders_paid on public.shop_orders;
create trigger shop_orders_paid before insert or update of status on public.shop_orders
  for each row execute function public.shop_orders_on_paid();

-- Kode pesanan pendek yang mudah dibaca, mis. WYN-2026-8F3K2Q
create or replace function public.shop_new_order_code()
returns text
language sql
volatile
set search_path = ''
as $$
  select 'WYN-' || to_char(now(), 'YYYY') || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
$$;

-- Batas sederhana agar satu akun tidak membanjiri tabel pesanan
create or replace function public.shop_assert_order_quota()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.shop_orders
      where user_id = (select auth.uid()) and created_at > now() - interval '1 hour') >= 15 then
    raise exception 'Terlalu banyak pesanan dalam satu jam. Coba lagi nanti.' using errcode = 'P0001';
  end if;
end;
$$;

-- Beli template. Harga diambil dari database; template gratis langsung lunas.
create or replace function public.shop_create_order(
  p_template_id bigint,
  p_payment_method text default 'QRIS',
  p_custom boolean default false,
  p_custom_note text default null
)
returns public.shop_orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text;
  v_template public.shop_templates;
  v_amount integer;
  v_free boolean;
  v_order public.shop_orders;
begin
  if v_uid is null then
    raise exception 'Silakan masuk terlebih dahulu.' using errcode = '42501';
  end if;
  perform public.shop_assert_order_quota();

  select * into v_template from public.shop_templates where id = p_template_id and status = 'Terbit';
  if not found then
    raise exception 'Template tidak ditemukan atau belum dipublikasikan.' using errcode = 'P0002';
  end if;

  select email into v_email from auth.users where id = v_uid;
  v_amount := v_template.price + case when p_custom then 32000 else 0 end;   -- add-on kustomisasi Rp32.000
  v_free := v_amount = 0;

  insert into public.shop_orders (order_code, template_id, user_id, buyer_email, amount, status, payment_method, is_custom, custom_summary)
  values (
    public.shop_new_order_code(),
    v_template.id,
    v_uid,
    coalesce(v_email, ''),
    v_amount,
    case when v_free then 'PAID' else 'PENDING' end,
    case when v_free then 'FREE_CLAIM'
         when p_payment_method in ('QRIS', 'VA_BCA', 'VA_MANDIRI', 'EWALLET_GOPAY') then p_payment_method
         else 'QRIS' end,
    coalesce(p_custom, false),
    case when p_custom then left(coalesce(nullif(trim(p_custom_note), ''), 'Penyesuaian warna, brand & konten'), 2000) end
  )
  returning * into v_order;

  return v_order;
end;
$$;

-- Pesan desain custom (tanpa template). Nominal adalah estimasi paket yang dipilih pembeli.
create or replace function public.shop_create_custom_order(
  p_summary text,
  p_amount integer,
  p_payment_method text default 'QRIS'
)
returns public.shop_orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text;
  v_order public.shop_orders;
begin
  if v_uid is null then
    raise exception 'Silakan masuk terlebih dahulu.' using errcode = '42501';
  end if;
  if coalesce(trim(p_summary), '') = '' then
    raise exception 'Tuliskan kebutuhan desain custom Anda.' using errcode = 'P0001';
  end if;
  if p_amount is null or p_amount < 16000 or p_amount > 50000000 then
    raise exception 'Nominal pesanan tidak valid.' using errcode = 'P0001';
  end if;
  perform public.shop_assert_order_quota();

  select email into v_email from auth.users where id = v_uid;

  insert into public.shop_orders (order_code, template_id, user_id, buyer_email, amount, payment_method, is_custom, custom_summary)
  values (
    public.shop_new_order_code(), null, v_uid, coalesce(v_email, ''), p_amount,
    case when p_payment_method in ('QRIS', 'VA_BCA', 'VA_MANDIRI', 'EWALLET_GOPAY') then p_payment_method else 'QRIS' end,
    true, left(trim(p_summary), 2000)
  )
  returning * into v_order;

  return v_order;
end;
$$;

-- MODE DEMO: pembeli menandai pesanannya sendiri lunas lewat tombol "Saya sudah bayar".
-- Hapus fungsi ini (drop function public.shop_confirm_demo_payment) saat payment gateway sudah terpasang.
create or replace function public.shop_confirm_demo_payment(p_order_code text)
returns public.shop_orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.shop_orders;
begin
  update public.shop_orders
     set status = 'PAID'
   where order_code = p_order_code and user_id = (select auth.uid()) and status = 'PENDING'
  returning * into v_order;

  if not found then
    select * into v_order from public.shop_orders where order_code = p_order_code and user_id = (select auth.uid());
    if not found then
      raise exception 'Pesanan tidak ditemukan.' using errcode = 'P0002';
    end if;
  end if;
  return v_order;
end;
$$;

revoke execute on function public.shop_create_order(bigint, text, boolean, text) from public, anon;
revoke execute on function public.shop_create_custom_order(text, integer, text) from public, anon;
revoke execute on function public.shop_confirm_demo_payment(text) from public, anon;
revoke execute on function public.shop_assert_order_quota() from public, anon, authenticated;
grant execute on function public.shop_create_order(bigint, text, boolean, text) to authenticated;
grant execute on function public.shop_create_custom_order(text, integer, text) to authenticated;
grant execute on function public.shop_confirm_demo_payment(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: file zip template (private)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('shop-source-files', 'shop-source-files', false, 52428800,
        array['application/zip', 'application/x-zip-compressed', 'application/octet-stream'])
on conflict (id) do nothing;

drop policy if exists "admin mengelola file template" on storage.objects;
create policy "admin mengelola file template" on storage.objects
  for all to authenticated
  using (bucket_id = 'shop-source-files' and (select public.is_admin()))
  with check (bucket_id = 'shop-source-files' and (select public.is_admin()));

-- Pembeli boleh membuat link unduhan hanya untuk file template yang pesanannya sudah lunas
drop policy if exists "pembeli mengunduh template yang dibeli" on storage.objects;
create policy "pembeli mengunduh template yang dibeli" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'shop-source-files'
    and exists (
      select 1
      from public.shop_orders o
      join public.shop_templates t on t.id = o.template_id
      where o.user_id = (select auth.uid())
        and o.status = 'PAID'
        and t.storage_file_path = storage.objects.name
    )
  );

-- ---------------------------------------------------------------------------
-- Data awal: template yang sudah ada. Gambar memakai path di shop (/templates/...).
-- Harga dan status bisa diubah kapan saja dari panel admin → Shop → Template.
-- ---------------------------------------------------------------------------

insert into public.shop_templates
  (slug, title, summary, description, category, tech_stack, price, demo_url, thumbnail_url, screenshots, mobile_screenshots, features, version, file_size, storage_file_path, status)
values
(
  'serene-therapy-clinic-dashboard',
  'Serene Therapy Clinic Dashboard',
  'Dashboard tenang dan modern untuk psikolog & konselor: jadwal sesi, daftar klien, pesan, materi, dan tagihan.',
  'Dashboard untuk praktik psikolog, konselor, atau klinik kecil. Halaman utama merangkum saldo, pesan terbaru, permintaan sesi, dan agenda mingguan. Ada juga halaman jadwal, daftar pasien dengan pencarian, kotak pesan, materi untuk klien, dan tagihan. Warna pastel yang lembut, responsif sampai layar HP, dan semua data contoh ada di satu file sehingga mudah diganti dengan data kamu sendiri.',
  'Dashboard', array['Next.js', 'Tailwind'], 80000,
  'https://therapist.demo.wynnsea.my.id',
  '/templates/therapist-dashboard/card.jpg',
  array['/templates/therapist-dashboard/home.jpg', '/templates/therapist-dashboard/appointments.jpg', '/templates/therapist-dashboard/patients.jpg', '/templates/therapist-dashboard/messages.jpg'],
  array['/templates/therapist-dashboard/mobile-home.jpg', '/templates/therapist-dashboard/mobile-messages.jpg'],
  array['6 halaman siap pakai: Home, Jadwal, Pasien, Pesan, Materi, Tagihan', 'Status permintaan sesi bisa diubah langsung dari tabel', 'Agenda mingguan interaktif per hari', 'Kotak pesan dua kolom, bisa kirim pesan', 'Responsif: sidebar jadi menu geser di HP', 'Semua data contoh di satu file, mudah diganti'],
  'v1.0.0', '0.5 MB', 'therapist-dashboard/therapist-dashboard-v1.0.0.zip', 'Terbit'
),
(
  'nara-portfolio-landing-page',
  'Nara Portfolio Landing Page',
  'Landing page portofolio satu halaman untuk web developer dan desainer. Gratis, cukup HTML dan Tailwind CSS.',
  'Halaman portofolio yang bersih dan apa adanya: perkenalan dengan foto, layanan, tentang saya, karya, keahlian, ajakan kerja sama, dan kontak. Gayanya polos dengan bingkai garis dan tipografi tegas, jadi karyamu yang menonjol. Cukup buka index.html, tanpa framework dan tanpa proses build.',
  'Portfolio', array['HTML', 'Tailwind'], 0,
  'https://landing.demo.wynnsea.my.id',
  '/templates/free-landing/card.jpg',
  array['/templates/free-landing/home.jpg', '/templates/free-landing/services.jpg', '/templates/free-landing/portfolio.jpg'],
  array['/templates/free-landing/mobile-home.jpg'],
  array['8 bagian: hero, layanan, tentang saya, karya, keahlian, ajakan, kontak', 'Slider keahlian dengan tombol panah dan geser di HP', 'Menu HP siap pakai', 'Tanpa framework, cukup buka index.html', 'Warna dan font diatur di satu file', 'Gratis untuk proyek pribadi dan komersial'],
  'v1.0.0', '0.1 MB', 'free-landing/free-landing-v1.0.0.zip', 'Terbit'
),
(
  'harbor-sales-dashboard',
  'Harbor Sales Dashboard',
  'Dashboard penjualan toko online dengan mode gelap, grafik, dan tabel pesanan. Gratis, cukup HTML dan Tailwind CSS.',
  'Dashboard admin untuk toko online: kartu KPI, grafik penjualan 7 hari sampai 12 bulan, sumber pengunjung, pesanan terbaru dengan filter dan pencarian, serta produk terlaris. Ada mode gelap dan menu geser di HP. Grafiknya dibuat tanpa library tambahan, data contohnya ada di satu file JavaScript.',
  'Dashboard', array['HTML', 'Tailwind'], 0,
  'https://dashboard.demo.wynnsea.my.id',
  '/templates/free-dashboard/card.jpg',
  array['/templates/free-dashboard/home.jpg', '/templates/free-dashboard/dark.jpg', '/templates/free-dashboard/orders.jpg'],
  array['/templates/free-dashboard/mobile-home.jpg', '/templates/free-dashboard/mobile-menu.jpg'],
  array['Mode gelap yang diingat browser', 'Grafik penjualan 7 hari / 30 hari / 12 bulan tanpa library', 'Tabel pesanan dengan filter status dan pencarian', 'Kartu KPI, sumber pengunjung, dan produk terlaris', 'Sidebar jadi menu geser di HP', 'Gratis untuk proyek pribadi dan komersial'],
  'v1.0.0', '0.1 MB', 'free-dashboard/free-dashboard-v1.0.0.zip', 'Terbit'
),
(
  'axis-commercial-real-estate',
  'Axis Commercial Real Estate',
  'Landing page properti komersial bergaya monokrom: katalog kantor, gudang, lahan, dan ruko dengan form konsultasi.',
  'Landing page untuk agen atau pengembang properti komersial. Dibuka dengan foto gedung satu layar penuh, lalu profil perusahaan dengan angka pencapaian, logo mitra, katalog properti per kategori (kantor, gudang, lahan, ruko), alur kerja lima langkah, ulasan klien, dan form permintaan konsultasi dalam popup. Gayanya monokrom dan editorial, cukup HTML, Tailwind CSS, dan sedikit JavaScript.',
  'Landing Page', array['HTML', 'Tailwind'], 80000,
  'https://realestate.demo.wynnsea.my.id',
  '/templates/realestate-landing/card.jpg',
  array['/templates/realestate-landing/home.jpg', '/templates/realestate-landing/catalog.jpg', '/templates/realestate-landing/process.jpg'],
  array['/templates/realestate-landing/mobile-home.jpg'],
  array['8 bagian: hero, tentang, mitra, katalog, alur kerja, ulasan, kontak, footer', 'Katalog properti interaktif per kategori', 'Popup form permintaan konsultasi', 'Menu HP siap pakai', 'Tanpa framework, cukup buka index.html', 'Warna dan font diatur di satu file'],
  'v1.0.0', null, 'realestate-landing/realestate-landing-v1.0.0.zip', 'Terbit'
),
(
  'alder-group-company-profile',
  'Alder Group Company Profile',
  'Company profile editorial untuk perusahaan konstruksi atau konsultan: layanan, proyek, tim, dan kantor cabang.',
  'Template company profile dengan gaya editorial: ringkasan perusahaan dan angka pencapaian, tiga prinsip kerja, empat layanan utama, daftar proyek dengan filter sektor, tim pimpinan, kantor regional, dan form pertanyaan. Cukup HTML, Tailwind CSS, dan sedikit JavaScript.',
  'Landing Page', array['HTML', 'Tailwind'], 0,
  null, null, '{}', '{}',
  array['8 bagian: hero, tentang, layanan, proyek, tim, kantor, kontak, footer', 'Filter proyek per sektor', 'Menu HP siap pakai', 'Tanpa framework, cukup buka index.html'],
  'v1.0.0', null, 'free-company/free-company-v1.0.0.zip', 'Draft'
),
(
  'kova-modern-storefront',
  'Kova Modern Storefront',
  'Toko online minimalis dengan katalog produk, pencarian, filter kategori, dan keranjang belanja geser.',
  'Template toko online yang tenang dan minimalis: koleksi unggulan, keunggulan toko, katalog produk dengan filter kategori dan pencarian, bagian tentang toko, form newsletter, serta keranjang belanja yang muncul dari samping lengkap dengan jumlah barang dan target gratis ongkir. Cukup HTML, Tailwind CSS, dan JavaScript.',
  'E-Commerce', array['HTML', 'Tailwind'], 0,
  null, null, '{}', '{}',
  array['Katalog produk dengan filter kategori dan pencarian', 'Keranjang belanja geser dengan pengaturan jumlah', 'Penanda target gratis ongkir', 'Menu HP siap pakai', 'Tanpa framework, cukup buka index.html'],
  'v1.0.0', null, 'free-store/free-store-v1.0.0.zip', 'Draft'
)
on conflict (slug) do nothing;

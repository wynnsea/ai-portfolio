-- Skema awal portfolio WYNNSEA di Supabase.
-- Jalankan sekali di Supabase Dashboard → SQL Editor, lalu jalankan supabase/seed.sql.
--
-- Prinsip keamanan:
-- - Kunci publishable ada di browser, jadi SEMUA pembatasan akses dilakukan oleh Row Level Security.
-- - Pengunjung (anon) hanya bisa membaca konten yang terbit dan mencatat kunjungan.
-- - Tulis/ubah/hapus hanya untuk user yang terdaftar di tabel public.admins.

-- ---------------------------------------------------------------------------
-- Admin
-- ---------------------------------------------------------------------------

create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

create policy "admin melihat datanya sendiri" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

-- security definer: boleh membaca public.admins walaupun RLS-nya ketat.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Konten
-- ---------------------------------------------------------------------------

create table public.projects (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null,
  title_jp text not null default '',
  kanji text not null default '作',
  tone text not null default 'dark' check (tone in ('dark', 'mid', 'light')),
  category text not null default '',
  year text not null default '',
  role text not null default '',
  duration text not null default '',
  summary text not null default '',
  overview text not null default '',
  challenge text not null default '',
  approach jsonb not null default '[]'::jsonb,
  results jsonb not null default '[]'::jsonb,
  stack text[] not null default '{}',
  links jsonb not null default '{}'::jsonb,
  cover_url text,
  status text not null default 'Draft' check (status in ('Draft', 'Terbit', 'Arsip')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.certifications (
  id bigint generated always as identity primary key,
  title text not null,
  title_jp text not null default '',
  kanji text not null default '証',
  tone text not null default 'dark' check (tone in ('dark', 'mid', 'light')),
  category text not null default '',
  issuer text not null default '',
  year text,
  score text,
  note text,
  credential_url text,
  cover_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activities (
  id bigint generated always as identity primary key,
  title text not null,
  role text not null default '',
  organizer text not null default '',
  year text,
  description text not null default '',
  title_jp text not null default '',
  kanji text not null default '動',
  tone text not null default 'dark' check (tone in ('dark', 'mid', 'light')),
  category text not null default '',
  photos text[] not null default '{}',
  focus text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.posts (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null,
  title_jp text not null default '',
  kanji text not null default '書',
  tone text not null default 'dark' check (tone in ('dark', 'mid', 'light')),
  category text not null default '',
  date date not null default current_date,
  read_time text not null default '1 menit baca',
  excerpt text not null default '',
  content jsonb not null default '[]'::jsonb,
  cover_url text,
  status text not null default 'Draft' check (status in ('Draft', 'Terbit', 'Arsip')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.messages (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 200),
  subject text not null default '' check (char_length(subject) <= 200),
  message text not null check (char_length(message) between 1 and 5000),
  status text not null default 'Baru' check (status in ('Baru', 'Dibaca', 'Dibalas')),
  created_at timestamptz not null default now()
);

-- Hanya satu baris (id = 1).
create table public.settings (
  id smallint primary key default 1 check (id = 1),
  brand text not null default '',
  name text not null default '',
  name_jp text,
  role text not null default '',
  description text not null default '',
  location text not null default '',
  email text not null default '',
  photo_url text,
  cv_url text,
  availability jsonb not null default '{"open": false, "label": null, "detail": null}'::jsonb,
  socials jsonb not null default '[]'::jsonb,
  features jsonb not null default '{"chatbot": true, "preloader": true}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.page_views (
  id bigint generated always as identity primary key,
  path text not null check (char_length(path) between 1 and 200),
  created_at timestamptz not null default now()
);

create index page_views_created_at_idx on public.page_views (created_at);

create trigger projects_updated_at before update on public.projects for each row execute function public.set_updated_at();
create trigger certifications_updated_at before update on public.certifications for each row execute function public.set_updated_at();
create trigger activities_updated_at before update on public.activities for each row execute function public.set_updated_at();
create trigger posts_updated_at before update on public.posts for each row execute function public.set_updated_at();
create trigger settings_updated_at before update on public.settings for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.projects enable row level security;
alter table public.certifications enable row level security;
alter table public.activities enable row level security;
alter table public.posts enable row level security;
alter table public.messages enable row level security;
alter table public.settings enable row level security;
alter table public.page_views enable row level security;

-- Proyek & artikel: publik hanya melihat yang berstatus Terbit
create policy "publik membaca proyek terbit" on public.projects
  for select to anon, authenticated using (status = 'Terbit');
create policy "admin mengelola proyek" on public.projects
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "publik membaca artikel terbit" on public.posts
  for select to anon, authenticated using (status = 'Terbit');
create policy "admin mengelola artikel" on public.posts
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Sertifikasi, kegiatan, pengaturan: semuanya publik
create policy "publik membaca sertifikasi" on public.certifications
  for select to anon, authenticated using (true);
create policy "admin mengelola sertifikasi" on public.certifications
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "publik membaca kegiatan" on public.activities
  for select to anon, authenticated using (true);
create policy "admin mengelola kegiatan" on public.activities
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "publik membaca pengaturan" on public.settings
  for select to anon, authenticated using (true);
create policy "admin mengelola pengaturan" on public.settings
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Pesan: hanya admin (form kontak publik belum ada)
create policy "admin mengelola pesan" on public.messages
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Kunjungan: siapa pun boleh mencatat, hanya admin yang boleh membaca
create policy "publik mencatat kunjungan" on public.page_views
  for insert to anon, authenticated with check (true);
create policy "admin membaca kunjungan" on public.page_views
  for select to authenticated using ((select public.is_admin()));

-- Jumlah kunjungan per hari (zona waktu WIB). security invoker: tetap tunduk pada RLS di atas.
create or replace function public.daily_visits(since date)
returns table (day date, visits bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select (created_at at time zone 'Asia/Jakarta')::date as day, count(*) as visits
  from public.page_views
  where created_at >= (since::timestamp at time zone 'Asia/Jakarta')
  group by 1
  order by 1;
$$;

grant execute on function public.daily_visits(date) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: foto profil, CV, cover (dibaca publik, diunggah admin)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'])
on conflict (id) do nothing;

create policy "admin mengunggah media" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and (select public.is_admin()));
create policy "admin mengubah media" on storage.objects
  for update to authenticated using (bucket_id = 'media' and (select public.is_admin()));
create policy "admin menghapus media" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and (select public.is_admin()));

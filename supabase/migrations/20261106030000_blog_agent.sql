-- Migration: Agen Blog AI.
-- - blog_agent_settings: pengaturan jadwal (satu baris saja).
-- - blog_ideas: antrian ide/catatan mentah yang diolah agen jadi draft.
-- - posts: kolom SEO + penanda artikel buatan AI dan riwayat revisinya.
-- Jalankan di Supabase Dashboard → SQL Editor.

create table if not exists public.blog_agent_settings (
  id integer primary key default 1 check (id = 1),
  enabled boolean not null default false,
  interval_days integer not null default 7 check (interval_days between 1 and 60),
  default_category text not null default 'Catatan Teknis',
  tone text not null default 'Santai tapi informatif, seperti engineer yang cerita pengalaman ke sesama developer. Pakai "saya".',
  target_words integer not null default 900 check (target_words between 300 and 2500),
  last_run_at timestamptz,
  last_status text,
  last_error text,
  running_since timestamptz,          -- penanda agar dua proses tidak jalan bersamaan
  updated_at timestamptz not null default now()
);

insert into public.blog_agent_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.blog_ideas (
  id bigint generated always as identity primary key,
  title text not null check (char_length(title) between 3 and 200),
  notes text not null default '' check (char_length(notes) <= 5000),
  status text not null default 'Antri' check (status in ('Antri', 'Dipakai', 'Dilewati')),
  post_id bigint references public.posts (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists blog_ideas_status_idx on public.blog_ideas (status, created_at);

alter table public.posts
  add column if not exists seo_title text,
  add column if not exists meta_description text,
  add column if not exists keywords text[] not null default '{}',
  add column if not exists ai_generated boolean not null default false,
  add column if not exists ai_notes text[] not null default '{}',
  add column if not exists ai_revisions jsonb not null default '[]'::jsonb,
  add column if not exists idea_id bigint references public.blog_ideas (id) on delete set null;

create trigger blog_agent_settings_updated_at before update on public.blog_agent_settings
  for each row execute function public.set_updated_at();

-- Hanya admin yang boleh membaca/mengubah; cron memakai service role (melewati RLS).
alter table public.blog_agent_settings enable row level security;
alter table public.blog_ideas enable row level security;

create policy "admin mengelola pengaturan agen blog" on public.blog_agent_settings
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin mengelola ide blog" on public.blog_ideas
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

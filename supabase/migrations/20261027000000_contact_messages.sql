-- Migration: Izinkan pengunjung website publik mengirim pesan ke tabel messages
-- Jalankan di Supabase Dashboard → SQL Editor

-- 1. Berikan policy insert untuk anon dan authenticated dengan status default 'Baru'
create policy "publik mengirim pesan" on public.messages
  for insert to anon, authenticated with check (status = 'Baru');

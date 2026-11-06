-- Migration: pencatatan kunjungan hanya lewat server (/api/visit, service role + rate limit).
-- Sebelumnya anon boleh insert ke page_views tanpa batas, sehingga siapa pun yang memegang
-- publishable key bisa membanjiri tabel dan merusak grafik dashboard.
-- Jalankan di Supabase Dashboard → SQL Editor setelah SUPABASE_SERVICE_ROLE_KEY terpasang di server.

drop policy if exists "publik mencatat kunjungan" on public.page_views;

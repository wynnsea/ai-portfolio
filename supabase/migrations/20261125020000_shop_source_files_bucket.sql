-- Perbaikan bucket file zip template shop.
-- Jalankan di Supabase Dashboard → SQL Editor. Aman dijalankan ulang.
--
-- - Pastikan bucket private "shop-source-files" ada.
-- - Terima semua variasi tipe file zip dari browser (application/x-zip, multipart/x-zip, dll.).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shop-source-files', 'shop-source-files', false, 52428800,
  array['application/zip', 'application/x-zip-compressed', 'application/x-zip', 'multipart/x-zip', 'application/octet-stream']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = excluded.allowed_mime_types;

-- Cek hasil: harus ada 1 baris, public = false
select id, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'shop-source-files';

-- Cek policy upload admin: harus ada "admin mengelola file template" dan "pembeli mengunduh template yang dibeli"
select policyname, cmd from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname in ('admin mengelola file template', 'pembeli mengunduh template yang dibeli');

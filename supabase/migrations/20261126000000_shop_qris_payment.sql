-- Migration: Pembayaran QRIS otomatis via payment gateway (Midtrans) untuk Wynnsea Shop.
-- Jalankan di Supabase Dashboard -> SQL Editor.
--
-- Perubahan:
-- 1. Tambah kolom payment_provider, qr_string, dan expires_at di public.shop_orders.
-- 2. Tambah index untuk pencarian cepat QR aktif per pembeli per template.
-- 3. Hapus fungsi demo shop_confirm_demo_payment agar pembeli tidak bisa menandai lunas sendiri.
--    Pembaruan status PAID / EXPIRED dilakukan oleh server via service role (melewati RLS).
--    Trigger public.shop_orders_paid (shop_orders_on_paid) tetap aktif untuk mengisi paid_at
--    dan menambah downloads_count saat status berubah menjadi PAID.

alter table public.shop_orders
  add column if not exists payment_provider text,
  add column if not exists qr_string text,
  add column if not exists expires_at timestamptz;

create index if not exists shop_orders_active_qris_idx
  on public.shop_orders (user_id, template_id, status, expires_at desc)
  where status = 'PENDING';

-- Hapus mode demo: pembayaran hanya boleh dikonfirmasi melalui webhook terverifikasi di server.
drop function if exists public.shop_confirm_demo_payment(text);

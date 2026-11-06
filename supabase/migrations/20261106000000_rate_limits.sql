-- Migration: rate limit bersama untuk API route (form kontak & fitur AI).
-- Disimpan di database supaya tetap berlaku di hosting serverless, di mana memori dan
-- filesystem tiap instance tidak saling berbagi dan tidak bertahan.
-- Jalankan di Supabase Dashboard → SQL Editor.

create table if not exists public.rate_limits (
  key text primary key,
  count integer not null,
  window_start timestamptz not null
);

-- RLS aktif tanpa policy: anon & authenticated tidak bisa membaca/menulis tabel ini.
alter table public.rate_limits enable row level security;

-- Fixed window atomik: menaikkan hitungan untuk `p_key` dan mengembalikan apakah masih diizinkan.
create or replace function public.hit_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns table (allowed boolean, retry_after integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_window interval := make_interval(secs => p_window_seconds);
  v_count integer;
  v_start timestamptz;
begin
  insert into public.rate_limits as r (key, count, window_start)
  values (p_key, 1, v_now)
  on conflict (key) do update set
    count = case when r.window_start <= v_now - v_window then 1 else r.count + 1 end,
    window_start = case when r.window_start <= v_now - v_window then v_now else r.window_start end
  returning r.count, r.window_start into v_count, v_start;

  -- Bersihkan baris kedaluwarsa sesekali supaya tabel tidak terus membesar
  if random() < 0.01 then
    delete from public.rate_limits where window_start < v_now - interval '2 days';
  end if;

  allowed := v_count <= p_limit;
  retry_after := greatest(0, ceil(extract(epoch from (v_start + v_window - v_now)))::integer);
  return next;
end;
$$;

-- Hanya server (service role) yang boleh memanggil. Kalau anon bisa memanggil,
-- siapa pun bisa menghabiskan kuota milik IP/email orang lain.
revoke all on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;

-- Migration: penyimpanan embedding RAG (pgvector).
-- Setiap potongan (chunk) konten portfolio disimpan bersama embedding-nya, supaya server tidak perlu
-- meng-embed ulang semua konten ke Gemini setiap cold start. Diisi otomatis oleh lib/ai/embedding-store.ts.
-- Jalankan di Supabase Dashboard → SQL Editor.

create extension if not exists vector with schema extensions;

create table if not exists public.rag_chunks (
  id text primary key,                 -- mis. "post-belajar-rag#2"
  parent_id text not null,             -- id dokumen asal, mis. "post-belajar-rag"
  content_hash text not null,          -- sha256(model + isi), penanda perlu embed ulang atau tidak
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  model text not null,                 -- mis. "gemini-embedding-001@768"
  embedding extensions.vector(768) not null,
  updated_at timestamptz not null default now()
);

create index if not exists rag_chunks_parent_idx on public.rag_chunks (parent_id);
-- Index HNSW untuk pencarian kemiripan cosine di database (berguna kalau korpus makin besar)
create index if not exists rag_chunks_embedding_idx on public.rag_chunks
  using hnsw (embedding extensions.vector_cosine_ops);

-- RLS aktif tanpa policy: hanya server (service role) yang bisa membaca/menulis.
alter table public.rag_chunks enable row level security;

-- Pencarian kemiripan langsung di Postgres. Belum dipakai website (korpus masih kecil, jadi
-- pencarian hybrid di memori lebih cepat), tapi siap dipakai kalau jumlah konten bertambah banyak.
create or replace function public.match_rag_chunks(query_embedding extensions.vector(768), match_count integer default 6)
returns table (id text, parent_id text, content text, metadata jsonb, similarity double precision)
language sql
stable
set search_path = ''
as $$
  select c.id, c.parent_id, c.content, c.metadata,
         1 - (c.embedding operator(extensions.<=>) query_embedding) as similarity
  from public.rag_chunks c
  order by c.embedding operator(extensions.<=>) query_embedding
  limit match_count;
$$;

revoke all on function public.match_rag_chunks(extensions.vector, integer) from public, anon, authenticated;
grant execute on function public.match_rag_chunks(extensions.vector, integer) to service_role;

-- ============================================================
-- Pyne Awards Africa 2026 — Biblioteca (documentos PDF com capa)
-- Correr no SQL Editor do projecto Supabase do SITE (uma vez).
-- ============================================================

create table if not exists public.documents (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  title       text not null check (char_length(title) between 1 and 200),
  file_path   text not null,               -- PDF no bucket 'biblioteca'
  cover_path  text,                        -- capa (1.ª página do PDF ou imagem escolhida)
  pages       int,
  bytes       bigint,
  hidden      boolean not null default false
);

alter table public.documents enable row level security;

create policy "documents_public_read" on public.documents
  for select using (hidden = false or auth.role() = 'authenticated');
create policy "documents_admin_insert" on public.documents
  for insert to authenticated with check (true);
create policy "documents_admin_update" on public.documents
  for update to authenticated using (true);
create policy "documents_admin_delete" on public.documents
  for delete to authenticated using (true);

-- ---------- STORAGE ----------
-- Público para leitura; até 200 MB por ficheiro (acima de 50 MB exige o plano Pro do Supabase)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('biblioteca', 'biblioteca', true, 209715200, array['application/pdf', 'image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "biblioteca_public_read" on storage.objects
  for select using (bucket_id = 'biblioteca');
create policy "biblioteca_admin_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'biblioteca');
create policy "biblioteca_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'biblioteca');
create policy "biblioteca_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'biblioteca');

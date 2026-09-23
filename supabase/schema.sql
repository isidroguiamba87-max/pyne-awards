-- ============================================================
-- Pyne Awards Africa 2026 — mini-site do evento
-- Colar no Supabase > SQL Editor e executar uma vez.
-- ============================================================

-- ---------- GALERIA ----------
create table if not exists public.photos (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  day         smallint check (day between 1 and 3),
  event_id    text,                      -- ex.: 'gala', 'elevate-breakfast' (ver data/programa.json)
  path        text not null,             -- caminho no bucket (imagem grande, ~1600px)
  thumb_path  text not null,             -- caminho no bucket (miniatura, ~480px)
  caption     text,
  width       int,
  height      int,
  hidden      boolean not null default false
);

alter table public.photos enable row level security;

-- Público vê fotos não escondidas
create policy "photos_public_read" on public.photos
  for select using (hidden = false or auth.role() = 'authenticated');

-- Só a equipa (utilizador autenticado) insere/edita/apaga
create policy "photos_admin_insert" on public.photos
  for insert to authenticated with check (true);
create policy "photos_admin_update" on public.photos
  for update to authenticated using (true);
create policy "photos_admin_delete" on public.photos
  for delete to authenticated using (true);

-- ---------- PERGUNTAS (Q&A) ----------
create table if not exists public.questions (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  event_id    text,                      -- sessão a que se dirige (opcional)
  author_name text check (char_length(author_name) <= 60),
  body        text not null check (char_length(body) between 3 and 400),
  lang        text default 'pt',
  status      text not null default 'pending'
              check (status in ('pending','approved','answered','rejected')),
  votes       int not null default 0,
  pinned      boolean not null default false
);

alter table public.questions enable row level security;

-- Qualquer pessoa pode enviar pergunta, mas entra sempre como 'pending' com 0 votos
create policy "questions_public_insert" on public.questions
  for insert to anon, authenticated
  with check (status = 'pending' and votes = 0 and pinned = false);

-- Público só vê aprovadas/respondidas; moderador vê tudo
create policy "questions_public_read" on public.questions
  for select using (status in ('approved','answered') or auth.role() = 'authenticated');

-- Só moderador altera/apaga
create policy "questions_admin_update" on public.questions
  for update to authenticated using (true);
create policy "questions_admin_delete" on public.questions
  for delete to authenticated using (true);

-- Votar sem dar permissão de UPDATE ao público
create or replace function public.upvote_question(q_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.questions set votes = votes + 1
  where id = q_id and status = 'approved';
$$;
grant execute on function public.upvote_question(uuid) to anon, authenticated;

-- ---------- REALTIME ----------
alter publication supabase_realtime add table public.photos;
alter publication supabase_realtime add table public.questions;

-- ---------- STORAGE ----------
-- Bucket público 'galeria' (leitura pública, escrita só autenticado)
insert into storage.buckets (id, name, public)
values ('galeria', 'galeria', true)
on conflict (id) do nothing;

create policy "galeria_public_read" on storage.objects
  for select using (bucket_id = 'galeria');
create policy "galeria_admin_write" on storage.objects
  for insert to authenticated with check (bucket_id = 'galeria');
create policy "galeria_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'galeria');

-- Depois: Authentication > Users > "Add user" para criar a conta da equipa
-- (email + password). É com essa conta que se entra em /admin.

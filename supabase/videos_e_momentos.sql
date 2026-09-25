-- ============================================================
-- Pyne Awards Africa 2026 — Vídeos do YouTube + hora das fotos
-- Correr no SQL Editor do projecto Supabase do SITE (uma vez).
-- (O projecto do álbum tem o seu próprio ficheiro: pyne-album/supabase/videos.sql)
-- ============================================================

-- ---------- VÍDEOS ----------
create table if not exists public.videos (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  youtube_id  text not null unique check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  title       text not null check (char_length(title) between 1 and 140),
  event_id    text,                       -- sessão do programa (opcional)
  hidden      boolean not null default false
);

alter table public.videos enable row level security;

create policy "videos_public_read" on public.videos
  for select using (hidden = false or auth.role() = 'authenticated');
create policy "videos_admin_insert" on public.videos
  for insert to authenticated with check (true);
create policy "videos_admin_update" on public.videos
  for update to authenticated using (true);
create policy "videos_admin_delete" on public.videos
  for delete to authenticated using (true);

-- ---------- HORA DAS FOTOS (para organizar a galeria por momento da agenda) ----------
-- Fotos novas guardam a hora da câmara (EXIF). As antigas usam a hora do upload.
alter table public.photos add column if not exists taken_at timestamptz;

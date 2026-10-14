-- ============================================================
-- MIGRAÇÃO: site de um evento -> site multi-evento
-- Pyne Awards Africa 2026  +  Citizen Connect Africa 2026
-- Projecto Supabase do SITE. Correr por PASSOS, pela ordem.
--
-- ORDEM:  0 → 1 → 2 → 2b → [deploy do código novo] → 3 → 4
-- (antes do deploy o default 'pyne-awards-2026' mantém o site antigo a funcionar)
-- ⚠️ NÃO correr o ficheiro inteiro de uma vez: seleccionar só o PASSO a correr.
--    Os PASSOS 3 e 4 só DEPOIS do deploy.
-- ============================================================


-- ===== PASSO 0 — DIAGNÓSTICO (só leitura) =====
select (created_at at time zone 'Africa/Maputo')::date as dia, count(*) fotos,
       count(*) filter (where hidden) escondidas
from public.photos group by 1 order by 1;

select (created_at at time zone 'Africa/Maputo')::date as dia, status, count(*)
from public.questions group by 1, 2 order by 1, 2;

select split_part(path, '/', 1) as pasta, count(*) from public.photos group by 1 order by 1;


-- ===== PASSO 1 — TABELA DE EVENTOS =====  (corrido em 14/10)
create table if not exists public.events (
  slug        text primary key,
  name        text not null,
  start_date  date not null,
  end_date    date not null,
  sort_order  int  not null default 0,
  active      boolean not null default true
);
alter table public.events enable row level security;
drop policy if exists "events_public_read" on public.events;
drop policy if exists "events_admin_write" on public.events;
create policy "events_public_read" on public.events for select using (true);
create policy "events_admin_write" on public.events for all to authenticated using (true) with check (true);
insert into public.events (slug, name, start_date, end_date, sort_order) values
  ('pyne-awards-2026',     'The Pyne Awards Africa 2026',         '2026-09-24', '2026-09-26', 1),
  ('citizen-connect-2026', 'Citizen Connect Africa – Moçambique', '2026-10-14', '2026-10-14', 2)
on conflict (slug) do nothing;


-- ===== PASSO 2 — event_slug em fotos e perguntas + Realtime =====  (corrido em 14/10)
alter table public.photos    add column if not exists event_slug text not null default 'pyne-awards-2026' references public.events(slug);
alter table public.questions add column if not exists event_slug text not null default 'pyne-awards-2026' references public.events(slug);
create index if not exists photos_event_created_idx    on public.photos    (event_slug, created_at desc);
create index if not exists questions_event_created_idx on public.questions (event_slug, created_at desc);
-- filtrar subscrições por event_slug e receber o registo antigo em UPDATE/DELETE
alter table public.photos    replica identity full;
alter table public.questions replica identity full;


-- ===== PASSO 2b — event_slug em vídeos e documentos (relatório) =====
-- Os existentes ficam no Pyne. CORRER ANTES DO DEPLOY.
alter table public.videos    add column if not exists event_slug text not null default 'pyne-awards-2026' references public.events(slug);
alter table public.documents add column if not exists event_slug text not null default 'pyne-awards-2026' references public.events(slug);


-- >>>>>>>>>>>>  DEPLOY DO CÓDIGO NOVO  <<<<<<<<<<<<


-- ===== PASSO 3 — MOVER PARA O CITIZEN CONNECT O QUE FOI PUBLICADO HOJE (14/10, Maputo) =====
-- Apanha também o que foi carregado no site antigo até ao deploy (ficou no Pyne pelo default).
begin;
update public.photos
   set event_slug = 'citizen-connect-2026', event_id = null, day = 1
 where event_slug = 'pyne-awards-2026'
   and created_at >= timestamptz '2026-10-14 00:00:00+02'
   and created_at <  timestamptz '2026-10-15 00:00:00+02';
update public.questions
   set event_slug = 'citizen-connect-2026', event_id = null, pinned = false
 where event_slug = 'pyne-awards-2026'
   and created_at >= timestamptz '2026-10-14 00:00:00+02'
   and created_at <  timestamptz '2026-10-15 00:00:00+02';
select 'photos' t, event_slug, count(*) from public.photos group by 2
union all
select 'questions', event_slug, count(*) from public.questions group by 2;
commit;  -- ou rollback; se os números não baterem com o PASSO 0


-- ===== PASSO 4 — SEM DEFAULT + RLS DAS PERGUNTAS =====
-- A partir daqui o site tem SEMPRE de indicar o evento.
alter table public.photos    alter column event_slug drop default;
alter table public.questions alter column event_slug drop default;
alter table public.videos    alter column event_slug drop default;
alter table public.documents alter column event_slug drop default;

-- o público só pode enviar perguntas para um evento que exista (e esteja activo)
drop policy if exists "questions_public_insert" on public.questions;
create policy "questions_public_insert" on public.questions
  for insert to anon, authenticated
  with check (
    status = 'pending' and votes = 0 and pinned = false
    and event_slug in (select slug from public.events where active)
  );


-- NOTA SOBRE O STORAGE
-- Os ficheiros já carregados NÃO são movidos (o caminho está guardado na tabela).
-- Novos uploads: galeria/{event_slug}/dia-{n}/{uuid}.webp  e  .../dia-{n}/thumbs/{uuid}.webp

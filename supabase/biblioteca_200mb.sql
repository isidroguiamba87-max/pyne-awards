-- ============================================================
-- Biblioteca: subir o limite por ficheiro para 200 MB
-- Correr no SQL Editor do projecto Supabase do SITE.
--
-- ATENÇÃO: isto só tem efeito se o limite GLOBAL do projecto também for >= 200 MB:
--   Supabase → Project Settings → Storage → "Upload file size limit" → 200 MB
-- No plano gratuito o limite global está fixo em 50 MB; para mais é preciso o plano Pro.
-- ============================================================

update storage.buckets
   set file_size_limit = 209715200  -- 200 MB
 where id = 'biblioteca';

-- confirmar
select id, file_size_limit / 1024 / 1024 as limite_mb from storage.buckets where id = 'biblioteca';

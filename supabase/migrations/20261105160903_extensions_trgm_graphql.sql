-- Phase 2, tache 4 : extensions hors de public, GraphQL retire, index de recherche sur le titre.
-- Leve les advisors WARN extension_in_public (pg_trgm) et 0026/0027 (tables exposees via GraphQL).
-- Idempotent.

-- 1. pg_trgm dans le schema extensions (aucune fonction ni index de public ne s'appuie dessus)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension
    WHERE extname = 'pg_trgm' AND extnamespace = 'public'::regnamespace
  ) THEN
    ALTER EXTENSION pg_trgm SET SCHEMA extensions;
  END IF;
END
$$;

-- 2. GraphQL : jamais appele par le front ni le back (verifie le 2026-11-04)
DROP EXTENSION IF EXISTS pg_graphql;

-- 3. Recherche du back (`ilike '%q%'` sur furniture.title) servie par un index trigram
CREATE INDEX IF NOT EXISTS furniture_title_trgm_idx
  ON public.furniture USING gin (title extensions.gin_trgm_ops);

NOTIFY pgrst, 'reload schema';

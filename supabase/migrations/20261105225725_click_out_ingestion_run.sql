-- Phase 2, tache 8 (spec 6.7) : clics vers les marchands et executions d'ingestion.
-- Tables internes : RLS active SANS politique, aucun droit pour anon/authenticated ;
-- seul le back (service role) lit et ecrit. Idempotent.

-- 1. Clics sortants : ni IP ni user-agent ; retention 13 mois (purge en phase 3)
CREATE TABLE IF NOT EXISTS public.click_out (
  click_out_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  offer_id uuid NOT NULL REFERENCES public.offer (offer_id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  clicked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS click_out_offer_clicked_idx ON public.click_out (offer_id, clicked_at);
CREATE INDEX IF NOT EXISTS click_out_user_id_idx ON public.click_out (user_id);

COMMENT ON TABLE public.click_out IS 'Clic vers une offre marchande ; user_id NULL si anonyme ou compte supprime';

-- 2. Executions d'ingestion
DO $$
BEGIN
  CREATE TYPE public.ingestion_status AS ENUM ('running', 'succeeded', 'failed', 'partial');
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS public.ingestion_run (
  ingestion_run_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  partner_id uuid NOT NULL REFERENCES public.partner (partner_id),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status public.ingestion_status NOT NULL DEFAULT 'running',
  seen_count integer NOT NULL DEFAULT 0,
  created_count integer NOT NULL DEFAULT 0,
  updated_count integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  errors jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS ingestion_run_partner_started_idx
  ON public.ingestion_run (partner_id, started_at DESC);

COMMENT ON TABLE public.ingestion_run IS 'Une execution d''import du catalogue d''un partenaire, avec ses compteurs';

-- 3. Acces : back uniquement
ALTER TABLE public.click_out ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_run ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.click_out FROM anon, authenticated;
REVOKE ALL ON public.ingestion_run FROM anon, authenticated;

NOTIFY pgrst, 'reload schema';

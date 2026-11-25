-- Phase 3, tache 1 (spec 6.2) : produits et variantes, adaptateurs de collecte,
-- file de rapprochement, categories du catalogue maison. Additif sauf partner.api_key_hash.
-- Idempotent.

-- 1. Produit : regroupe les variantes (furniture) d'un meme article
CREATE TABLE IF NOT EXISTS public.product (
  product_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text,
  title text NOT NULL,
  description text,
  designer text,
  cover_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_title_trgm_idx
  ON public.product USING gin (title extensions.gin_trgm_ops);

COMMENT ON TABLE public.product IS 'Article commun a plusieurs variantes (couleur, taille) ; chaque variante est un furniture';

ALTER TABLE public.product ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS catalog_read ON public.product;
CREATE POLICY catalog_read ON public.product FOR SELECT TO anon, authenticated USING (true);
REVOKE ALL ON public.product FROM anon, authenticated;
GRANT SELECT ON public.product TO anon, authenticated;

-- 2. Variante : furniture rattache a son produit
ALTER TABLE public.furniture
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.product (product_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS variant_label text;

CREATE INDEX IF NOT EXISTS furniture_product_id_idx ON public.furniture (product_id);

-- 3. Partenaire : adaptateur de collecte ; la cle d'API (jamais utilisee) disparait
ALTER TABLE public.partner
  ADD COLUMN IF NOT EXISTS adapter text,
  ADD COLUMN IF NOT EXISTS adapter_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  DROP COLUMN IF EXISTS api_key_hash;

ALTER TABLE public.partner DROP CONSTRAINT IF EXISTS partner_adapter_check;
ALTER TABLE public.partner ADD CONSTRAINT partner_adapter_check
  CHECK (adapter IN ('shopify', 'nordicnest'));

-- 4. Fiches marchandes : internes au back
DROP POLICY IF EXISTS catalog_read ON public.partner_product;
REVOKE ALL ON public.partner_product FROM anon, authenticated;

-- 5. File de rapprochement (fiche marchande -> variante), decidee par un admin
DO $$
BEGIN
  CREATE TYPE public.match_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS public.match_candidate (
  match_candidate_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  partner_product_id uuid NOT NULL REFERENCES public.partner_product (partner_product_id) ON DELETE CASCADE,
  furniture_id uuid NOT NULL REFERENCES public.furniture (furniture_id) ON DELETE CASCADE,
  score numeric(4, 3) NOT NULL,
  reason text,
  status public.match_status NOT NULL DEFAULT 'pending',
  decided_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_product_id, furniture_id)
);

CREATE INDEX IF NOT EXISTS match_candidate_furniture_id_idx ON public.match_candidate (furniture_id);
CREATE INDEX IF NOT EXISTS match_candidate_decided_by_idx ON public.match_candidate (decided_by);

COMMENT ON TABLE public.match_candidate IS 'Rapprochement propose entre une fiche marchande et une variante, en attente de decision admin';

ALTER TABLE public.match_candidate ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.match_candidate FROM anon, authenticated;

-- 6. Categories racines du catalogue maison (ajoutees si absentes)
INSERT INTO public.category (label, parent_id)
SELECT label, NULL
FROM (VALUES
  ('Salon'), ('Chambre'), ('Bureau'), ('Cuisine et salle a manger'), ('Salle de bain'),
  ('Jardin et exterieur'), ('Luminaires'), ('Decoration'), ('Rangement'), ('Enfant'), ('Autres')
) AS roots (label)
WHERE NOT EXISTS (SELECT 1 FROM public.category c WHERE c.label = roots.label);

NOTIFY pgrst, 'reload schema';

-- Phase 2, tache 7 (spec 6.4, 6.5) : identifiants et attributs du meuble, partenaire affilie,
-- index des cles etrangeres signalees par l'advisor performance.
-- Idempotent.

-- 1. Meuble : identification du produit exact (nullables, NULL = inconnu)
ALTER TABLE public.furniture
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS gtin text,
  ADD COLUMN IF NOT EXISTS manufacturer_ref text,
  ADD COLUMN IF NOT EXISTS weight_kg numeric,
  ADD COLUMN IF NOT EXISTS attributes jsonb NOT NULL DEFAULT '{}'::jsonb;

-- GTIN-8, UPC-12, EAN-13 ou GTIN-14
ALTER TABLE public.furniture DROP CONSTRAINT IF EXISTS furniture_gtin_check;
ALTER TABLE public.furniture ADD CONSTRAINT furniture_gtin_check
  CHECK (gtin ~ '^([0-9]{8}|[0-9]{12,14})$');
ALTER TABLE public.furniture DROP CONSTRAINT IF EXISTS furniture_weight_kg_check;
ALTER TABLE public.furniture ADD CONSTRAINT furniture_weight_kg_check CHECK (weight_kg > 0);
ALTER TABLE public.furniture DROP CONSTRAINT IF EXISTS furniture_attributes_check;
ALTER TABLE public.furniture ADD CONSTRAINT furniture_attributes_check
  CHECK (jsonb_typeof(attributes) = 'object');

-- Dimensions strictement positives quand renseignees (0 valeur <= 0 en prod, verifie le 2026-11-05)
ALTER TABLE public.furniture DROP CONSTRAINT IF EXISTS furniture_dimensions_check;
ALTER TABLE public.furniture ADD CONSTRAINT furniture_dimensions_check
  CHECK (size_width > 0 AND size_height > 0 AND size_depth > 0);

CREATE UNIQUE INDEX IF NOT EXISTS furniture_gtin_key
  ON public.furniture (gtin) WHERE gtin IS NOT NULL;

COMMENT ON COLUMN public.furniture.size_width IS 'Largeur en centimetres';
COMMENT ON COLUMN public.furniture.size_height IS 'Hauteur en centimetres';
COMMENT ON COLUMN public.furniture.size_depth IS 'Profondeur en centimetres';
COMMENT ON COLUMN public.furniture.gtin IS 'Code-barres GTIN (8, 12, 13 ou 14 chiffres), unique quand renseigne';
COMMENT ON COLUMN public.furniture.attributes IS 'Caracteristiques libres (couleur, matiere...), objet JSON';

-- 2. Partenaire : lien affilie, a signaler a l'utilisateur
ALTER TABLE public.partner
  ADD COLUMN IF NOT EXISTS is_affiliate boolean NOT NULL DEFAULT false;

-- 3. Cles etrangeres sans index (advisor 0001_unindexed_foreign_keys)
CREATE INDEX IF NOT EXISTS category_parent_id_idx ON public.category (parent_id);
CREATE INDEX IF NOT EXISTS favorite_furniture_id_idx ON public.favorite (furniture_id);
CREATE INDEX IF NOT EXISTS furniture_category_category_id_idx
  ON public.furniture_category (category_id);

NOTIFY pgrst, 'reload schema';

-- Phase 2, tache 6 (spec 6.3) : offre enrichie, phase "etendre".
-- `is_active` reste en place (le back la lit encore) ; elle sera retiree en tache 10.
-- Idempotent : rejouable sans ecraser les statuts deja poses.

-- 1. Enums
DO $$
BEGIN
  CREATE TYPE public.offer_status AS ENUM ('active', 'stale', 'removed');
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE public.offer_availability AS ENUM ('in_stock', 'out_of_stock', 'unknown');
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE public.delivery_mode AS ENUM ('parcel', 'curbside', 'room_of_choice', 'installed', 'unknown');
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE public.offer_condition AS ENUM ('new', 'used', 'refurbished');
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;

-- 2. Statut et derniere observation, initialises une seule fois depuis l'existant
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'offer' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.offer ADD COLUMN status public.offer_status NOT NULL DEFAULT 'active';
    UPDATE public.offer
      SET status = CASE WHEN is_active THEN 'active' ELSE 'removed' END::public.offer_status;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'offer' AND column_name = 'last_seen_at'
  ) THEN
    ALTER TABLE public.offer ADD COLUMN last_seen_at timestamptz;
    UPDATE public.offer SET last_seen_at = coalesce(updated_at, now());
    ALTER TABLE public.offer ALTER COLUMN last_seen_at SET DEFAULT now();
    ALTER TABLE public.offer ALTER COLUMN last_seen_at SET NOT NULL;
  END IF;

  -- Prix en centimes exacts (0 prix a plus de 2 decimales en prod, verifie le 2026-11-05).
  -- Avant total_price : une colonne generee bloque le changement de type.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'offer' AND column_name = 'price'
      AND numeric_precision IS NULL
  ) THEN
    ALTER TABLE public.offer ALTER COLUMN price TYPE numeric(10,2);
  END IF;
END
$$;

-- 3. Nouvelles colonnes (NULL = inconnu)
ALTER TABLE public.offer
  ADD COLUMN IF NOT EXISTS shipping_cost numeric(10,2),
  ADD COLUMN IF NOT EXISTS total_price numeric(10,2) GENERATED ALWAYS AS (price + shipping_cost) STORED,
  ADD COLUMN IF NOT EXISTS eco_fee numeric(10,2),
  ADD COLUMN IF NOT EXISTS availability public.offer_availability NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS delivery_min_days integer,
  ADD COLUMN IF NOT EXISTS delivery_max_days integer,
  ADD COLUMN IF NOT EXISTS delivery_mode public.delivery_mode NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS assembly_included boolean,
  ADD COLUMN IF NOT EXISTS return_days integer,
  ADD COLUMN IF NOT EXISTS condition public.offer_condition NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS seller_name text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- 4. Integrite (0 offre orpheline en prod, verifie le 2026-11-05)
ALTER TABLE public.offer ALTER COLUMN furniture_id SET NOT NULL;
ALTER TABLE public.offer ALTER COLUMN partner_id SET NOT NULL;

ALTER TABLE public.offer DROP CONSTRAINT IF EXISTS offer_price_check;
ALTER TABLE public.offer ADD CONSTRAINT offer_price_check CHECK (price >= 0);
ALTER TABLE public.offer DROP CONSTRAINT IF EXISTS offer_shipping_cost_check;
ALTER TABLE public.offer ADD CONSTRAINT offer_shipping_cost_check CHECK (shipping_cost >= 0);
ALTER TABLE public.offer DROP CONSTRAINT IF EXISTS offer_eco_fee_check;
ALTER TABLE public.offer ADD CONSTRAINT offer_eco_fee_check CHECK (eco_fee >= 0 AND eco_fee <= price);
ALTER TABLE public.offer DROP CONSTRAINT IF EXISTS offer_delivery_days_check;
ALTER TABLE public.offer ADD CONSTRAINT offer_delivery_days_check CHECK (
  delivery_min_days >= 0 AND delivery_max_days >= 0 AND delivery_min_days <= delivery_max_days
);
ALTER TABLE public.offer DROP CONSTRAINT IF EXISTS offer_return_days_check;
ALTER TABLE public.offer ADD CONSTRAINT offer_return_days_check CHECK (return_days >= 0);

-- Une annonce par meuble, marchand, vendeur et etat ; vendeur inconnu (NULL) compris.
-- Son index couvre aussi les recherches par furniture_id (colonne de tete).
ALTER TABLE public.offer DROP CONSTRAINT IF EXISTS offer_unique_listing;
ALTER TABLE public.offer ADD CONSTRAINT offer_unique_listing
  UNIQUE NULLS NOT DISTINCT (furniture_id, partner_id, seller_name, condition);

CREATE INDEX IF NOT EXISTS offer_partner_id_idx ON public.offer (partner_id);

-- 5. RLS : le public ne voit que les offres actives (le back, en service role, voit tout)
DROP POLICY IF EXISTS catalog_read ON public.offer;
DROP POLICY IF EXISTS offer_read_active ON public.offer;
CREATE POLICY offer_read_active ON public.offer
  FOR SELECT TO anon, authenticated
  USING (status = 'active');

-- 6. Documentation
COMMENT ON COLUMN public.offer.price IS 'Prix article TTC en euros, eco-participation comprise, hors livraison';
COMMENT ON COLUMN public.offer.total_price IS 'price + shipping_cost ; NULL si la livraison est inconnue';
COMMENT ON COLUMN public.offer.eco_fee IS 'Eco-participation, deja comprise dans price';
COMMENT ON COLUMN public.offer.last_seen_at IS 'Derniere fois que l''offre a ete vue chez le marchand';
COMMENT ON COLUMN public.offer.seller_name IS 'Vendeur tiers sur une marketplace ; NULL = le marchand lui-meme';

NOTIFY pgrst, 'reload schema';

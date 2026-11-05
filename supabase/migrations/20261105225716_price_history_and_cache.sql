-- Phase 2, tache 8 (spec 6.6, 6.7) : historique des prix par offre, et caches du meuble
-- (cached_min_price, cached_nb_offers) maintenus par la base au lieu des scripts d'ingestion.
-- Idempotent.

-- 1. Table d'historique
CREATE TABLE IF NOT EXISTS public.price_history (
  price_history_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  offer_id uuid NOT NULL REFERENCES public.offer (offer_id) ON DELETE CASCADE,
  price numeric(10,2) NOT NULL CONSTRAINT price_history_price_check CHECK (price >= 0),
  shipping_cost numeric(10,2),
  observed_at timestamptz NOT NULL DEFAULT now()
);

-- Couvre aussi la cle etrangere offer_id (colonne de tete)
CREATE INDEX IF NOT EXISTS price_history_offer_observed_idx
  ON public.price_history (offer_id, observed_at DESC);

COMMENT ON TABLE public.price_history IS 'Prix et frais de livraison d''une offre, a la creation et a chaque changement';

-- 2. RLS : lecture publique limitee aux offres actives (coherent avec offer_read_active)
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS price_history_read_active ON public.price_history;
CREATE POLICY price_history_read_active ON public.price_history
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.offer o
      WHERE o.offer_id = price_history.offer_id AND o.status = 'active'
    )
  );

REVOKE ALL ON public.price_history FROM anon, authenticated;
GRANT SELECT ON public.price_history TO anon, authenticated;

-- 3. Trigger d'historique : creation, puis changement effectif de prix ou de livraison
CREATE OR REPLACE FUNCTION public.record_price_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT'
     OR NEW.price IS DISTINCT FROM OLD.price
     OR NEW.shipping_cost IS DISTINCT FROM OLD.shipping_cost THEN
    INSERT INTO public.price_history (offer_id, price, shipping_cost)
    VALUES (NEW.offer_id, NEW.price, NEW.shipping_cost);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS offer_record_price_history ON public.offer;
CREATE TRIGGER offer_record_price_history
  AFTER INSERT OR UPDATE OF price, shipping_cost ON public.offer
  FOR EACH ROW EXECUTE FUNCTION public.record_price_history();

-- 4. Trigger de cache : recalcule le ou les meubles touches, sur les seules offres actives.
-- Base : prix article (sens actuel du tri et du filtre du back), pas le prix total.
CREATE OR REPLACE FUNCTION public.refresh_furniture_offer_cache()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  ids uuid[];
BEGIN
  IF TG_OP = 'INSERT' THEN
    ids := ARRAY[NEW.furniture_id];
  ELSIF TG_OP = 'DELETE' THEN
    ids := ARRAY[OLD.furniture_id];
  ELSE
    ids := ARRAY[OLD.furniture_id, NEW.furniture_id];
  END IF;

  UPDATE public.furniture f
  SET cached_min_price = a.min_price, cached_nb_offers = a.nb
  FROM (
    SELECT u.furniture_id,
           (SELECT min(o.price) FROM public.offer o
            WHERE o.furniture_id = u.furniture_id AND o.status = 'active') AS min_price,
           (SELECT count(*)::int FROM public.offer o
            WHERE o.furniture_id = u.furniture_id AND o.status = 'active') AS nb
    FROM unnest(ids) AS u (furniture_id)
  ) a
  WHERE f.furniture_id = a.furniture_id
    AND (f.cached_min_price IS DISTINCT FROM a.min_price OR f.cached_nb_offers IS DISTINCT FROM a.nb);

  RETURN NULL;
END;
$$;

-- Deux triggers : une offre seulement revue (last_seen_at) ne recalcule rien
DROP TRIGGER IF EXISTS offer_refresh_cache ON public.offer;
CREATE TRIGGER offer_refresh_cache
  AFTER INSERT OR DELETE ON public.offer
  FOR EACH ROW EXECUTE FUNCTION public.refresh_furniture_offer_cache();

DROP TRIGGER IF EXISTS offer_refresh_cache_on_update ON public.offer;
CREATE TRIGGER offer_refresh_cache_on_update
  AFTER UPDATE OF furniture_id, price, status ON public.offer
  FOR EACH ROW EXECUTE FUNCTION public.refresh_furniture_offer_cache();

REVOKE EXECUTE ON FUNCTION public.record_price_history() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_furniture_offer_cache() FROM PUBLIC, anon, authenticated;

-- 5. Chargement initial : une ligne par offre existante, pour ne pas demarrer a vide
INSERT INTO public.price_history (offer_id, price, shipping_cost, observed_at)
SELECT o.offer_id, o.price, o.shipping_cost, coalesce(o.updated_at, now())
FROM public.offer o
WHERE NOT EXISTS (SELECT 1 FROM public.price_history h WHERE h.offer_id = o.offer_id);

-- 6. Recalcul initial des caches sur le statut (et non plus is_active)
UPDATE public.furniture f
SET cached_min_price = a.min_price, cached_nb_offers = a.nb
FROM (
  SELECT f2.furniture_id,
         min(o.price) FILTER (WHERE o.status = 'active') AS min_price,
         count(o.offer_id) FILTER (WHERE o.status = 'active')::int AS nb
  FROM public.furniture f2
  LEFT JOIN public.offer o ON o.furniture_id = f2.furniture_id
  GROUP BY f2.furniture_id
) a
WHERE f.furniture_id = a.furniture_id
  AND (f.cached_min_price IS DISTINCT FROM a.min_price OR f.cached_nb_offers IS DISTINCT FROM a.nb);

NOTIFY pgrst, 'reload schema';

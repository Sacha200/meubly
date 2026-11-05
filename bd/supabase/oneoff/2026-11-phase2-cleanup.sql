-- One-off phase 2 (spec 6.2) : retire les donnees de demo de la PROD.
-- Seules les offres du partenaire IKEA 8d2e3d7c-... sont reelles. Supprime : toutes les autres
-- offres, les meubles qui n'existaient qu'a travers elles, tous les autres partenaires et leurs
-- partner_product ; recalcule cached_min_price / cached_nb_offers.
--
-- Pas une migration : ne doit pas se rejouer sur `db reset` (effacerait la demo du seed local).
-- Pas de BEGIN/COMMIT : l'appelant ouvre la transaction (prod : BEGIN; <script> COMMIT;).
-- Rejouable : une seconde execution ne supprime plus rien.
-- S'arrete (RAISE EXCEPTION, donc ROLLBACK) si IKEA est introuvable, si un favori ou un avis
-- serait efface par cascade, ou s'il reste une paire (meuble, partenaire) en double.

DROP TABLE IF EXISTS pg_temp._demo_furniture;

-- Meubles sans aucune offre IKEA mais avec des offres de demo, captures AVANT suppression
-- (un meuble deja sans offre n'est pas concerne).
CREATE TEMP TABLE _demo_furniture AS
  SELECT DISTINCT o.furniture_id
  FROM public.offer o
  WHERE o.partner_id <> '8d2e3d7c-1f4a-4a2c-8c3f-0b9cf7f8e2a1'
    AND NOT EXISTS (
      SELECT 1 FROM public.offer k
      WHERE k.furniture_id = o.furniture_id
        AND k.partner_id = '8d2e3d7c-1f4a-4a2c-8c3f-0b9cf7f8e2a1'
    );

DO $$
DECLARE
  ikea constant uuid := '8d2e3d7c-1f4a-4a2c-8c3f-0b9cf7f8e2a1';
  n_user_rows int;
  n_offers int;
  n_furniture int;
  n_pp int;
  n_partners int;
  n_dup int;
  n_cache int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.partner WHERE partner_id = ikea) THEN
    RAISE EXCEPTION 'Partenaire IKEA % introuvable : arret, rien supprime', ikea;
  END IF;

  SELECT (SELECT count(*) FROM public.favorite WHERE furniture_id IN (SELECT furniture_id FROM _demo_furniture))
       + (SELECT count(*) FROM public.review WHERE furniture_id IN (SELECT furniture_id FROM _demo_furniture))
    INTO n_user_rows;
  IF n_user_rows > 0 THEN
    RAISE EXCEPTION '% favori(s) ou avis sur des meubles de demo seraient effaces : arret', n_user_rows;
  END IF;

  DELETE FROM public.offer WHERE partner_id <> ikea;
  GET DIAGNOSTICS n_offers = ROW_COUNT;

  DELETE FROM public.furniture f
  USING _demo_furniture d
  WHERE f.furniture_id = d.furniture_id
    AND NOT EXISTS (SELECT 1 FROM public.offer o WHERE o.furniture_id = f.furniture_id);
  GET DIAGNOSTICS n_furniture = ROW_COUNT;

  DELETE FROM public.partner_product WHERE partner_id <> ikea;
  GET DIAGNOSTICS n_pp = ROW_COUNT;

  DELETE FROM public.partner WHERE partner_id <> ikea;
  GET DIAGNOSTICS n_partners = ROW_COUNT;

  SELECT count(*) INTO n_dup
  FROM (SELECT 1 FROM public.offer GROUP BY furniture_id, partner_id HAVING count(*) > 1) x;
  IF n_dup > 0 THEN
    RAISE EXCEPTION '% paire(s) (meuble, partenaire) en doublon apres nettoyage : arret', n_dup;
  END IF;

  UPDATE public.furniture f
  SET cached_min_price = a.min_price, cached_nb_offers = a.nb
  FROM (
    SELECT f2.furniture_id,
           min(o.price) FILTER (WHERE o.is_active) AS min_price,
           count(o.offer_id) FILTER (WHERE o.is_active)::int AS nb
    FROM public.furniture f2
    LEFT JOIN public.offer o ON o.furniture_id = f2.furniture_id
    GROUP BY f2.furniture_id
  ) a
  WHERE f.furniture_id = a.furniture_id
    AND (f.cached_min_price IS DISTINCT FROM a.min_price OR f.cached_nb_offers IS DISTINCT FROM a.nb);
  GET DIAGNOSTICS n_cache = ROW_COUNT;

  RAISE NOTICE 'Supprime : % offres, % meubles, % partner_product, % partenaires ; caches corriges : %',
    n_offers, n_furniture, n_pp, n_partners, n_cache;
END
$$;

DROP TABLE IF EXISTS pg_temp._demo_furniture;

-- 009 : Row Level Security sur toutes les tables publiques (matrice : docs/security-matrix.md).
-- Le back utilise la service role (contourne le RLS) : ces politiques protegent tout acces direct
-- avec la cle anon (front via SDK, PostgREST, GraphQL). Idempotent.

-- 1. RLS active partout
ALTER TABLE public.profile            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.furniture          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.furniture_category ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.furniture_image    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_product    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review             ENABLE ROW LEVEL SECURITY;

-- 2. Catalogue : lecture publique, aucune ecriture hors service role
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'category', 'furniture', 'furniture_category', 'furniture_image',
    'partner', 'offer', 'partner_product'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS catalog_read ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY catalog_read ON public.%I FOR SELECT TO anon, authenticated USING (true)', t
    );
    EXECUTE format(
      'REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.%I FROM anon, authenticated', t
    );
  END LOOP;
END
$$;

-- 3. Profil : chacun lit le sien ; aucune ecriture directe (role modifiable seulement au tableau de bord)
DROP POLICY IF EXISTS profile_read_own ON public.profile;
CREATE POLICY profile_read_own ON public.profile
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
REVOKE ALL ON public.profile FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.profile FROM authenticated;

-- 4. Favoris : proprietaire uniquement
DROP POLICY IF EXISTS favorite_read_own ON public.favorite;
CREATE POLICY favorite_read_own ON public.favorite
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS favorite_insert_own ON public.favorite;
CREATE POLICY favorite_insert_own ON public.favorite
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS favorite_delete_own ON public.favorite;
CREATE POLICY favorite_delete_own ON public.favorite
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

REVOKE ALL ON public.favorite FROM anon;
REVOKE UPDATE, TRUNCATE ON public.favorite FROM authenticated;

-- 5. Avis : lecture publique, ecriture par l'auteur
DROP POLICY IF EXISTS review_read ON public.review;
CREATE POLICY review_read ON public.review
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS review_insert_own ON public.review;
CREATE POLICY review_insert_own ON public.review
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS review_update_own ON public.review;
CREATE POLICY review_update_own ON public.review
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS review_delete_own ON public.review;
CREATE POLICY review_delete_own ON public.review
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.review FROM anon;
REVOKE TRUNCATE ON public.review FROM authenticated;

-- 6. Fonction morte : vise des tables obsoletes ("Furniture", offers), aucun trigger ne l'utilise.
DROP FUNCTION IF EXISTS public.update_nb_offers();

NOTIFY pgrst, 'reload schema';

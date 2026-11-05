-- Phase 2, tache 8 (spec 6.6) : updated_at pose par la base, plus par l'horloge des clients.
-- Idempotent.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at() IS 'Trigger BEFORE UPDATE : updated_at = now()';

DROP TRIGGER IF EXISTS offer_set_updated_at ON public.offer;
CREATE TRIGGER offer_set_updated_at
  BEFORE UPDATE ON public.offer
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS partner_product_set_updated_at ON public.partner_product;
CREATE TRIGGER partner_product_set_updated_at
  BEFORE UPDATE ON public.partner_product
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS review_set_updated_at ON public.review;
CREATE TRIGGER review_set_updated_at
  BEFORE UPDATE ON public.review
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Fonction de trigger : aucun role applicatif n'a a l'appeler directement
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';

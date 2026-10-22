-- 007 : le profil devient le prolongement d'un compte Supabase Auth.
-- - nettoyage : roles normalises, profils orphelins supprimes, profils manquants crees ;
-- - plus aucun secret : password_hash (et colonnes locales obsoletes) supprimes ;
-- - contraintes : role USER/ADMIN, FK vers auth.users avec cascade ;
-- - triggers : creation du profil a l'inscription (role force a USER), synchronisation de l'email.
-- Idempotent : rejouable sans erreur.

-- 1. Roles normalises
UPDATE public.profile SET role = 'USER'
WHERE role IS NULL OR upper(role) NOT IN ('USER', 'ADMIN');
UPDATE public.profile SET role = upper(role) WHERE role <> upper(role);

-- 2. Profils sans compte Auth (decision proprietaire 2026-10-19 : supprimes)
DELETE FROM public.profile p
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.user_id);

-- 3. Comptes Auth sans profil. username est facultatif : la prod l'avait en NOT NULL, ce qui
-- bloquait tout compte cree sans metadonnees (tableau de bord, anciens clients).
ALTER TABLE public.profile ALTER COLUMN username DROP NOT NULL;

INSERT INTO public.profile (user_id, email, username, lastname, role)
SELECT u.id, u.email, u.raw_user_meta_data ->> 'username', u.raw_user_meta_data ->> 'lastname', 'USER'
FROM auth.users u
ON CONFLICT (user_id) DO NOTHING;

-- 4. Colonnes
ALTER TABLE public.profile DROP COLUMN IF EXISTS password_hash;
ALTER TABLE public.profile DROP COLUMN IF EXISTS data_encrypted;
ALTER TABLE public.profile DROP COLUMN IF EXISTS last_login;
ALTER TABLE public.profile ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE public.profile ALTER COLUMN role SET DEFAULT 'USER';
ALTER TABLE public.profile ALTER COLUMN role SET NOT NULL;

-- 5. Contraintes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profile_role_check') THEN
    ALTER TABLE public.profile
      ADD CONSTRAINT profile_role_check CHECK (role IN ('USER', 'ADMIN'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profile_user_id_fkey') THEN
    ALTER TABLE public.profile
      ADD CONSTRAINT profile_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE;
  END IF;

  -- favorite.user_id doit viser auth.users (deja le cas en prod, pas en local).
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Favorite_user_id_fkey'
      AND conrelid = 'public.favorite'::regclass
      AND confrelid <> 'auth.users'::regclass
  ) THEN
    ALTER TABLE public.favorite DROP CONSTRAINT "Favorite_user_id_fkey";
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Favorite_user_id_fkey' AND conrelid = 'public.favorite'::regclass
  ) THEN
    DELETE FROM public.favorite f
    WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = f.user_id);
    ALTER TABLE public.favorite
      ADD CONSTRAINT "Favorite_user_id_fkey"
      FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE;
  END IF;
END
$$;

-- 6. Creation du profil a l'inscription. Le role est une constante : jamais lu des metadonnees,
-- que l'utilisateur controle.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profile (user_id, email, username, lastname, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'username',
    NEW.raw_user_meta_data ->> 'lastname',
    'USER'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_user_email_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.profile SET email = NEW.email WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_user_email_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.handle_user_email_update();

NOTIFY pgrst, 'reload schema';

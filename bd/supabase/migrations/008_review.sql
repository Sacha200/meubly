-- 008 : avis utilisateurs. Un avis par utilisateur et par meuble, note 1-5, commentaire <= 1000.
-- user_id vise profile(user_id) (et non auth.users) pour permettre l'embarquement PostgREST
-- profile(username) ; la suppression du compte cascade via profile. Idempotent.

CREATE TABLE IF NOT EXISTS public.review (
  review_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  furniture_id uuid NOT NULL REFERENCES public.furniture (furniture_id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES public.profile (user_id) ON DELETE CASCADE,
  rating       smallint NOT NULL CONSTRAINT review_rating_check CHECK (rating BETWEEN 1 AND 5),
  comment      text CONSTRAINT review_comment_check
                 CHECK (comment IS NULL OR char_length(comment) <= 1000),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT review_user_furniture_key UNIQUE (user_id, furniture_id)
);

CREATE INDEX IF NOT EXISTS review_furniture_id_idx ON public.review (furniture_id);

NOTIFY pgrst, 'reload schema';

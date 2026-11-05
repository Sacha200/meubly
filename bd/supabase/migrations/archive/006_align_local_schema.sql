-- 006 : aligne une base locale sur le schema de production (sans effet en prod).
-- La prod possede ces colonnes, utilisees par le code ; la stack locale historique ne les a pas.

ALTER TABLE public.profile ADD COLUMN IF NOT EXISTS lastname text;
ALTER TABLE public.partner ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

NOTIFY pgrst, 'reload schema';

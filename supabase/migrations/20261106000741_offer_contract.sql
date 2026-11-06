-- Phase 2, tache 10 (spec 6.3) : offre, phase "contracter".
-- `status` remplace `is_active` depuis la tache 6 ; le back lit `status` depuis la tache 9
-- (deployee en prod le 2026-11-06). Les scripts bd/ingestion/* ecrivent encore is_active :
-- geles en phase 2, reecrits en phase 3.
-- Idempotent.

ALTER TABLE public.offer DROP COLUMN IF EXISTS is_active;

NOTIFY pgrst, 'reload schema';

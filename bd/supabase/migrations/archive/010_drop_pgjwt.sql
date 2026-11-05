-- 010 : suppression de l'extension pgjwt (schema extensions), jamais utilisee par le projet.
-- Elle bloque la mise a jour de Postgres proposee par Supabase (extension depreciee, absente des
-- versions recentes). Verifie le 2026-11-04 en prod et en local : aucune fonction, politique RLS ni
-- vue ne l'appelle, aucun objet n'en depend, aucune reference dans le depot.
-- Pas de CASCADE : si un objet en dependait, la commande echouerait au lieu de le supprimer.
-- Idempotent.

DROP EXTENSION IF EXISTS pgjwt;

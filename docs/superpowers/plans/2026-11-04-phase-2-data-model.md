# Phase 2 - Modele de donnees : plan d'implementation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un schema reproductible (baseline CLI, Postgres 17 partout) qui porte le metier du comparateur (offre riche, historique de prix, clics, executions d'ingestion), avec des donnees prod honnetes et une integrite assuree par la base.

**Architecture:** La stack Supabase CLI remplace la base self-hosted en local ; la baseline est tiree de la prod, l'historique cloud est realigne dessus, puis chaque evolution est une migration CLI (`supabase/migrations/<timestamp>_<nom>.sql`) testee localement (`supabase db reset` + `npm run test:db`), fusionnee, puis poussee en prod avec accord (`supabase db push`). Les changements cassants suivent "etendre puis contracter" (Render et Vercel deploient a la fusion sur `master`).

**Tech Stack:** Supabase CLI (via `npx`, version figee en tache 1), Postgres 17, Express 4 ESM, supabase-js 2, Vitest 3 + supertest, Docker Desktop.

**Spec:** `docs/superpowers/specs/2026-11-04-phase-2-data-model-design.md`

## Global Constraints

- Une tache a la fois, chacune sur sa branche (`chore/...`, `feat/...`), PR fusionnee par le proprietaire avant la tache suivante.
- AUCUNE ecriture sur le projet cloud `rlxyptqvtpdhrdpdoiwy` (DDL, DML, historique de migrations) sans accord explicite du proprietaire juste avant, pour cette ecriture-la. Lecture libre.
- Avant chaque `db push` prod : `npx supabase db push --dry-run` montre exactement la migration attendue et rien d'autre ; apres : advisors securite + performance via MCP `get_advisors`.
- Migrations : creees par `npx supabase migration new <nom_snake_case>`, idempotentes (`IF NOT EXISTS`, `DROP ... IF EXISTS`, `DO $$` gardes), fonctions avec `SET search_path = ''` et noms qualifies `public.`, terminees par `NOTIFY pgrst, 'reload schema';`.
- Toute nouvelle table : RLS active dans la meme migration + entree dans `docs/security-matrix.md`.
- Ne jamais lire ni afficher `.env` (racine, `meubly-back/.env`). Les valeurs locales viennent de `npx supabase status` ; le proprietaire les recopie lui-meme dans `.env`.
- `bd/ingestion/*` gele : ne jamais le lancer contre la prod pendant la phase 2.
- Seed (`supabase/seed.sql`) : n'utilise QUE des colonnes qui survivent a la phase 2 (jamais `offer.is_active`).
- ESM, imports `.js`, Prettier + ESLint a 0 erreur (`npm run lint`, `npm run format:check`) dans `meubly-back` et `meubly-front` ; `npm run build` front apres tout changement front.
- Commits conventionnels termines par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Ancienne numerotation `NNN_` abandonnee : 001 a 010 archivees dans `bd/supabase/migrations/archive/` (spec 6.1).

## Review Focus

1. `db pull`/`db dump` de la baseline sans les grants/RLS exacts de la prod : `db diff` local vs prod doit etre vide, schemas `public` ET `storage` politiques comprises (tache 1, etape de diff).
2. Offre de marketplace sans vendeur (`seller_name` NULL) inseree deux fois pour le meme meuble/partenaire/etat : la seconde doit etre refusee (NULLS NOT DISTINCT) (tache 6).
3. Mise a jour d'une offre qui ne change pas le prix (ex. seulement `last_seen_at`) : aucune ligne `price_history` creee (tache 8).
4. Offre passee en `removed` ou supprimee : `cached_min_price`/`cached_nb_offers` du meuble recalcules, et NULL/0 si plus aucune offre active (tache 8).
5. Visiteur anon lisant `price_history` d'une offre non active : 0 ligne (tache 8).

---

## Fichiers

- Create : `supabase/config.toml`, `supabase/seed.sql`, `supabase/migrations/<ts>_baseline.sql`, `supabase/migrations/<ts>_extensions_trgm_graphql.sql`, `supabase/migrations/<ts>_offer_expand.sql`, `supabase/migrations/<ts>_furniture_partner_columns.sql`, `supabase/migrations/<ts>_updated_at_triggers.sql`, `supabase/migrations/<ts>_price_history_and_cache.sql`, `supabase/migrations/<ts>_click_out_ingestion_run.sql`, `supabase/migrations/<ts>_offer_contract.sql`, `bd/supabase/oneoff/2026-11-phase2-cleanup.sql`, `scripts/import-prod-catalog.md` (procedure prod -> local), `meubly-back/tests/db/schema.db.test.js`, `meubly-back/tests/db/offer.db.test.js`, `meubly-back/tests/db/priceHistory.db.test.js`, `meubly-back/tests/db/cleanup.db.test.js`, `docs/diagrams/data-model.md`, `docs/diagrams/offer-states.md`, `docs/diagrams/ingestion-flow.md`.
- Modify : `docker-compose.yml`, `docker-compose.dev.yml`, `.env.example`, `bd/supabase/apply-local.sh` (supprime, remplace par la CLI), `meubly-back/tests/db/env.js`, `meubly-back/tests/db/rls.db.test.js`, `meubly-back/repositories/offerRepository.js`, `meubly-back/repositories/partnerRepository.js`, `meubly-back/services/providerService.js`, `meubly-back/routes/v1/provider.js`, `meubly-back/services/reviewService.js`, tests unitaires associes, `docs/security-matrix.md`, `docs/diagrams/architecture.md`, `docs/ROADMAP.md`, `README.md`, `CLAUDE.md`.
- Move : `bd/supabase/migrations/00*.sql` et `010_*.sql` -> `bd/supabase/migrations/archive/`.
- Delete : `volumes/` (configs des services self-hosted retires), `bd/supabase/apply-local.sh`.

---

### Task 1: Baseline CLI et base locale reproductible

**Branche :** `chore/supabase-cli-baseline`. Aucune ecriture prod.

**Files:**
- Create: `supabase/config.toml`, `supabase/migrations/<ts>_baseline.sql`, `supabase/seed.sql`, `scripts/import-prod-catalog.md`
- Move: `bd/supabase/migrations/*.sql` -> `bd/supabase/migrations/archive/`

**Interfaces:**
- Produces : commande `npx supabase@<VERSION> ...` (VERSION notee dans README et CLAUDE.md, reutilisee par toutes les taches) ; stack locale API `http://127.0.0.1:54321`, DB `postgresql://postgres:postgres@127.0.0.1:54322/postgres`, Studio :54323, Mailpit :54324 (valeurs par defaut CLI, a confirmer par `supabase status`) ; seed avec partenaire IKEA `8d2e3d7c-1f4a-4a2c-8c3f-0b9cf7f8e2a1` et au moins 2 partenaires de demo.

- [x] **Step 1: Figer la version de la CLI.** `npx supabase@latest --version` ; noter la version X.Y.Z et l'utiliser partout sous la forme `npx supabase@X.Y.Z`. Lire `--help` de `db dump`, `db pull`, `db diff`, `migration repair`, `link` pour cette version (flag `--linked` ou `--remote` selon la version).
- [x] **Step 2: Init.** `npx supabase@X.Y.Z init` a la racine. Dans `config.toml` : `project_id = "meubly"`, `[db] major_version = 17`, `[auth] site_url = "http://localhost:5173"`, `additional_redirect_urls = ["http://localhost:5173/**"]`, `minimum_password_length = 10`, `password_requirements = "lower_upper_letters_digits"` (aligne sur la prod, verifier les noms de cles dans le `config.toml` genere).
- [x] **Step 3: Lier (lecture seule).** Le proprietaire lance `! npx supabase@X.Y.Z login` puis `! npx supabase@X.Y.Z link --project-ref rlxyptqvtpdhrdpdoiwy` (mot de passe DB saisi par lui). `link` n'ecrit rien en prod.
- [x] **Step 4: Baseline.** `npx supabase@X.Y.Z db dump --<linked|remote> -f supabase/migrations/<ts>_baseline.sql` (schema seul, `<ts>` = horodatage UTC du jour au format `YYYYMMDDHHMMSS`). Ne PAS utiliser `db pull` ici : il ecrit l'historique distant (tache 2). Relire le fichier : pas de secret, pas de donnees.
- [x] **Step 5: Archiver.** `git mv` des fichiers 001 a 010 vers `bd/supabase/migrations/archive/`, avec un `README.md` de 3 lignes (pourquoi, plus rejoues, reference baseline).
- [x] **Step 6: Seed.** `supabase/seed.sql` : 3 categories (dont une enfant via `parent_id`), 6 meubles (2 avec dimensions), partenaire IKEA avec l'UUID de prod, 2 partenaires de demo (UUID quelconques), 1 offre IKEA par meuble et 1 a 2 offres de demo sur 3 meubles, liens `furniture_category`. Colonnes autorisees : celles de la baseline sauf `offer.is_active`. Aucun utilisateur (les tests en creent).
- [x] **Step 7: Reset local.** `npx supabase@X.Y.Z start` puis `npx supabase@X.Y.Z db reset`. Attendu : baseline + seed appliques sans erreur.
- [x] **Step 8: Diff vs prod.** `npx supabase@X.Y.Z db diff --<linked|remote> -s public,storage` (ou `--from local --to remote` selon la version). Attendu : aucune difference. Tout ecart est corrige dans la baseline (pas dans une migration) et explique dans la PR.
- [x] **Step 9: Procedure d'import complet.** `scripts/import-prod-catalog.md` : `db dump --data-only` des tables catalogue (`category`, `furniture`, `furniture_category`, `furniture_image`, `partner`, `offer`, `partner_product`) vers un fichier hors git (`data/` ignore, verifier `.gitignore`), puis `psql` sur `127.0.0.1:54322`. Sens prod -> local uniquement. Mentionner que `bd/ingestion/cloud_to_local.mjs` ecrit en realite vers le cloud et ne doit pas servir.
- [x] **Step 10: Commit.** `chore(db): supabase cli baseline from prod, seed, archive 001-010`.

### Task 2: Stack applicative sur la CLI et tests DB

**Branche :** meme PR que la tache 1 si le proprietaire prefere, sinon `chore/local-stack-cli`. Aucune ecriture prod.

**Files:**
- Modify: `docker-compose.yml`, `docker-compose.dev.yml`, `.env.example`, `meubly-back/tests/db/env.js`, `docs/diagrams/architecture.md` (ports), `README.md`, `CLAUDE.md`
- Delete: services Supabase self-hosted du compose (`studio`, `kong`, `auth`, `mailpit`, `rest`, `realtime`, `storage`, `imgproxy`, `meta`, `functions`, `analytics`, `db`, `vector`, `supavisor`), leurs volumes, `volumes/`, `bd/supabase/apply-local.sh`

**Interfaces:**
- Consumes : stack CLI de la tache 1.
- Produces : `.env` racine avec `SUPABASE_PUBLIC_URL=http://127.0.0.1:54321`, `ANON_KEY`, `SERVICE_ROLE_KEY` (valeurs de `supabase status`) ; `npm run test:db` vert sur la stack CLI.

- [x] **Step 1: Compose.** Retirer les services listes. `meubly-back` : `SUPABASE_URL: http://host.docker.internal:54321`, `extra_hosts: ["host.docker.internal:host-gateway"]`, plus de `depends_on: kong`. `meubly-front` (build args et dev) : `VITE_SUPABASE_URL: http://localhost:54321`. Garder `ingestion` et SonarQube.
- [x] **Step 2: env de test.** `tests/db/env.js` : valeur par defaut `http://127.0.0.1:54321` au lieu de `http://localhost:8000` ; message d'erreur qui renvoie a `npx supabase status`. `guard.js` inchange (`127.0.0.1`, `localhost`, `host.docker.internal` deja admis ; retirer `kong`).
- [x] **Step 3: `.env.example`.** Remplacer les variables self-hosted par `SUPABASE_PUBLIC_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY` (+ cles API applicatives existantes), commentaire "valeurs : `npx supabase status`". Le proprietaire met a jour son `.env` (pause : lui demander, ne pas le faire).
- [x] **Step 4: Tests DB.** `cd meubly-back && npm run test:db`. Attendu : toutes les suites existantes (`favorites`, `profile`, `review`, `reviews.api`, `rls`) vertes sur la stack CLI. Le test mot de passe oublie se verifie via Mailpit :54324.
- [x] **Step 5: App.** `docker compose --profile app -f docker-compose.yml -f docker-compose.dev.yml up -d --build --renew-anon-volumes meubly-back meubly-front` ; `curl http://localhost:5000/api/v1/health` -> 200 ; `GET /api/v1/furnitures` renvoie les meubles du seed.
- [x] **Step 6: Docs.** CLAUDE.md (commandes : `npx supabase@X.Y.Z start|stop|db reset|migration new|db push`, suppression de `apply-local.sh`, piege "PG 15 local" retire, convention `supabase/migrations/<timestamp>_x.sql`), README (demarrage local), `architecture.md` (ports).
- [x] **Step 7: Lint/CI.** `npm run lint && npm run format:check && npm run test:run` dans `meubly-back` et `meubly-front`. Commit `chore(dev): run local stack on supabase cli`.

### Task 3: Realigner l'historique de migrations prod (ecriture prod, accord requis)

**Branche :** aucune modification de code attendue (sinon `chore/prod-migration-history`).

**Interfaces:**
- Consumes : baseline `<ts>_baseline.sql` fusionnee sur `master`.
- Produces : `supabase migration list --<linked|remote>` montre la baseline appliquee en local ET en prod, et rien d'autre.

- [x] **Step 1: Etat avant.** `npx supabase@X.Y.Z migration list --<linked|remote>`. Attendu cote prod : 20261022194147, 20261022210811, 20261022211505, 20261022211900, 20261104123706.
- [x] **Step 2: Accord.** Montrer au proprietaire les deux commandes ci-dessous (elles ne touchent que la table d'historique `supabase_migrations.schema_migrations`, aucun objet du schema) et attendre son "oui".
- [x] **Step 3: Repair.** `migration repair --status reverted 20261022194147 20261022210811 20261022211505 20261022211900 20261104123706 --<linked|remote>` puis `migration repair --status applied <ts_baseline> --<linked|remote>`.
- [x] **Step 4: Verifier.** `migration list` : une seule ligne, baseline, LOCAL = REMOTE. `db push --dry-run` : "Remote database is up to date". `db diff` vide.

### Task 4: Extensions (`pg_trgm` deplace, `pg_graphql` retire, index trigram)

**Branche :** `chore/db-extensions`.

**Files:**
- Create: `supabase/migrations/<ts>_extensions_trgm_graphql.sql`, `meubly-back/tests/db/schema.db.test.js`

- [x] **Step 1: Test.** `schema.db.test.js` > "recherche par titre" : via `adminClient()`, `from("furniture").select("furniture_id").ilike("title", "%<mot d'un titre du seed>%")` renvoie >= 1 ligne et `error` null. (Garantit que la recherche du back marche apres le deplacement de l'extension.)
- [x] **Step 2: Migration.** `ALTER EXTENSION pg_trgm SET SCHEMA extensions` (garde : seulement si `extnamespace` = `public`) ; `DROP EXTENSION IF EXISTS pg_graphql` ; `CREATE INDEX IF NOT EXISTS furniture_title_trgm_idx ON public.furniture USING gin (title extensions.gin_trgm_ops)`.
- [x] **Step 3: Verifier.** `db reset` ; `npm run test:db` vert ; dans Studio local, `EXPLAIN SELECT ... WHERE title ILIKE '%x%'` cite `furniture_title_trgm_idx` (si le planner prefere un seq scan sur 6 lignes, le noter : c'est attendu sur le seed).
- [x] **Step 4: Commit + PR.** `chore(db): move pg_trgm to extensions, drop pg_graphql, trigram index on title`.
- [x] **Step 5: Prod (accord).** Apres fusion : `db push --dry-run` (cette seule migration), accord, `db push`, advisors : plus de WARN `extension_in_public` ni 0026/0027. Smoke : `GET https://<back prod>/api/v1/furnitures?q=malm` -> 200 et resultats.

### Task 5: Nettoyage des donnees prod (ecriture prod, accord requis)

**Branche :** `chore/prod-demo-data-cleanup`. Script ponctuel, pas une migration de schema **[choix Claude, ecart a la spec 6.2 "migration de donnees"]** : ces suppressions ne concernent que les donnees prod et ne doivent pas se rejouer sur `db reset` (elles effaceraient la demo locale du seed).

**Files:**
- Create: `bd/supabase/oneoff/2026-11-phase2-cleanup.sql`, `meubly-back/tests/db/cleanup.db.test.js`

**Interfaces:**
- Produces : le script, sans `BEGIN`/`COMMIT` (l'appelant ouvre la transaction), executable plusieurs fois sans effet supplementaire, avec `RAISE EXCEPTION` si une paire (meuble, partenaire) reste en double.

- [x] **Step 1: Test.** `cleanup.db.test.js` (sur le seed) : connexion `pg` locale (`postgresql://postgres:postgres@127.0.0.1:54322/postgres` ; ajouter `pg` en devDependency du back), `BEGIN`, execution du fichier, assertions, seconde execution (aucune erreur, memes comptes), `ROLLBACK` : le seed reste intact. Assertions : 0 offre hors IKEA `8d2e3d7c-...`, 0 partenaire hors IKEA, les meubles du seed qui n'avaient que des offres de demo ont disparu, `cached_min_price`/`cached_nb_offers` = min/count des offres IKEA actives. Second cas : inserer dans la transaction une paire IKEA en double -> le script leve une erreur.
- [x] **Step 2: Script.** Ordre spec 6.2 : (1) supprimer offres non IKEA ; (2) supprimer meubles sans aucune offre QUI avaient des offres de demo (capturer leurs ids dans une table temporaire AVANT l'etape 1, pour ne pas toucher le meuble deja sans offre, spec 6.2-6), en supprimant d'abord leurs `furniture_category`, `furniture_image`, `partner_product`, `favorite`, `review` ; (3) supprimer `partner_product` puis partenaires hors IKEA ; (4) controle doublons -> `RAISE EXCEPTION` ; (5) recalcul des caches sur offres `is_active = true` (la colonne existe encore a ce stade) ; `RAISE NOTICE` des comptes avant/apres.
- [x] **Step 3: Verifier local.** `npm run test:db` vert ; comptes du seed inchanges apres la suite.
- [x] **Step 4: Commit + PR.** `chore(db): one-off script removing demo offers and partners`.
- [x] **Step 5: Filet prod.** Le proprietaire lance `! npx supabase@X.Y.Z db dump --<linked|remote> --data-only -f data/prod-backup-2026-11-phase2.sql` (hors git, verifier `.gitignore` sur `data/`).
- [x] **Step 6: Prod (accord).** Comptes avant via MCP `execute_sql` en lecture (attendus : 140 offres hors IKEA, 15 partenaires hors IKEA, 19 meubles demo-seuls, 0 favori/avis dessus). Accord. Execution via `execute_sql` du contenu `BEGIN; <script> COMMIT;`. Comptes apres : 7 897 offres, 1 partenaire, 7 898 meubles, 0 doublon, caches coherents (requete de controle du step 1). Signaler au proprietaire le meuble restant sans offre.

### Task 6: Offre, phase "etendre"

**Branche :** `feat/offer-schema`.

**Files:**
- Create: `supabase/migrations/<ts>_offer_expand.sql`, `meubly-back/tests/db/offer.db.test.js`
- Modify: `meubly-back/tests/db/rls.db.test.js`, `supabase/seed.sql` (remplir quelques nouveaux champs)

**Interfaces:**
- Produces : enums `public.offer_status('active','stale','removed')`, `public.offer_availability('in_stock','out_of_stock','unknown')`, `public.delivery_mode('parcel','curbside','room_of_choice','installed','unknown')`, `public.offer_condition('new','used','refurbished')` ; colonnes et contraintes du tableau spec 6.3 ; `status` initialise depuis `is_active` ; politique `offer_read_active`. `is_active` reste (tache 10).

- [x] **Step 1: Verif typage.** Lecture prod : `select count(*) from offer where price <> round(price, 2)`. Si 0, `numeric(10,2)` ; sinon garder `numeric` et le noter dans la PR.
- [x] **Step 2: Tests.** `offer.db.test.js` (service role, nettoyage en `afterAll`) :
  - `total_price` = `price + shipping_cost` ; NULL quand `shipping_cost` NULL.
  - refus (erreur) : `price = -1`, `shipping_cost = -1`, `eco_fee > price`, `delivery_min_days = 5` et `max = 2`, `return_days = -1`, `furniture_id` NULL.
  - defauts : `status = 'active'`, `availability = 'unknown'`, `delivery_mode = 'unknown'`, `condition = 'new'`, `last_seen_at` et `created_at` non NULL.
  - unicite (Review Focus 2) : deux offres meme `(furniture_id, partner_id)`, `seller_name` NULL, `condition 'new'` -> la seconde echoue ; meme chose avec `condition 'used'` -> acceptee ; `seller_name 'X'` -> acceptee.
  - `rls.db.test.js` : anon voit une offre `active`, ne voit pas une offre `stale` ni `removed`.
- [x] **Step 3: Lancer.** `npm run test:db` -> echec (colonnes absentes).
- [x] **Step 4: Migration.** Enums gardes (`DO $$ ... EXCEPTION WHEN duplicate_object`), colonnes `ADD COLUMN IF NOT EXISTS`, `UPDATE offer SET status = CASE WHEN is_active THEN 'active' ELSE 'removed' END, last_seen_at = coalesce(updated_at, now())`, `furniture_id`/`partner_id` NOT NULL, CHECK nommes `offer_*_check`, `ALTER COLUMN price TYPE numeric(10,2)` selon step 1, `offer_unique_listing UNIQUE NULLS NOT DISTINCT (furniture_id, partner_id, seller_name, condition)`, index `offer_partner_id_idx`, remplacement de `catalog_read` par `offer_read_active` sur `offer` (`USING (status = 'active')`, anon + authenticated), `COMMENT ON COLUMN` pour `price` (TTC euros, eco-participation comprise) et `total_price`.
- [x] **Step 5: Lancer.** `db reset` puis `npm run test:db` -> vert. `npm run test:run` back -> vert (le back lit encore `is_active`, toujours present).
- [x] **Step 6: Commit + PR.** `feat(db): enrich offer (status, shipping, delivery, condition, seller)`.
- [x] **Step 7: Prod (accord).** `db push --dry-run`, accord, `db push`, advisors (pas de FK non indexee sur `offer`). Smoke : `GET /api/v1/furnitures/<id>/offers` prod -> 200.

### Task 7: Colonnes meuble et partenaire

**Branche :** `feat/furniture-partner-columns`.

**Files:**
- Create: `supabase/migrations/<ts>_furniture_partner_columns.sql`
- Modify: `meubly-back/tests/db/schema.db.test.js`, `meubly-back/repositories/partnerRepository.js`, `meubly-back/services/providerService.js`, `meubly-back/routes/v1/provider.js`, test unitaire providers existant (sinon `tests/unit/providers.test.js`)

**Interfaces:**
- Produces : `furniture.brand text`, `gtin text` (index unique partiel `WHERE gtin IS NOT NULL`, CHECK `gtin ~ '^([0-9]{8}|[0-9]{12,14})$'`), `manufacturer_ref text`, `weight_kg numeric CHECK (> 0)`, `attributes jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(attributes) = 'object')`, CHECK `> 0` sur les 3 dimensions, `COMMENT ON COLUMN` "centimetres" ; `partner.is_affiliate boolean NOT NULL DEFAULT false`. API provider : champ `isAffiliate` (booleen) en lecture et en ecriture admin.

- [x] **Step 1: Tests DB.** `schema.db.test.js` : refus de `size_width = 0`, `weight_kg = 0`, `gtin = 'abc'`, `attributes = '[]'` ; deux meubles avec le meme `gtin` -> le second echoue ; deux avec `gtin` NULL -> acceptes ; nouveau partenaire -> `is_affiliate = false`.
- [x] **Step 2: Tests unitaires.** `GET /api/v1/providers/:id` renvoie `isAffiliate` ; `PATCH` admin avec `isAffiliate: true` ecrit `is_affiliate: true` ; `isAffiliate: "oui"` -> 400 (`body("isAffiliate").optional().isBoolean({ strict: true })`, comme `isActive`).
- [x] **Step 3: Lancer** -> echecs attendus.
- [x] **Step 4: Migration + code.** Migration selon Interfaces. `partnerRepository` COLUMNS + `is_affiliate` ; `providerService` mappe `isAffiliate <-> is_affiliate` comme `isActive`.
- [x] **Step 5: Lancer.** `db reset`, `npm run test:db`, `npm run test:run`, lint -> verts.
- [x] **Step 6: Commit + PR.** `feat(db): furniture identifiers and attributes, partner is_affiliate`.
- [x] **Step 7: Prod (accord).** Migration poussee AVANT ou AVEC le deploiement du back (le back lit `is_affiliate`) : `db push` d'abord, puis fusion de la PR. Advisors.

### Task 8: Horodatages, historique de prix, caches, tables de suivi

**Branche :** `feat/price-history`. Trois migrations dans cet ordre.

**Files:**
- Create: `supabase/migrations/<ts>_updated_at_triggers.sql`, `<ts>_price_history_and_cache.sql`, `<ts>_click_out_ingestion_run.sql`, `meubly-back/tests/db/priceHistory.db.test.js`
- Modify: `meubly-back/services/reviewService.js`, `meubly-back/tests/unit/reviews.test.js`, `meubly-back/tests/db/review.db.test.js`, `meubly-back/tests/db/rls.db.test.js`, `meubly-back/tests/db/schema.db.test.js`

**Interfaces:**
- Produces : `public.set_updated_at() returns trigger` (triggers `BEFORE UPDATE` sur `offer`, `partner_product`, `review`) ; `public.record_price_history() returns trigger` ; `public.refresh_furniture_offer_cache() returns trigger` ; tables `price_history`, `click_out`, `ingestion_run` et enum `public.ingestion_status('running','succeeded','failed','partial')` exactement comme spec 6.7.

- [x] **Step 1: Tests.**
  - `review.db.test.js` : modifier un avis sans envoyer `updated_at` -> `updated_at >= created_at` et > ancienne valeur.
  - `reviews.test.js` (unitaire) : `upsertReview` n'envoie plus `updated_at` au repository.
  - `priceHistory.db.test.js` : insertion d'offre -> 1 ligne d'historique (prix, frais) ; update du prix -> 2 lignes ; update de `last_seen_at` seul -> toujours 2 (Review Focus 3) ; update de `shipping_cost` -> 3 ; suppression de l'offre -> historique supprime (cascade).
  - meme fichier, caches : meuble avec offres actives 100 et 80 -> `cached_min_price = 80`, `cached_nb_offers = 2` ; passer 80 en `removed` -> 100 / 1 ; supprimer la derniere -> NULL / 0 (Review Focus 4) ; deplacer une offre vers un autre meuble (`UPDATE furniture_id`) -> les deux meubles recalcules.
  - `rls.db.test.js` : anon lit l'historique d'une offre `active`, 0 ligne pour une offre `removed` (Review Focus 5) ; anon et authenticated : 0 ligne et ecriture refusee sur `click_out` et `ingestion_run` ; ecriture anon refusee sur `price_history`.
  - `schema.db.test.js` : `click_out` accepte `user_id` NULL ; suppression du compte -> `user_id` passe a NULL (helpers `createTestUser`/`deleteTestUser`).
- [x] **Step 2: Lancer** -> echecs attendus.
- [x] **Step 3: Migration `updated_at_triggers`** + retrait de `updated_at` dans `reviewService.upsertReview` (`fields = { rating, comment }`).
- [x] **Step 4: Migration `price_history_and_cache`.** Table + index `(offer_id, observed_at DESC)` + RLS (`price_history_read_active` : `EXISTS (SELECT 1 FROM public.offer o WHERE o.offer_id = price_history.offer_id AND o.status = 'active')`) ; trigger `AFTER INSERT OR UPDATE OF price, shipping_cost` avec garde `IS DISTINCT FROM` ; trigger cache `AFTER INSERT OR UPDATE OR DELETE` (recalcule `OLD.furniture_id` et `NEW.furniture_id`) ; backfill : 1 ligne par offre existante (`observed_at = coalesce(updated_at, now())`) garde par `WHERE NOT EXISTS` ; recalcul initial des caches sur `status = 'active'`.
- [x] **Step 5: Migration `click_out_ingestion_run`.** Tables, index, RLS activee sans politique, `REVOKE ALL ... FROM anon, authenticated`.
- [x] **Step 6: Lancer.** `db reset`, `npm run test:db`, `npm run test:run`, lint -> verts.
- [x] **Step 7: Commit + PR.** `feat(db): price history, offer cache triggers, click_out, ingestion_run`.
- [x] **Step 8: Prod (accord).** `db push --dry-run` (3 migrations, ordre), accord, `db push`, puis fusion (le retrait de `updated_at` cote back est compatible avec ou sans trigger). Controles lecture : `count(price_history) = count(offer)`, 0 ecart de cache. Advisors : 0 FK non indexee.

### Task 9: Back sur le nouveau statut d'offre

**Branche :** `feat/offer-api-status`.

**Files:**
- Modify: `meubly-back/repositories/offerRepository.js`, test d'integration/unitaire des offres (`tests/integration/furnitureRoutes.test.js` ou `tests/unit/furnitureService.test.js`, selon celui qui couvre `GET /furnitures/:id/offers`)

**Interfaces:**
- Produces : `offerRepository.findByFurnitureId(furnitureId: string): Promise<Offer[]>` filtre `status = 'active'`, tri `total_price` croissant NULLS LAST puis `price`, colonnes `offer_id, external_title, url_website, price, shipping_cost, total_price, eco_fee, availability, delivery_min_days, delivery_max_days, delivery_mode, assembly_included, return_days, condition, seller_name, last_seen_at, updated_at, furniture_id, partner(name, logo_url, is_affiliate)`. Plus aucune reference a `is_active` d'offre dans le back.

- [x] **Step 1: Test.** Le mock Supabase de la suite verifie `.eq("status", "active")` et l'absence de `is_active` ; la reponse expose `total_price` et `partner.is_affiliate`.
- [x] **Step 2: Lancer** -> echec.
- [x] **Step 3: Code.** `offerRepository.findByFurnitureId` selon Interfaces. Verifier le front : `grep -rn "is_active\|price" meubly-front/src/components/Detail` ; aucun changement attendu (champs ajoutes seulement) ; `npm run build` front vert.
- [x] **Step 4: Lancer.** `npm run test:run`, `npm run test:db`, lint -> verts. `grep -rn "is_active" meubly-back --include=*.js | grep -v node_modules` -> seulement `partner` (`partnerRepository`, `providerService`).
- [x] **Step 5: Commit + PR**, fusion par le proprietaire, deploiement Render. Smoke prod : `GET /api/v1/furnitures/<id>/offers` -> 200 avec `total_price`.

### Task 10: Offre, phase "contracter"

**Branche :** `chore/offer-drop-is-active`. Seulement apres le deploiement de la tache 9 en prod.

**Files:**
- Create: `supabase/migrations/<ts>_offer_contract.sql`
- Modify: `meubly-back/tests/db/schema.db.test.js`

- [x] **Step 1: Test.** `from("offer").select("is_active")` -> `error` non null.
- [x] **Step 2: Migration.** `ALTER TABLE public.offer DROP COLUMN IF EXISTS is_active`.
- [x] **Step 3: Lancer.** `db reset`, `npm run test:db`, `npm run test:run` -> verts.
- [x] **Step 4: Commit + PR**, puis prod (accord) : `db push --dry-run`, `db push`, smoke `GET /furnitures/<id>/offers` 200, advisors.

### Task 11: Documentation et cloture

**Branche :** `docs/phase-2-closeout`.

**Files:**
- Create: `docs/diagrams/data-model.md` (Mermaid `erDiagram` : toutes les tables `public`, cles, cardinalites), `docs/diagrams/offer-states.md` (`stateDiagram-v2` : `active` -> `stale` -> `removed`, `stale` -> `active` si revue, transitions pilotees par l'ingestion en phase 3), `docs/diagrams/ingestion-flow.md` (`flowchart` cible phase 3 : adaptateur -> `partner_product` -> rapprochement -> upsert `offer` -> triggers `price_history`/caches -> `ingestion_run`)
- Modify: `docs/diagrams/architecture.md` (C4 : stack CLI locale), `docs/security-matrix.md` (politiques `offer_read_active`, `price_history_read_active`, `click_out` et `ingestion_run` service role seul), `docs/ROADMAP.md` (phase 2 terminee, `review` retire de la liste, points ouverts spec section 10), `README.md`, `CLAUDE.md` (tables, `cached_*` maintenus par trigger, plus "toute ecriture d'offre doit les maintenir")

- [x] **Step 1: Ecrire les documents.** Les diagrammes refletent `supabase/migrations` reel (verifier par `db diff` vide et lecture du schema local).
- [x] **Step 2: Verifier fin de phase** (spec section 9) : `db diff` local vs prod vide ; advisors securite (seul WARN mots de passe compromis) et performance (0 FK non indexee) ; comptes prod (0 offre de demo, 1 partenaire, 0 doublon, caches coherents, `price_history` >= nb offres) ; lint/tests/CI verts.
- [x] **Step 3: Commit + PR.** `docs: close phase 2 (data model)`. Mettre a jour la memoire de session.

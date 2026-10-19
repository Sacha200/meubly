# Phase 1 - Securite : plan d'implementation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Plus aucune donnee exposee : RLS sur toutes les tables, routes d'ecriture protegees, auth 100 % Supabase Auth, admin des comptes sans mot de passe, avis fonctionnels, SSRF et debit maitrises.

**Architecture:** Defense a deux niveaux. Le back (service role) applique la matrice de droits par route (`requireAuth` / `requireAdmin`) ; la base applique la meme matrice en RLS pour tout acces direct (front via SDK, cle anon). Migrations SQL idempotentes testees sur la stack locale Docker avant toute application en prod.

**Tech Stack:** Express 4 ESM, supabase-js 2.49, express-validator 7, express-rate-limit 8.7.0 (nouveau), Vitest 3 + supertest ; Vue 3 + Pinia ; Postgres 15 (Supabase).

**Spec:** `docs/superpowers/specs/2026-10-19-phase-1-security-design.md`

## Global Constraints

- Seuls les fichiers `repositories/*` appellent `supabase.from(...)` ou `supabase.auth.admin.*`.
- Validation des entrees a la route (express-validator) ; erreurs levees avec `statusCode`, reponse par `middlewares/errorMiddleware.js`.
- Aucun message d'erreur Supabase ni `stack` renvoye au client (5xx = message generique).
- Roles : exactement `USER` et `ADMIN` (`CHECK (role IN ('USER','ADMIN'))`). Aucun code n'attribue `ADMIN`.
- Avis : `rating` entier 1 a 5 obligatoire ; `comment` <= 1000 caracteres, facultatif ; un avis par `(user_id, furniture_id)`.
- Migrations : `bd/supabase/migrations/NNN_description.sql`, idempotentes (rejouables deux fois sans erreur), terminees par `NOTIFY pgrst, 'reload schema';`.
- AUCUNE ecriture sur le projet Supabase cloud `rlxyptqvtpdhrdpdoiwy` avant la tache 16 et l'accord explicite du proprietaire.
- Ne jamais afficher le contenu de `.env` ; les scripts peuvent le charger sans l'imprimer.
- ESM, imports avec extension `.js`, Prettier (`npm run format:check`) et ESLint (`npm run lint`) a 0 erreur dans `meubly-back` et `meubly-front`.
- Commits conventionnels sur `feat/phase-1-security`, termines par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. Recherche admin `q` contenant `,` `(` `)` `%` : ne doit pas injecter de filtre PostgREST dans `.or(...)` -> 400 (tache 8).
2. Liste publique des avis : ne doit exposer ni `user_id` ni email de l'auteur, seulement `author_name` (tache 9).
3. Image IA servie avec redirection vers un hote interne, ou de plus de 10 Mo, ou non `image/*` : refusee sans appel Replicate (tache 10).
4. Inscription avec `options.data.role = "ADMIN"` (front modifie a la main) : profil cree en `USER` (tache 2).
5. Admin qui se bloque ou se supprime lui-meme : 400, compte intact (tache 8).

---

## Fichiers

Back (`meubly-back`)
- Create : `middlewares/rateLimit.js`, `utils/httpError.js`, `utils/imageFetch.js`, `repositories/authAdminRepository.js`, `tests/helpers/authMock.js`, `tests/db/env.js`, `tests/db/helpers.js`, `tests/db/profile.db.test.js`, `tests/db/review.db.test.js`, `tests/db/rls.db.test.js`, `tests/unit/auth.test.js`, `tests/unit/errors.test.js`, `tests/unit/adminRoutes.test.js`, `tests/unit/users.test.js`, `tests/unit/reviews.test.js`, `tests/unit/aiScene.test.js`, `tests/unit/rateLimit.test.js`.
- Modify : `app.js`, `middlewares/authMiddleware.js`, `middlewares/roleMiddleware.js`, `middlewares/errorMiddleware.js`, `routes/v1.js`, `routes/v1/{users,categories,provider,furnitures,favorites,reviews,ai}.js`, tous les `controllers/*`, `services/{userService,providerService,reviewService}.js`, `repositories/{userRepository,partnerRepository,reviewRepository}.js`, `vitest.db.config.js`, `tests/db/favorites.db.test.js`, `tests/unit/aiBucket.test.js`, `package.json`.
- Delete : `routes/v1/auth.js`, `controllers/authController.js`, `services/authService.js`, `repositories/providerRepository.js`.

Base (`bd/supabase`)
- Create : `apply-local.sh`, `migrations/006_align_local_schema.sql`, `migrations/007_profile_auth.sql`, `migrations/008_review.sql`, `migrations/009_rls.sql`.

Front (`meubly-front`)
- Create : `src/api/usersApi.js`, `src/api/providersApi.js`, `src/api/authHeaders.js`, `tests/unit/adminApi.test.js`.
- Modify : `src/api/authApi.js`, `src/api/furnituresApi.js`, `src/clientapi.js`, `src/stores/furnitureStore.js`, `src/components/Detail/ProductDetail.vue`, `src/components/Detail/ProductReviews.vue`, `src/views/ProductDetailView.vue`, `src/views/Admin/user/listView.vue`, `src/views/Admin/provider/*.vue`, `src/views/Admin/furnitures/*.vue`, `src/router/index.js`, `tests/unit/api.test.js`, `package.json`.
- Delete : `src/views/Admin/user/createView.vue`, `src/views/Admin/user/updateView.vue`.

Docs : `docs/security-matrix.md` (create), `README.md`, `CLAUDE.md`, `docs/ROADMAP.md`, `meubly-back/TESTS.md` (s'il existe, sinon section du README).

---

### Task 1: Outillage base locale et alignement du schema

**Files:**
- Create: `bd/supabase/apply-local.sh`, `bd/supabase/migrations/006_align_local_schema.sql`, `meubly-back/tests/db/env.js`, `meubly-back/tests/db/helpers.js`
- Modify: `meubly-back/vitest.db.config.js`, `meubly-back/tests/db/favorites.db.test.js`

**Interfaces:**
- Produces: `bash bd/supabase/apply-local.sh <fichier.sql>...` (applique chaque fichier dans `supabase-db` avec `psql -U postgres -v ON_ERROR_STOP=1`, s'arrete au premier echec).
- Produces (`tests/db/helpers.js`) : `adminClient(): SupabaseClient` (service role) ; `createTestUser({ metadata = {} } = {}): Promise<{ id: string, email: string, token: string, client: SupabaseClient }>` (via `auth.admin.createUser({ email, password, email_confirm: true, user_metadata: metadata })` puis `signInWithPassword` ; `client` = client anon portant le jeton) ; `anonClient(): SupabaseClient` ; `deleteTestUser(id: string): Promise<void>`.
- Produces (`tests/db/env.js`, fichier de setup vitest db) : lit `../.env` racine via `dotenv.config({ path, processEnv: local })` sans rien afficher, puis definit `SUPABASE_URL = local.SUPABASE_PUBLIC_URL || "http://localhost:8000"`, `SUPABASE_ANON_KEY = local.ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY = local.SERVICE_ROLE_KEY`, et appelle `assertLocalSupabase(SUPABASE_URL)`.

- [ ] **Step 1:** Ecrire `006_align_local_schema.sql` : sans effet sur la prod, il ajoute a la base locale ce que la prod possede et que le code utilise : `ALTER TABLE public.profile ADD COLUMN IF NOT EXISTS lastname text;` et `ALTER TABLE public.partner ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();`.
- [ ] **Step 2:** Ecrire `apply-local.sh`, l'executer deux fois de suite sur 006. Attendu : deux executions sans erreur.
- [ ] **Step 3:** Ecrire `tests/db/env.js` et `tests/db/helpers.js`, brancher `setupFiles: ["./tests/db/env.js"]` dans `vitest.db.config.js`.
- [ ] **Step 4:** Reecrire `favorites.db.test.js` sur les helpers : retirer le `dotenv` local et l'insertion manuelle de profil (le trigger de la tache 2 s'en charge ; d'ici la, garder l'insertion dans `helpers.createTestUser` derriere `on conflict do nothing` via upsert service role) ; `afterAll` appelle `deleteTestUser`.
- [ ] **Step 5:** Run: `cd meubly-back && npm run test:db`. Expected: 3 tests favoris PASS, et l'utilisateur de test n'existe plus apres coup (`docker exec supabase-db psql -U postgres -tAc "select count(*) from auth.users where email like 'test_%@meubly.test'"` -> `0`).
- [ ] **Step 6:** Commit `test(db): local db tooling, schema alignment and real favorites teardown`.

### Task 2: Migration profil lie a Supabase Auth

**Files:**
- Create: `bd/supabase/migrations/007_profile_auth.sql`, `meubly-back/tests/db/profile.db.test.js`
- Modify: `meubly-back/tests/db/helpers.js` (retirer l'upsert de profil devenu inutile)

**Interfaces:**
- Produces (SQL) : fonctions `public.handle_new_user()` et `public.handle_user_email_update()` (`SECURITY DEFINER`, `SET search_path = ''`, `EXECUTE` revoque a `public, anon, authenticated`) ; triggers `on_auth_user_created AFTER INSERT ON auth.users` et `on_auth_user_email_updated AFTER UPDATE OF email ON auth.users`.
- Produces (schema) : `profile(user_id uuid PK FK auth.users ON DELETE CASCADE, username, lastname, email, role text NOT NULL DEFAULT 'USER' CHECK (role IN ('USER','ADMIN')), created_at)` ; plus de `password_hash`, `data_encrypted`, `last_login`, ni de default sur `user_id`. `favorite.user_id` reference `auth.users(id) ON DELETE CASCADE`.

- [ ] **Step 1: Tests DB qui echouent** dans `profile.db.test.js` :
  - `cree un profil USER a l'inscription meme si les metadonnees demandent ADMIN` : `createTestUser({ metadata: { username: "alice", lastname: "Martin", role: "ADMIN" } })` -> ligne `profile` avec `role === "USER"`, `username === "alice"`, `lastname === "Martin"`, `email` = email du compte.
  - `synchronise l'email du profil` : `auth.admin.updateUserById(id, { email: nouveau, email_confirm: true })` -> `profile.email === nouveau`.
  - `supprime le profil avec le compte` : `deleteTestUser(id)` -> 0 ligne `profile` pour cet id.
  - `refuse un role hors USER/ADMIN` : update service role `role = 'User'` -> erreur code `23514`.
  - `n'a plus de colonne password_hash` : select `password_hash` -> erreur `42703`.
- [ ] **Step 2:** Run `npm run test:db -- profile`. Expected : FAIL (pas de trigger).
- [ ] **Step 3:** Ecrire `007_profile_auth.sql`, dans cet ordre, chaque etape idempotente :
  1. `UPDATE profile SET role = 'USER' WHERE role IS NULL OR upper(role) NOT IN ('USER','ADMIN')` puis `UPDATE profile SET role = upper(role)`.
  2. `DELETE FROM profile p WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.user_id)` (decision proprietaire : les orphelins sont supprimes ; pas d'identifiant en dur).
  3. `INSERT INTO profile (user_id, email, username, lastname, role) SELECT id, email, raw_user_meta_data->>'username', raw_user_meta_data->>'lastname', 'USER' FROM auth.users ON CONFLICT (user_id) DO NOTHING`.
  4. `DROP COLUMN IF EXISTS password_hash, data_encrypted, last_login` ; `ALTER COLUMN user_id DROP DEFAULT` ; `role SET DEFAULT 'USER', SET NOT NULL`.
  5. Contraintes ajoutees seulement si absentes (bloc `DO $$ ... IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = ...)`) : `profile_role_check`, `profile_user_id_fkey` ; pour `favorite`, remplacer `Favorite_user_id_fkey` si elle ne vise pas `auth.users`.
  6. Fonctions et triggers (`CREATE OR REPLACE FUNCTION`, `DROP TRIGGER IF EXISTS` puis `CREATE TRIGGER`). Le role insere est la constante `'USER'`, jamais lu des metadonnees ; `ON CONFLICT (user_id) DO NOTHING`.
- [ ] **Step 4:** `bash bd/supabase/apply-local.sh bd/supabase/migrations/007_profile_auth.sql` deux fois. Expected : pas d'erreur.
- [ ] **Step 5:** Run `npm run test:db`. Expected : profile + favorites PASS.
- [ ] **Step 6:** Commit `feat(db): link profile to auth.users, create it by trigger, drop password_hash`.

### Task 3: Table des avis

**Files:**
- Create: `bd/supabase/migrations/008_review.sql`, `meubly-back/tests/db/review.db.test.js`

**Interfaces:**
- Produces : `review(review_id uuid PK DEFAULT gen_random_uuid(), furniture_id uuid NOT NULL FK furniture ON DELETE CASCADE, user_id uuid NOT NULL FK profile(user_id) ON DELETE CASCADE, rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5), comment text CHECK (comment IS NULL OR char_length(comment) <= 1000), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE (user_id, furniture_id))`, index `review_furniture_id_idx`.
- Note : la FK vise `profile(user_id)` (et non `auth.users`) pour permettre l'embarquement PostgREST `profile(username)` ; la suppression du compte cascade quand meme via `profile`. Ecart assume vis-a-vis de la spec 5.2.

- [ ] **Step 1: Tests DB qui echouent** : insertion valide OK ; `rating = 0` et `6` -> `23514` ; commentaire de 1001 caracteres -> `23514` ; second avis meme couple -> `23505` ; `deleteTestUser` -> avis supprime ; select embarque `review.select("rating, profile(username)")` renvoie le username.
- [ ] **Step 2:** Run, expected FAIL (table absente).
- [ ] **Step 3:** Ecrire `008_review.sql` (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, trigger `updated_at` facultatif : le service le renseigne deja).
- [ ] **Step 4:** Appliquer deux fois, run `npm run test:db`. Expected PASS.
- [ ] **Step 5:** Commit `feat(db): review table`.

### Task 4: RLS, droits et nettoyage des fonctions

**Files:**
- Create: `bd/supabase/migrations/009_rls.sql`, `meubly-back/tests/db/rls.db.test.js`

**Interfaces:**
- Produces : RLS active sur `profile, category, furniture, furniture_category, furniture_image, partner, offer, partner_product, favorite, review`. Politiques (noms) :
  - `catalog_read` (`SELECT`, `TO anon, authenticated`, `USING (true)`) sur les 7 tables catalogue.
  - `profile_read_own` (`SELECT TO authenticated USING (user_id = (select auth.uid()))`).
  - `favorite_read_own`, `favorite_insert_own`, `favorite_delete_own` (meme condition, `WITH CHECK` pour l'insert).
  - `review_read` (`SELECT TO anon, authenticated USING (true)`), `review_insert_own`, `review_update_own`, `review_delete_own`.
- `REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM anon` ; `REVOKE ALL ON public.profile, public.favorite FROM anon` ; `REVOKE INSERT, UPDATE, DELETE, TRUNCATE` sur les 7 tables catalogue et `profile` `FROM authenticated`.
- `DROP FUNCTION IF EXISTS public.update_nb_offers();` : en prod elle vise des tables obsoletes (`"Furniture"`, `offers`) et aucun trigger ne l'utilise (verifie le 2026-10-19). Remplace l'action "search_path" de la spec par une suppression.
- Politiques creees via `DROP POLICY IF EXISTS` puis `CREATE POLICY` (idempotence).

- [ ] **Step 1: Tests DB qui echouent** (`rls.db.test.js`, deux utilisateurs A et B, `anonClient`) :
  - anon lit `furniture` (>= 1 ligne) et `review` ; anon lit `profile` -> 0 ligne ou erreur `42501` ; anon insert `category` -> erreur.
  - A lit son profil (1 ligne) ; A lit le profil de B -> 0 ligne ; A update son propre `role` -> 0 ligne modifiee / erreur, role toujours `USER`.
  - A ajoute un favori puis le lit ; B ne voit pas le favori de A ; A ne peut pas inserer un favori avec `user_id` de B.
  - A cree un avis ; B ne peut ni le modifier ni le supprimer (0 ligne) ; A le supprime.
  - authenticated insert `furniture` -> erreur.
  - `update_nb_offers` absente.
- [ ] **Step 2:** Run, expected FAIL.
- [ ] **Step 3:** Ecrire `009_rls.sql`.
- [ ] **Step 4:** Appliquer deux fois ; run `npm run test:db` (toute la suite, y compris favoris via l'API back en service role). Expected PASS.
- [ ] **Step 5:** Commit `feat(db): row level security on every public table`.

### Task 5: Middlewares d'authentification et d'autorisation

**Files:**
- Create: `meubly-back/tests/helpers/authMock.js`, `meubly-back/tests/unit/auth.test.js`
- Modify: `middlewares/authMiddleware.js`, `middlewares/roleMiddleware.js`, `repositories/userRepository.js`

**Interfaces:**
- Produces : `userRepository.findRoleByUserId(userId: string): Promise<"USER" | "ADMIN" | null>`.
- Produces : `requireAuth` (401 `{ error: "Authentification requise" }` sans header / sans `Bearer <jeton>` / jeton refuse ; 403 `{ error: "Compte bloque" }` si `user.banned_until` > maintenant ; sinon `req.user = user`). `requireAdmin` (401 sans `req.user` ; 403 `{ error: "Acces reserve aux administrateurs" }` si role != `ADMIN` ; erreur repository -> `next(err)`).
- Produces (`tests/helpers/authMock.js`) : `TOKENS = { admin: "admin-token", user: "user-token", banned: "banned-token" }`, `USERS = { admin: { id: "00000000-0000-4000-8000-00000000000a" }, user: { id: "00000000-0000-4000-8000-00000000000b" } }`, et `mockAuth(supabaseMock, userRepositoryMock)` qui programme `supabase.auth.getUser(token)` et `findRoleByUserId`. Utilise par les taches 6 a 11.

- [ ] **Step 1: Tests qui echouent** (`auth.test.js`, sur une mini-app Express montant `requireAuth, requireAdmin` sur une route factice) : sans header -> 401 ; `Basic x` -> 401 ; jeton inconnu -> 401 ; jeton `banned` (banned_until = demain) -> 403 ; banned_until hier -> passe ; jeton user sur route admin -> 403 ; jeton admin -> 200 ; `requireAdmin` ne touche pas `supabase.from` (assert sur le mock).
- [ ] **Step 2:** Run `npm run test:run -- auth`, expected FAIL.
- [ ] **Step 3:** Implementer.
- [ ] **Step 4:** Run, expected PASS ; `npm run test:run` complet PASS.
- [ ] **Step 5:** Commit `fix(auth): 401 on invalid token, block banned accounts, admin role read from profile`.

### Task 6: Erreurs sans fuite, 404 et routeur favoris

**Files:**
- Create: `meubly-back/utils/httpError.js`, `meubly-back/tests/unit/errors.test.js`
- Modify: `middlewares/errorMiddleware.js`, `app.js`, `routes/v1/favorites.js`, tous les `controllers/*.js`, `services/userService.js`

**Interfaces:**
- Produces : `httpError(statusCode: number, message: string): Error` (pose `err.statusCode`).
- Produces : `errorHandler` -> `statusCode >= 500` ou absent : `{ error: "Erreur interne du serveur" }` ; 4xx : `{ error: err.message }` ; jamais de `stack` sauf `NODE_ENV === "development"` ; erreur de parsing JSON (`err.type === "entity.parse.failed"`) -> 400.
- Produces : catch-all `app.use("/api/v1", ...)` apres le routeur -> 404 `{ error: "Route introuvable" }`.
- Les controllers deviennent `async (req, res, next) => { try { ... } catch (err) { next(err); } }` ; plus aucun `res.status(500).json({ error: error.message })`.

- [ ] **Step 1: Tests qui echouent** : `GET /api/v1/nope` -> 404 (aujourd'hui 401) ; `GET /api/v1/favorites` sans jeton -> 401 ; `GET /api/v1/categories` avec `categoryRepository` qui leve `{ message: "relation secret_table does not exist" }` -> 500 et `res.text` ne contient pas `secret_table` ; corps JSON invalide -> 400 ; `httpError(404, "x")` -> 404 `{ error: "x" }`.
- [ ] **Step 2:** Run, FAIL.
- [ ] **Step 3:** Implementer (favoris : `requireAuth` en argument de chaque route, plus de `router.use(requireAuth)`).
- [ ] **Step 4:** Run `npm run test:run`, PASS (adapter `tests/integration/furnitureRoutes.test.js` si un message d'erreur y etait asserte).
- [ ] **Step 5:** Commit `fix(api): no Supabase error leak, 404 for unknown routes, scoped favorites auth`.

### Task 7: Routes catalogue et partenaires protegees

**Files:**
- Create: `meubly-back/tests/unit/adminRoutes.test.js`
- Modify: `routes/v1/categories.js`, `routes/v1/provider.js`, `routes/v1/furnitures.js`, `repositories/partnerRepository.js`, `services/providerService.js`, `controllers/providerController.js`
- Delete: `repositories/providerRepository.js`
- Modify: `tests/unit/providerService.test.js`

**Interfaces:**
- Produces : `partnerRepository.{ findAll(), findById(id), create(row), update(id, row), delete(id) }` sur la table `partner` (cle `partner_id`).
- Produces : contrat HTTP `/providers` (DTO) `{ id, name, url, logoUrl, isActive, createdAt }` <-> colonnes `partner_id, name, website_base_url, logo_url, is_active, created_at`. Entree acceptee (create / patch) : `name` (1-100, requis au create), `url` (URL http(s)), `logoUrl` (URL http(s), facultatif), `isActive` (booleen). Tout autre champ ignore. `api_key_hash` jamais renvoye.
- Toutes les ecritures (`POST`, `PUT`, `PATCH`, `DELETE`) de `/categories`, `/providers`, `/furnitures` : `requireAuth, requireAdmin`. Lectures publiques inchangees (`GET /compare/:categoryId` inclus).

- [ ] **Step 1: Tests qui echouent** : table parametree `[methode, chemin]` couvrant chaque ecriture des trois routeurs ; pour chacune : sans jeton 401, jeton user 403, jeton admin != 401/403. Plus : `GET /api/v1/providers` renvoie le DTO (pas de `api_key_hash`) ; `POST /providers` sans `name` -> 400 ; `url: "javascript:alert(1)"` -> 400.
- [ ] **Step 2:** Run, FAIL.
- [ ] **Step 3:** Implementer (mapping DTO dans `providerService`).
- [ ] **Step 4:** Run `npm run test:run`, PASS.
- [ ] **Step 5:** Commit `fix(api): admin-only writes on catalog and partners, providers backed by partner table`.

### Task 8: Administration des comptes et retrait de l'auth maison

**Files:**
- Create: `repositories/authAdminRepository.js`, `tests/unit/users.test.js`
- Modify: `routes/v1/users.js`, `controllers/userController.js`, `services/userService.js`, `repositories/userRepository.js`, `routes/v1.js`, `package.json`
- Delete: `routes/v1/auth.js`, `controllers/authController.js`, `services/authService.js`

**Interfaces:**
- Produces : `authAdminRepository.{ getUser(id): Promise<{ id, email, banned_until, created_at, last_sign_in_at } | null>, setBan(id, duration: "876000h" | "none"): Promise<void>, deleteUser(id): Promise<void> }` (seul fichier appelant `supabase.auth.admin`).
- Produces : `userRepository.search({ q, from, to }): Promise<{ rows: Profile[], count: number }>` (filtre `email` ou `username` `ilike`, tri `created_at desc`).
- Routes (toutes `requireAuth, requireAdmin`, validation express-validator) :
  - `GET /users?q=&page=&limit=` : `q` <= 100 caracteres, motif `^[\p{L}\p{N}@._+\- ]*$` (u), sinon 400 ; `limit` 1-50 (defaut 20). Reponse `{ items: [{ id, email, username, lastname, role, createdAt, lastSignInAt, blocked }], total, page, limit }` ; `blocked` = `banned_until` > maintenant (via `authAdminRepository.getUser` par ligne).
  - `GET /users/:id` (UUID) : meme forme d'item ; 404 si absent.
  - `POST /users/:id/block`, `POST /users/:id/unblock` : 204 ; `setBan(id, "876000h" | "none")`.
  - `DELETE /users/:id` : 204 ; `authAdminRepository.deleteUser` (cascade profil, favoris, avis).
  - `:id === req.user.id` sur block / delete -> 400 `{ error: "Action impossible sur votre propre compte" }`.
- Supprime : `POST /users`, `PATCH /users/:id`, `/auth/*`, dependance `bcrypt`.

- [ ] **Step 1: Tests qui echouent** : 401/403 sur les 5 routes ; liste paginee avec `blocked` correct ; `q = "a,role.eq.ADMIN"` -> 400 et repository non appele ; `q = "dupont"` transmis ; `:id` non UUID -> 400 ; block appelle `setBan(id, "876000h")`, unblock `"none"` ; auto-block et auto-delete -> 400 sans appel repository ; `POST /users` -> 404 ; `POST /api/v1/auth/register` -> 404.
- [ ] **Step 2:** Run, FAIL.
- [ ] **Step 3:** Implementer ; `npm uninstall bcrypt`.
- [ ] **Step 4:** Run `npm run test:run` + `npm run lint`, PASS.
- [ ] **Step 5:** Commit `feat(admin): account list, block, unblock and delete via Supabase Auth; drop custom auth routes`.

### Task 9: API des avis

**Files:**
- Create: `tests/unit/reviews.test.js`
- Modify: `routes/v1/reviews.js`, `controllers/reviewController.js`, `services/reviewService.js`, `repositories/reviewRepository.js`

**Interfaces:**
- Repository sur `furniture_id` (plus `product_id`, plus `author_name`) ; retirer `isRelationMissing` (la table existe). Liste : `select("review_id, rating, comment, created_at, updated_at, profile(username)")`.
- Routes :
  - `GET /furnitures/:id/reviews?page&limit` (public, `:id` UUID) -> `{ items: [{ review_id, rating, comment, author_name, created_at, updated_at }], total, page, limit, summary: { average, total, breakdown } }` ; `author_name = profile.username ?? "Utilisateur"` ; jamais de `user_id`.
  - `GET /furnitures/:id/reviews/me` (auth) -> `{ review }` ou `{ review: null }`.
  - `POST /furnitures/:id/reviews` (auth) : `rating` int 1-5, `comment` <= 1000 (trim), `authorName` refuse/ignore ; 404 si le meuble n'existe pas (`furnitureRepository` existant) ; upsert -> 201 `{ action: "created", review }` ou 200 `{ action: "updated", review }`.
  - `DELETE /furnitures/:id/reviews/me` (auth) -> 204, 404 si aucun avis.
  - `DELETE /reviews/:reviewId` (`requireAuth, requireAdmin`) -> 204.

- [ ] **Step 1: Tests qui echouent** : liste sans `user_id` et avec `author_name` ; `rating` 0 / 6 / "abc" -> 400 ; commentaire 1001 -> 400 ; meuble inconnu -> 404 ; premier POST 201 puis 200 ; DELETE me 204 puis 404 ; DELETE admin : user 403, admin 204 ; POST sans jeton 401.
- [ ] **Step 2:** Run, FAIL.
- [ ] **Step 3:** Implementer.
- [ ] **Step 4:** Run, PASS.
- [ ] **Step 5:** Commit `feat(reviews): reviews API on the review table, author name from profile`.

### Task 10: Generation de scene IA sans SSRF

**Files:**
- Create: `utils/imageFetch.js`, `tests/unit/aiScene.test.js`
- Modify: `routes/v1/ai.js`, `controllers/aiController.js`, `tests/unit/aiBucket.test.js`

**Interfaces:**
- Produces : `fetchAllowedImage(url: string, { allowedHosts: string[], maxBytes = 10 * 1024 * 1024 }): Promise<Buffer>` ; leve `httpError(400, "Image source non autorisee")` si protocole != `https:` (sauf hote `localhost`/`kong` hors `NODE_ENV=production`), hote absent de la liste, `content-type` non `image/*` ; `httpError(502, ...)` si la taille depasse `maxBytes` ou si le telechargement echoue. axios : `maxRedirects: 0`, `maxContentLength: maxBytes`, `timeout: 15000`.
- Produces : `getAllowedImageHosts(): string[]` = `AI_IMAGE_HOSTS` (separe par virgules) sinon `["www.ikea.com", "images.unsplash.com", hote de SUPABASE_URL]`. Telechargement du resultat Replicate : hote se terminant par `.replicate.delivery`.
- Route `POST /ai/generate-scene` (`requireAuth`) : corps `{ furnitureId: UUID, prompt: string 3-200 apres trim }` -> 400 sinon ; image = `furniture.cover_url` lue via `furnitureRepository` ; 404 si meuble absent ou sans image. `imageUrl` n'est plus accepte.

- [ ] **Step 1: Tests qui echouent** (axios et replicate mockes) : `imageUrl` seul -> 400 ; prompt de 201 caracteres -> 400 ; meuble inconnu -> 404 ; cover sur `http://169.254.169.254/` -> 400 sans appel axios ; hote autorise mais reponse `text/html` -> 400 sans appel Replicate ; reponse 302 (axios rejette, maxRedirects 0) -> 502 ; nominal -> Replicate appele une fois, 200. Adapter les 6 tests de `aiBucket.test.js` au nouveau corps.
- [ ] **Step 2:** Run, FAIL.
- [ ] **Step 3:** Implementer.
- [ ] **Step 4:** Run `npm run test:run`, PASS.
- [ ] **Step 5:** Commit `fix(ai): generate scenes from a furniture id with an image host allowlist`.

### Task 11: Limitation de debit

**Files:**
- Create: `middlewares/rateLimit.js`, `tests/unit/rateLimit.test.js`
- Modify: `app.js`, `routes/v1/ai.js`, `routes/v1/reviews.js`, `package.json`

**Interfaces:**
- Dependance : `express-rate-limit` version exacte `8.7.0`.
- Produces : `globalLimiter` (300 requetes / 15 min / IP, `standardHeaders: "draft-8"`, `legacyHeaders: false`, saute `/api/v1/health`) ; `aiLimiter` (5 / heure, cle `req.user.id`) ; `reviewWriteLimiter` (20 / heure, cle `req.user.id`). Reponse 429 `{ error: "Trop de requetes, reessayez plus tard" }`.
- `app.set("trust proxy", 1)` (Render) ; `globalLimiter` monte sur `/api/v1` ; `aiLimiter` et `reviewWriteLimiter` places apres `requireAuth`.

- [ ] **Step 1: Tests qui echouent** : 6e appel `generate-scene` du meme utilisateur -> 429 alors qu'un autre utilisateur passe ; 21e POST d'avis -> 429 ; `GET /api/v1/health` jamais limite. Utiliser `vi.resetModules()` + import dynamique de `app.js` pour un store neuf par test.
- [ ] **Step 2:** Run, FAIL.
- [ ] **Step 3:** `npm install express-rate-limit@8.7.0 --save-exact`, implementer.
- [ ] **Step 4:** Run `npm run test:run`, PASS.
- [ ] **Step 5:** Commit `feat(api): rate limiting on the API, AI generation and review writes`.

### Task 12: Front - inscription et administration des comptes

**Files:**
- Create: `src/api/authHeaders.js`, `src/api/usersApi.js`, `tests/unit/adminApi.test.js`
- Modify: `src/api/authApi.js`, `src/clientapi.js`, `src/views/Admin/user/listView.vue`, `src/router/index.js`, `tests/unit/api.test.js`, `package.json`
- Delete: `src/views/Admin/user/createView.vue`, `src/views/Admin/user/updateView.vue`

**Interfaces:**
- Produces : `authHeaders(): Promise<Record<string, string>>` (`Authorization: Bearer <access_token>` depuis `supabase.auth.getSession()`, leve "Utilisateur non connecte" sinon).
- Produces : `usersApi.{ listUsers({ q, page, limit }), blockUser(id), unblockUser(id), deleteUser(id) }` sur `API_BASE` ; erreur HTTP -> `Error(body.error)`.
- `registerUser` : `signUp({ email, password, options: { emailRedirectTo, data: { username, lastname } } })` uniquement ; plus d'insert `profile`, plus de bcryptjs (`npm uninstall bcryptjs`).

- [ ] **Step 1: Tests qui echouent** : `registerUser` n'appelle pas `supabase.from` et transmet `data.username`/`data.lastname` ; `listUsers({ q: "dupont", page: 2 })` appelle `${API_BASE}/users?q=dupont&page=2` avec header Bearer ; `blockUser` -> `POST .../users/<id>/block` ; erreur 403 -> rejet avec le message du back ; sans session -> rejet.
- [ ] **Step 2:** Run `cd meubly-front && npm run test:run`, FAIL.
- [ ] **Step 3:** Implementer ; `listView.vue` : recherche (champ avec label), pagination, colonnes email / nom / role / inscription / statut, actions Bloquer / Debloquer / Supprimer avec confirmation PrimeVue (pas de `window.confirm`), bouton desactive sur sa propre ligne ; retirer les routes `/admin/users/create` et `/admin/users/:id/edit`.
- [ ] **Step 4:** Run `npm run test:run`, `npm run lint`, `npm run build`, PASS.
- [ ] **Step 5:** Commit `feat(front): Supabase-only signup and account administration screen`.

### Task 13: Front - ecrans admin partenaires et meubles authentifies

**Files:**
- Create: `src/api/providersApi.js`
- Modify: `src/views/Admin/provider/{createView,listView,updateView}.vue`, `src/views/Admin/furnitures/*.vue`, `src/clientapi.js`, `tests/unit/adminApi.test.js`

**Interfaces:**
- Consumes : `authHeaders()` (tache 12), DTO `/providers` (tache 7).
- Produces : `providersApi.{ listProviders(), getProvider(id), createProvider(dto), updateProvider(id, dto), deleteProvider(id) }`.
- Formulaires partenaires reduits a `name`, `url`, `logoUrl`, `isActive`. Les vues meubles envoient le jeton pour leurs ecritures (via `furnituresApi`/`authHeaders`, plus d'axios relatif sans header).

- [ ] **Step 1: Tests qui echouent** : `createProvider` POST JSON avec Bearer et uniquement les 4 champs ; `deleteProvider` DELETE avec Bearer.
- [ ] **Step 2:** Run, FAIL.
- [ ] **Step 3:** Implementer ; `grep -rn "axios" src/views/Admin` -> aucune occurrence.
- [ ] **Step 4:** `npm run test:run`, `npm run lint`, `npm run build`, PASS.
- [ ] **Step 5:** Commit `fix(front): admin partner and furniture screens send the session token`.

### Task 14: Front - avis sur la fiche et appel IA

**Files:**
- Modify: `src/api/furnituresApi.js`, `src/components/Detail/ProductReviews.vue`, `src/views/ProductDetailView.vue`, `src/stores/furnitureStore.js`, `src/components/Detail/ProductDetail.vue`, `tests/unit/api.test.js`

**Interfaces:**
- Consumes : routes avis (tache 9), route IA (tache 10).
- Produces : `furnituresApi.{ listFurnitureReviews(id, { page, limit }), getMyFurnitureReview(id), submitFurnitureReview(id, { rating, comment }), deleteMyFurnitureReview(id), deleteReviewAsAdmin(reviewId) }` ; `generateLifestyleImage(furnitureId, prompt)` envoie `{ furnitureId, prompt }`.
- `ProductReviews` reactive dans `ProductDetailView` ; plus d'`authorName` envoye ; pre-remplit le formulaire avec son avis ; bouton supprimer son avis ; bouton supprimer sur chaque avis si `authStore.role === "ADMIN"` ; compteur `n / 1000` ; note selectionnable au clavier avec label ; erreurs liees par `aria-describedby`.

- [ ] **Step 1: Tests qui echouent** : `submitFurnitureReview` n'envoie pas `authorName` ; `deleteMyFurnitureReview` -> `DELETE .../furnitures/<id>/reviews/me` avec Bearer ; `generateLifestyleImage("uuid", "salon")` envoie `{"furnitureId":"uuid","prompt":"salon"}`.
- [ ] **Step 2:** Run, FAIL.
- [ ] **Step 3:** Implementer.
- [ ] **Step 4:** `npm run test:run`, `npm run lint`, `npm run build`, PASS. Verification manuelle sur la stack locale (`docker compose --profile app ...`) : poster, modifier, supprimer un avis ; la moyenne se met a jour.
- [ ] **Step 5:** Commit `feat(front): product reviews and AI scene from furniture id`.

### Task 15: Dependances et documentation de fin de phase

**Files:**
- Create: `docs/security-matrix.md`
- Modify: `meubly-back/package*.json`, `meubly-front/package*.json`, `README.md`, `CLAUDE.md`, `docs/ROADMAP.md`, documentation des tests (`meubly-back/TESTS.md` si present)

- [ ] **Step 1:** `npm audit fix` (sans `--force`) dans les deux projets ; noter dans le message de commit les vulnerabilites restantes qui exigent une version majeure (reportees en phase 5). Relancer `test:run`, `lint`, `build` : PASS.
- [ ] **Step 2:** `docs/security-matrix.md` : la matrice de la spec 5.1, la liste des politiques RLS de la tache 4, les routes et leur garde (tableau route / methode / garde), la procedure "nommer un admin" (tableau de bord Supabase, `profile.role = 'ADMIN'`).
- [ ] **Step 3:** README (stack : retrait bcrypt, ajout rate limiting ; avis ; procedure admin), CLAUDE.md (retirer le piege favoris resolu ; ajouter `apply-local.sh`, `test:db` et son chargement de `.env` racine, regle "repositories seuls a appeler `supabase.auth.admin`"), ROADMAP (phase 1 : statut realisee + date), doc des tests (`test:db`). Ajouter l'exception `.gitignore` si un nouveau `.md` est ignore (`git check-ignore -v docs/security-matrix.md`).
- [ ] **Step 4:** Commit `docs: phase 1 security matrix, README, CLAUDE.md and roadmap`.

### Task 16: Mise en production (BLOQUEE sans accord explicite du proprietaire)

- [ ] **Step 1:** Revue finale de la branche (sous-agent), corrections, PR `feat/phase-1-security` -> `master` ; CI verte.
- [ ] **Step 2:** Presenter au proprietaire : la liste des migrations 006-009, l'effet sur les donnees (14 profils orphelins supprimes, roles normalises, 23 `password_hash` effaces), l'ordre ci-dessous. Attendre son accord. Prevenir aussi : le site n'a plus d'admin entre 007 et l'etape 5 ; les `password_hash` sont perdus definitivement, donc sauvegarde (backup du tableau de bord ou export de `profile`) avant 007.
- [ ] **Step 3:** Appliquer 006, 007, 008, 009 sur `rlxyptqvtpdhrdpdoiwy` via MCP `apply_migration`, une par une, en verifiant chaque retour.
- [ ] **Step 4:** Fusion de la PR (deploiement Render + Vercel) immediatement apres : entre l'etape 3 et le deploiement front, une inscription echouerait (l'ancien front insere encore le profil). Fenetre de quelques minutes acceptee.
- [ ] **Step 5:** Guider le proprietaire : tableau de bord Supabase > Table Editor > `profile` > sa ligne > `role = ADMIN`. Puis Render : Health Check Path `/api/v1/health`, suppression de `GEMINI_API_KEY`, `NODE_ENV=production` present (render.yaml supprime ; sinon regles de dev locales), une seule couche de proxy pour `trust proxy 1` (sinon tous les visiteurs partagent le meme compteur de debit) ; Auth : protection des mots de passe compromis si disponible sur le plan gratuit ; planifier la mise a jour Postgres.
- [ ] **Step 6:** Verification : `get_advisors security` sans ERROR ; `curl` prod : `POST /api/v1/categories` sans jeton -> 401 ; `GET /api/v1/furnitures` -> 200 ; `GET /api/v1/nope` -> 404 ; parcours manuel admin (liste, bloquer/debloquer un compte de test) et avis ; une generation IA sur un meuble IKEA (les redirections ne sont pas suivies : une couverture redirigee donnerait 502) ; deux requetes depuis deux reseaux differents n'ont pas le meme `RateLimit-Remaining`.
- [ ] **Step 7:** Mettre a jour la memoire de session et la ROADMAP si un point reste ouvert.

# Phase 1 - Securite : document de conception

Date : 2026-10-19. Branche : `feat/phase-1-security`. Feuille de route : `docs/ROADMAP.md`, phase 1.

## 1. Intention

Meubly est en production (Vercel + Render + Supabase cloud) avec des donnees exposees :
RLS desactive sur les 9 tables, routes d'administration (`/users`, `/providers`, `/categories`)
ouvertes a tout Internet, mot de passe stocke en double, URL arbitraire telechargee par le serveur.
Le but de la phase : plus aucune donnee exposee, et une gestion des comptes conforme aux usages
(l'admin ne manipule jamais de mot de passe), avant de reconstruire le comparateur (phases 2-3).

Contexte produit : un seul admin (le proprietaire). Cible grand public (emmenagement petit budget,
jeunes couples, etudiants). Supabase en plan gratuit : pas de branche Supabase, les migrations
sont testees sur la stack locale Docker.

## 2. Objectifs, non-objectifs, anti-objectifs

Objectifs
- Matrice de droits ecrite (`docs/security-matrix.md`) et appliquee a deux niveaux : routes back et RLS.
- Authentification entierement deleguee a Supabase Auth.
- Ecran admin des comptes : consulter, rechercher, bloquer, debloquer, supprimer.
- Avis utilisateurs fonctionnels de bout en bout (table, API, affichage sur la fiche).
- Advisors securite Supabase sans ERROR ; tests 401/403 sur chaque route d'ecriture.

Non-objectifs (phase 1)
- Export RGPD des donnees d'un utilisateur (reporte).
- Moderation prealable des avis, signalement d'avis.
- Refonte visuelle des ecrans admin (phase 4) : on adapte le strict necessaire.
- Montee de version majeure de dependances (phase 5).
- Deplacement de l'extension `pg_trgm` hors de `public` (WARN, phase 2 avec le modele de donnees).

Anti-objectifs (echec meme si "ca marche")
- Un chemin applicatif (UI ou API) permettant de devenir ou nommer admin.
- Un mot de passe, ou un hash, stocke ou transmis par notre code.
- Une route d'ecriture accessible sans `requireAuth` (+ `requireAdmin` si admin).
- Une migration appliquee en production sans accord explicite, ou non testee localement.
- Un message d'erreur Supabase brut renvoye au client.

## 3. Constat (verifie le 2026-10-19)

Production (lecture seule via MCP) :
- `profile` : colonnes `user_id, username, email, created_at (date), lastname, role, password_hash`.
  Seule contrainte : cle primaire. Pas de FK vers `auth.users`, pas de CHECK sur le role.
- 63 profils, 65 comptes `auth.users`. 14 profils orphelins (aucun compte Auth), dont 6 dont l'email
  correspond a un compte Auth existant (cree avec un autre `user_id`). 16 comptes Auth sans profil.
- Roles presents : `ADMIN`, `User`, `USER`. Le seul profil `ADMIN` est orphelin : personne n'est admin.
- 23 profils ont un `password_hash`, jamais relu (la connexion utilise `signInWithPassword`).
- `favorite.user_id` a deja une FK `auth.users ON DELETE CASCADE` ; 0 favori orphelin.
- Aucun trigger sur `auth.users`. Table `review` absente.
- Advisors : ERROR `rls_disabled_in_public` x9 ; WARN `function_search_path_mutable` (`update_nb_offers`),
  `extension_in_public` (`pg_trgm`), exposition GraphQL anon/authenticated x9, leaked password
  protection desactivee, version Postgres avec correctifs disponibles.

Stack locale (`supabase-db`) : memes 9 tables, 7917 meubles, mais `profile` differe de la prod
(`data_encrypted`, `last_login` en plus ; pas de `lastname` ; `created_at` en timestamptz ;
FK `favorite -> profile`). La base locale n'est donc pas un miroir exact.

Code :
- `middlewares/roleMiddleware.js` lit la table obsolete `"User"` : `requireAdmin` echoue toujours (403).
- `repositories/providerRepository.js` lit `"Provider"` (obsolete) ; `partnerRepository.js` existe deja sur `partner`.
- `middlewares/authMiddleware.js` repond 403 sur jeton invalide (devrait etre 401).
- `routes/v1/favorites.js` : `router.use(requireAuth)` sans prefixe, toute route inconnue sous `/api/v1` repond 401.
- `routes/v1/auth.js` (`/register`, `/login`, `/logout`) : aucun appelant dans le front ; `/register` hache avec bcrypt.
- Front `src/api/authApi.js` : `signUp` puis insertion du profil avec un hash bcryptjs calcule dans le navigateur.
- Admin users (`views/Admin/user/*`) : appels axios relatifs sans jeton, `PUT` alors que le back expose `PATCH`, ecran de creation avec mot de passe et role.
- `controllers/aiController.js` : `imageUrl` libre, telechargee par `axios.get` (SSRF), `prompt` sans limite.
- `middlewares/errorMiddleware.js` renvoie `err.message` quel que soit le statut.
- Pas de rate limiting (`express-rate-limit` non installe).
- Le front lit `profile` directement (role, username) dans `authApi.loginUser` et `AppHeader.loadRoleFromDb`.

## 4. Decisions du proprietaire

1. Un seul admin. Promotion uniquement via le tableau de bord Supabase (edition de `profile.role`).
2. Ecran admin des comptes : consulter / rechercher (lecture seule), bloquer / debloquer, supprimer
   (demande RGPD ; favoris et avis supprimes avec le compte). Retrait de la creation de compte avec
   mot de passe et du changement de role dans l'interface. Export RGPD reporte.
3. Authentification entierement par Supabase Auth : suppression de `profile.password_hash` et de
   bcrypt cote back et front.
4. Avis : nouvelle table. Note 1 a 5 obligatoire, commentaire facultatif <= 1000 caracteres, un avis
   par utilisateur et par meuble (re-soumettre modifie l'avis existant), publication immediate.

## 5. Conception

### 5.1 Matrice de droits (a reporter dans `docs/security-matrix.md`)

Roles : `anon` (visiteur), `user` (connecte), `admin`, `service` (back, service role, contourne le RLS).

| Ressource | anon | user | admin (via API) |
|---|---|---|---|
| furniture, offer, category, partner, furniture_image, furniture_category, partner_product | lire | lire | lire + ecrire |
| profile | - | lire le sien | lire tous, supprimer |
| favorite | - | lire / ajouter / retirer les siens | - |
| review | lire | lire ; creer / modifier / supprimer le sien | supprimer tout avis |
| compte Auth | s'inscrire, se connecter (Supabase Auth) | gerer sa session | bloquer / debloquer / supprimer |
| generation de scene IA | - | oui, limite en debit | oui |

Regle structurante : toutes les ecritures metier passent par le back (service role). Les politiques
RLS en ecriture pour `authenticated` n'existent que pour la defense en profondeur des tables
proprietaires (`favorite`, `review`) ; aucune politique d'ecriture sur le catalogue ni sur `profile`.

### 5.2 Base de donnees (migrations `bd/supabase/migrations/006_*`, `007_*`...)

Toutes idempotentes, executables sur la prod ET sur la stack locale malgre la derive (utiliser
`IF EXISTS` / `IF NOT EXISTS`, blocs `DO $$` conditionnels). Decoupage suggere :

- **Nettoyage des donnees `profile`** (DML, en tete, avant les contraintes) :
  normaliser `role` (`upper()`, valeurs hors `USER`/`ADMIN` -> `USER`) ; supprimer les profils
  orphelins (voir 5.7) ; creer un profil (role `USER`) pour chaque compte Auth qui n'en a pas.
- **Contraintes `profile`** : `CHECK (role IN ('USER','ADMIN'))`, `role NOT NULL DEFAULT 'USER'`,
  FK `user_id -> auth.users(id) ON DELETE CASCADE`, suppression du `DEFAULT uuid_generate_v4()`
  sur `user_id`, suppression de `password_hash` (et `data_encrypted` si present).
- **Trigger de creation de profil** : `AFTER INSERT ON auth.users`, fonction `SECURITY DEFINER`
  avec `SET search_path = ''`, qui insere `user_id`, `email`, `username` et `lastname` lus dans
  `raw_user_meta_data`, role force a `USER` (jamais lu depuis les metadonnees). Second trigger
  `AFTER UPDATE OF email ON auth.users` pour garder `profile.email` synchronise.
- **Table `review`** : `review_id uuid PK default gen_random_uuid()`, `furniture_id` FK
  `furniture ON DELETE CASCADE`, `user_id` FK `auth.users ON DELETE CASCADE`,
  `rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5)`,
  `comment text CHECK (char_length(comment) <= 1000)`, `created_at`, `updated_at`,
  `UNIQUE (user_id, furniture_id)`, index sur `furniture_id`.
- **RLS** active sur les 10 tables :
  - catalogue : `SELECT` pour `anon, authenticated` ; aucune autre politique.
  - `profile` : `SELECT` pour `authenticated` si `user_id = (select auth.uid())`.
  - `favorite` : `SELECT/INSERT/DELETE` pour `authenticated` sur ses lignes.
  - `review` : `SELECT` pour `anon, authenticated` ; `INSERT/UPDATE/DELETE` pour `authenticated` sur ses lignes.
  - `REVOKE` des droits d'ecriture `anon` sur toutes les tables ; `REVOKE SELECT` `anon` sur `profile` et `favorite`.
- **`update_nb_offers`** : `ALTER FUNCTION ... SET search_path = ''` (adapter le corps si besoin, noms qualifies `public.`).

### 5.3 Back (meubly-back)

- **Middlewares**
  - `requireAuth` : 401 sur header absent, jeton absent ou invalide/expire ; 403 si le compte est
    bloque (`user.banned_until` dans le futur), verifie explicitement a chaque requete pour qu'un blocage
    prenne effet immediatement sans attendre l'expiration du jeton ; place `req.user`.
  - `requireAdmin` : lit le role via un repository (`profileRepository.findRoleByUserId`), plus de
    `supabase.from` dans le middleware (regle des couches) ; 403 si role different de `ADMIN`.
- **Routes**
  - `requireAuth, requireAdmin` sur toute ecriture de `/categories`, `/providers`, `/furnitures`
    et sur tout `/users`.
  - `favorites.js` : `requireAuth` monte par route (ou sur le prefixe `/favorites`), plus de `router.use` global.
  - Suppression de `routes/v1/auth.js`, `authController.js`, `authService.js` et de la dependance `bcrypt`.
  - `/users` (admin) :
    - `GET /users?q=&page=` : liste paginee (profil + email + statut bloque + date d'inscription), recherche sur email/username.
    - `GET /users/:id` : detail.
    - `POST /users/:id/block` et `POST /users/:id/unblock` : `supabase.auth.admin.updateUserById` avec `ban_duration`
      (valeur longue pour bloquer, `none` pour debloquer). Le statut lu est `banned_until`.
    - `DELETE /users/:id` : `supabase.auth.admin.deleteUser` ; profil, favoris et avis partent par cascade.
    - Refus de bloquer ou supprimer son propre compte (400), pour ne pas perdre le seul admin.
    - Plus de `POST /users` ni `PATCH /users/:id`.
  - `providerRepository` remplace par `partnerRepository` (table `partner`), sans changer le contrat HTTP `/providers`.
- **Avis** (`/furnitures/:id/reviews`)
  - `GET` public, pagine, avec resume (moyenne, total, repartition) : logique existante dans `reviewService`.
  - `POST` (auth) : upsert sur `(user_id, furniture_id)` ; `authorName` retire du validateur ; le nom affiche
    est joint depuis `profile.username`.
  - `DELETE /furnitures/:id/reviews/me` (auth) : supprime son avis.
  - `DELETE /reviews/:reviewId` (admin) : supprime n'importe quel avis.
  - Validation `furniture_id` en UUID ; 404 si le meuble n'existe pas.
- **IA (SSRF)** : le client envoie `furnitureId` au lieu de `imageUrl` ; le back lit l'image de couverture du
  meuble en base, puis verifie l'hote contre une liste blanche configurable (par defaut `www.ikea.com`
  et l'hote Supabase Storage du projet), protocole `https` (sauf hote local en dev), pas de redirection
  suivie, taille maximale (ex. 10 Mo) et type `image/*`. `prompt` : chaine 3 a 200 caracteres.
  Le correctif Docker `localhost -> kong` est conserve uniquement hors production.
- **Rate limiting** (`express-rate-limit`, nouvelle dependance, version stable a verifier) :
  `app.set("trust proxy", 1)` (Render) ; limite globale sur `/api/v1` ; limite stricte par utilisateur sur
  `/ai/generate-scene` (cout Replicate) et sur les ecritures d'avis. Store memoire (une seule instance Render).
  La connexion et l'inscription passent par Supabase Auth, qui a ses propres limites.
- **Erreurs** : `errorHandler` renvoie un message generique pour tout 5xx ; les messages 4xx viennent
  d'erreurs levees par notre code (`statusCode`). Les repositories levent sans exposer `error.message` Supabase.
  `stack` jamais renvoyee hors developpement.
- **npm audit** : correctifs sans version majeure, back et front.

### 5.4 Front (meubly-front)

- `authApi.registerUser` : `signUp` avec `username`/`lastname` en `options.data` ; plus d'insertion de profil,
  plus de bcryptjs (dependance retiree).
- Lecture du profil (role, username) : inchangee, autorisee par la politique "lire son profil".
- Admin users : appels via `src/api/*` (nouveau module ou `userApi` existant) avec jeton Bearer et `apiBase` ;
  liste avec recherche, statut, actions bloquer / debloquer / supprimer avec confirmation ;
  suppression de `createView.vue` et de sa route ; `updateView.vue` devient une vue detail en lecture seule
  (ou est supprimee si la liste suffit : au choix du builder).
- Admin providers / furnitures : verifier que les appels envoient le jeton (sinon 401 apres la phase).
- Avis sur la fiche produit : reactiver `ProductReviews` (composant existant) branche sur l'API ; formulaire
  pour l'utilisateur connecte (note obligatoire, commentaire facultatif, compteur 1000), modification et
  suppression de son avis, moyenne et nombre d'avis. Accessibilite : note au clavier, labels, messages d'erreur lies.
- IA : `generateLifestyleImage(furnitureId, prompt)`.

### 5.5 Configuration hors code (actions du proprietaire, guidees)

- Activer la protection des mots de passe compromis dans Supabase Auth si le plan gratuit le permet (a verifier ;
  sinon documenter la limite).
- Planifier la mise a jour Postgres proposee par Supabase (tableau de bord).
- Render : Health Check Path `/api/v1/health` ; supprimer `GEMINI_API_KEY` devenue inutile.
- `render.yaml` supprime (Render ne l'utilise pas ; deja supprime dans l'arbre de travail).

### 5.6 Tests (TDD)

- Back unitaires (supertest, Supabase mocke) : pour chaque route d'ecriture, 401 sans jeton, 401 jeton invalide,
  403 utilisateur non admin, succes admin. Route inconnue sous `/api/v1` -> 404 (plus 401). Validation avis et IA
  (400). Liste blanche SSRF (hote refuse, protocole refuse, taille, type). `errorHandler` sans fuite sur 5xx.
  Refus d'auto-blocage / auto-suppression.
- Base (`npm run test:db`, stack locale, garde `assertLocalSupabase`) : migrations appliquees sur la stack locale,
  puis verification des politiques avec des clients `anon` et `authenticated` (jetons de deux utilisateurs) :
  un utilisateur ne lit ni le profil ni les favoris d'un autre, `anon` ne lit pas `profile`, personne n'ecrit le
  catalogue, le trigger cree le profil avec `USER` meme si les metadonnees demandent `ADMIN`, cascade a la
  suppression d'un compte. Teardown reel de `favorites.db.test.js`.
- Front : tests unitaires des modules `src/api` modifies ; `npm run build`.
- Fin de phase : advisors securite prod sans ERROR apres application (avec accord).

### 5.7 Deploiement

Ordre : (1) tests verts en local ; (2) accord explicite ; (3) migrations appliquees en prod via MCP ;
(4) deploiement back (Render) et front (Vercel) par fusion de la PR ; (5) advisors + verification manuelle.
Le back actuel en prod continue de fonctionner apres la migration (service role, et la colonne `password_hash`
n'est ecrite que par le front d'inscription : une inscription entre (3) et (4) echouerait sur l'insertion de
profil). Fenetre courte acceptee, ou appliquer la suppression de `password_hash` dans une migration posterieure
au deploiement front : choix du builder, documente dans le plan.

Orphelins `profile` en prod (verifie le 2026-10-19) : 14 profils sans compte Auth. 6 ont l'email d'un compte
Auth qui possede deja son propre profil (doublons) ; 8 ne correspondent a aucun compte, dont l'unique profil
`ADMIN`. Aucun favori ne leur est rattache. **Decision du proprietaire : les 14 sont supprimes** par la migration
de nettoyage, avant l'ajout de la FK. La condition de suppression est "aucun compte `auth.users` pour ce
`user_id`", pas une liste d'identifiants en dur.

Bootstrap admin : apres la migration, aucun admin n'existe. Le proprietaire passe `role` a `ADMIN` sur son propre
profil depuis le tableau de bord Supabase (etape guidee, entre (3) et (5)). Aucun code ne transmet ni n'attribue
le role admin.

## 6. Laisse au builder

- Decoupage exact des migrations et des taches, nommage des fichiers.
- Valeurs exactes des limites de debit et de la taille maximale d'image.
- Forme de la reponse JSON de la liste admin (en restant compatible avec la pagination existante du front).
- Vue detail utilisateur conservee ou non.
- Alignement du code avis existant (`product_id`, `author_name`) sur le schema `review` defini ici.
- Recuperation du statut bloque pour la liste admin (`auth.admin.listUsers` fusionne avec `profile`, ou autre).

## 7. Choix faits par Claude (a verifier a la lecture)

- Le role reste en majuscules (`USER`/`ADMIN`) car le front compare deja a `"ADMIN"`.
- Suppression des routes back `/auth/*` (aucun appelant) plutot que leur correction.
- `profile.email` conserve, synchronise par trigger, pour la recherche admin.
- Le front continue de lire son propre profil via le SDK (politique RLS dediee) ; pas de nouvel endpoint `/me` en phase 1.
- Remplacement de `imageUrl` par `furnitureId` pour l'IA, plutot qu'une simple liste blanche sur une URL libre.
- Blocage effectif immediatement (verification dans `requireAuth`).
- Refus de se bloquer ou se supprimer soi-meme.
- `pg_trgm` et l'exposition GraphQL (WARN) laisses pour la phase 2 ; critere de fin = aucune ERROR.

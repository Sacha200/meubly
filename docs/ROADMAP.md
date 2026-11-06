# Feuille de route Meubly

Etabli le 2026-10-15 apres audit. Chaque phase = une branche + une PR. Le plan d'implementation detaille (taches, tests) d'une phase est ecrit au demarrage de celle-ci, pas avant : les phases suivantes dependent de ce qu'on apprend.

## Constat de depart

- Securite : RLS desactive sur les 9 tables cloud ; routes `/users`, `/providers`, `/categories` en ecriture sans auth ; `requireAdmin` et `providerRepository` pointent sur des tables inexistantes ; SSRF dans `aiController` ; `password_hash` duplique.
- Qualite : back 10 tests OK / 1 suite KO, front 11/21 KO, aucun lint actif, pas de CI, schema cloud non versionne.
- Produit : 99,5 % des meubles n'ont qu'une offre (IKEA). Prix figes depuis mars 2026. Le comparateur ne compare pas encore.

## Phase 0 - Hygiene (fondations de travail)

Objectif : pouvoir modifier le code en confiance.

Statut : realisee le 2026-10-16 sur `chore/phase-0-hygiene` (plan : `docs/superpowers/plans/2026-10-15-phase-0-hygiene.md`). Restent hors phase : nettoyage partenaires (phase 2), `.env.example`.

- Separer `app.js` (app Express exportee) et `server.js` (listen) ; adapter `npm start`, Dockerfile, `render.yaml`.
- Reecrire `tests/unit/api.test.js` front sur l'API actuelle ; isoler le test d'integration favoris (tag `integration`, exclu par defaut).
- ESLint + Prettier fonctionnels back et front (`eslint-plugin-vue`), scripts `lint`.
- CI GitHub Actions : lint + test + build front, sur PR.
- Retirer Auth0, Prisma, bcrypt/bcryptjs non utilises (apres verification des imports).
- Nettoyer partenaires de test et doublon `But`/`BUT` (apres accord, en prod).
- Decider du sort des fichiers non suivis (`bd/catalog_data.sql` 22 Mo -> hors git ou Git LFS ; scripts d'ingestion `.mjs` -> versionner) et de `.env.example`.

Fini quand : `npm run lint && npm run test:run` verts des deux cotes, en CI.

## Phase 1 - Securite (bloquant prod)

Objectif : plus aucune donnee exposee.

Statut : **terminee et en production le 2026-11-04** (plan : `docs/superpowers/plans/2026-10-19-phase-1-security.md`). Code fusionne par la PR #3, migrations 006-010 appliquees en prod, admin nomme, advisors securite sans ERROR, verification manuelle en prod (comptes, blocage, avis, IA, limite de debit). Ajouts pendant la mise en production : mot de passe oublie (PR #4, SMTP Brevo sur le domaine `prixoli.fr`), IP client derriere Cloudflare (`trust proxy 3`, PR #5 et #6), suppression de `pgjwt` (010, PR #7) puis passage de Postgres 15 a 17.11 en prod. Reportes en phase 5 : vulnerabilites `npm audit` exigeant une version majeure (dont `sharp`, runtime).

Points restes ouverts (a reprendre dans la phase indiquee) :
- Advisors WARN : protection des mots de passe compromis (plan Pro, accepte). `pg_trgm` deplace dans `extensions` et `pg_graphql` retire en phase 2 (regle).
- Postgres 17 en prod et en local (stack CLI) depuis la phase 2 (regle).
- Render en Oregon, Supabase a Paris (~140 ms par aller-retour base) : recreer le service en Europe (phase 6).
- Le front lit encore `profile` via le SDK a la connexion (`loginUser`) : a passer par l'API (phase 4).
- `review.updated_at` fixe par un trigger Postgres depuis la phase 2 (regle).
- Bloquer un compte ne ferme pas ses sessions (sans risque : renouvellement refuse, 403 a chaque requete) ; a revoquer explicitement si besoin.
- Scene IA : le modele `stable-diffusion-inpainting` deforme le meuble ; evaluer un modele d'edition qui conserve le produit (phase 4).
- En-tete plus etroit que la page sur la fiche produit a certaines largeurs (phase 4).
- Renommage Meubly -> Prixoli (marque, domaine, emails) : lot separe.

- Matrice de droits role x table x operation (`docs/security-matrix.md`).
- Migration RLS : lecture publique catalogue (`furniture`, `offer` actives, `category`, `partner` actifs, `furniture_image`) ; `favorite` et `profile` limites au proprietaire ; ecritures reservees service role. Teste d'abord sur une branche Supabase.
- `requireAuth` + `requireAdmin` sur toutes les ecritures ; `requireAdmin` lit `profile.role` ; role contraint (`CHECK role in ('USER','ADMIN')`).
- Suppression de `profile.password_hash` (et du hash cote front).
- `profile.user_id` -> FK `auth.users ON DELETE CASCADE`.
- SSRF : liste blanche de domaines pour `imageUrl` + limite de taille.
- Rate limiting (auth, IA), erreurs sans fuite de message Supabase, `search_path` fige sur `update_nb_offers`, protection mots de passe compromis activee.
- `npm audit` : correctifs sans changement de version majeure.

Fini quand : advisors Supabase securite sans ERROR, tests d'autorisation (401/403) sur chaque route d'ecriture.

## Phase 2 - Modele de donnees du comparateur

Objectif : un schema qui porte le metier, versionne.

Statut : **terminee et en production le 2026-11-06** (spec : `docs/superpowers/specs/2026-11-04-phase-2-data-model-design.md`, plan : `docs/superpowers/plans/2026-11-04-phase-2-data-model.md`, PR #9 a #22). Supabase CLI 2.122.1 en local (PG 17), baseline tiree de la prod et 7 migrations poussees ; `db diff` local vs prod vide (hors une ligne de privileges par defaut du role `postgres`, acceptee). Donnees de demo retirees de la prod (140 offres, 15 partenaires, 19 meubles). Offre enrichie (`status`, livraison, total, eco-participation, disponibilite, delais, etat, vendeur), identifiants du meuble (GTIN, marque, poids, attributs), `partner.is_affiliate`, historique des prix, caches et `updated_at` par triggers, `click_out` et `ingestion_run`. API `/furnitures/:id/offers` triee par prix total. Diagrammes : `docs/diagrams/data-model.md`, `offer-states.md`, `ingestion-flow.md`.

Points restes ouverts (a reprendre dans la phase indiquee) :
- `bd/ingestion/*` ecrit encore `offer.is_active` (supprimee) et les caches : a reecrire selon `docs/diagrams/ingestion-flow.md` (phase 3). Ne pas le lancer d'ici la.
- 3 449 meubles sur 7 898 sans aucune dimension, 1 093 sans categorie (invisibles en navigation par categorie), 1 sans offre : a combler par l'ingestion (phase 3).
- `partner_product` (dont `raw_payload`) reste en lecture publique via `catalog_read` : a reevaluer (donnees internes, phase 3).
- `partner.api_key_hash` non utilise : a reevaluer (phase 3).
- Purge des `click_out` de plus de 13 mois : a planifier avec l'ingestion (phase 3). Aucun point d'API n'ecrit encore de clic (phase 4).
- Front : `TableComparison.vue` retrie les offres du plus cher au moins cher (defait le tri du back) et impose 2 s de chargement ; les nouveaux champs (livraison, total, affilie) ne sont pas affiches (phase 4).
- Formulaire admin partenaire sans la case `isAffiliate` (phase 4).
- `meubly-back/scripts/sync_offers.js` vise les anciennes tables `Furniture` / `offers` : script mort a supprimer.
- Tests unitaires du back : depassements de delai de 5 s en local sur machine chargee (`app.test.js`, `rateLimit.test.js`, `aiScene.test.js`), verts en CI.
- Avertissement prod "collation version mismatch" (2.39 vs 2.40) depuis le passage a PG 17 : `REFRESH COLLATION VERSION` a planifier (phase 6).

Perimetre initial :
- Baseline des migrations depuis l'etat cloud reel (Supabase CLI), historique de migrations aligne local/cloud.
- Nouvelles tables : `price_history` (offer_id, price, observed_at), `ingestion_run` (partner, statut, compteurs, erreurs), `click_out` (offer_id, at, user_id nullable).
- Index : `offer(furniture_id)`, `offer(partner_id)`, unique `offer(furniture_id, partner_id)`, index trigram sur `furniture.title` pour la recherche.
- Contraintes : `price >= 0`, statut d'offre (active / perimee / retiree) avec `last_seen_at`.
- Diagrammes mis a jour dans `docs/diagrams/` (classe, C4, flux d'ingestion, etats d'offre).

Fini quand : `supabase db reset` local reproduit la prod ; advisors performance sans FK non indexee.

## Phase 3 - Pipeline multi-marchands (partie a reconstruire)

Objectif : plusieurs offres reelles par meuble, fraiches.

- Interface d'adaptateur par partenaire (fetch -> normaliser -> `partner_product`).
- Rapprochement `partner_product` -> `furniture` : EAN/ref fabricant si dispo, sinon similarite titre + dimensions + marque, avec score ; file de validation admin sous un seuil.
- Upsert `offer` (statut, `last_seen_at`, conditions d'achat) ; `price_history` et `cached_min_price` / `cached_nb_offers` suivent par trigger depuis la phase 2. Flux cible : `docs/diagrams/ingestion-flow.md`.
- Execution planifiee (pg_cron / Edge Function / service ingestion) avec trace dans `ingestion_run`.
- Ecran admin "Superviser les flux" (runs, erreurs, produits non rapproches).
- Cible initiale : 2 a 3 marchands de plus qu'IKEA, choisis selon les flux accessibles legalement (affiliation, API, flux produits).

Fini quand : X % du catalogue cible avec >= 2 offres (seuil a fixer), prix de moins de 24 h.

Decision ouverte : sources de donnees (scraping vs flux d'affiliation type Awin/Effiliation). Impact juridique et de maintenance, a trancher avant la phase.

## Phase 4 - Experience front

Objectif : un comparateur rapide, accessible et distinctif.

- Front 100 % via API back pour les donnees (Supabase SDK = auth seulement).
- Page produit : tableau comparatif clair, historique de prix (courbe), indicateur "bon prix", redirection tracee `GET /out/:offerId`.
- Recherche : pagination serveur, filtres (prix, categorie, marchand, dimensions), etat vide et erreurs.
- Performance : code splitting des routes, polices en woff2 auto-hebergees (TTF actuels ~800 Ko), images responsives, cible LCP < 2,5 s.
- Accessibilite RGAA AA : audit `web-design-guidelines` + corrections, tests Cypress clavier.
- Favoris : source unique serveur (supprimer la copie localStorage).
- Fonctionnalite differenciante a choisir (alerte prix, "ce meuble rentre-t-il chez moi" via dimensions, scene IA).

## Phase 5 - Montees de version majeures

Une par PR, apres que la CI protege : Vite + plugin-vue, Vitest, Pinia, Tailwind 4, PrimeVue 3 -> 4/5 (la plus lourde), Express 5, Zod 4.

## Phase 6 - Exploitation

Supervision (logs structures, erreurs front type Sentry), sauvegardes, service back en Europe (Render), documentation de deploiement par environnement, ADR dans `docs/adr/`.

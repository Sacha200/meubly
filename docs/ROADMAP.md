# Feuille de route Meubly

Etabli le 2026-10-15 apres audit. Chaque phase = une branche + une PR. Le plan d'implementation detaille (taches, tests) d'une phase est ecrit au demarrage de celle-ci, pas avant : les phases suivantes dependent de ce qu'on apprend.

## Constat de depart

- Securite : RLS desactive sur les 9 tables cloud ; routes `/users`, `/providers`, `/categories` en ecriture sans auth ; `requireAdmin` et `providerRepository` pointent sur des tables inexistantes ; SSRF dans `aiController` ; `password_hash` duplique.
- Qualite : back 10 tests OK / 1 suite KO, front 11/21 KO, aucun lint actif, pas de CI, schema cloud non versionne.
- Produit : 99,5 % des meubles n'ont qu'une offre (IKEA). Prix figes depuis mars 2026. Le comparateur ne compare pas encore.

## Phase 0 - Hygiene (fondations de travail)

Objectif : pouvoir modifier le code en confiance.

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

- Baseline des migrations depuis l'etat cloud reel (Supabase CLI), historique de migrations aligne local/cloud.
- Nouvelles tables : `price_history` (offer_id, price, observed_at), `ingestion_run` (partner, statut, compteurs, erreurs), `click_out` (offer_id, at, user_id nullable), `review` (absente du cloud).
- Index : `offer(furniture_id)`, `offer(partner_id)`, unique `offer(furniture_id, partner_id)`, index trigram sur `furniture.title` pour la recherche.
- Contraintes : `price >= 0`, statut d'offre (active / perimee / retiree) avec `last_seen_at`.
- Diagrammes mis a jour dans `docs/diagrams/` (classe, C4, flux d'ingestion, etats d'offre).

Fini quand : `supabase db reset` local reproduit la prod ; advisors performance sans FK non indexee.

## Phase 3 - Pipeline multi-marchands (partie a reconstruire)

Objectif : plusieurs offres reelles par meuble, fraiches.

- Interface d'adaptateur par partenaire (fetch -> normaliser -> `partner_product`).
- Rapprochement `partner_product` -> `furniture` : EAN/ref fabricant si dispo, sinon similarite titre + dimensions + marque, avec score ; file de validation admin sous un seuil.
- Upsert `offer` + insertion `price_history` + recalcul `cached_min_price` en transaction.
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

Supervision (logs structures, erreurs front type Sentry), sauvegardes, upgrade Postgres cloud, documentation de deploiement par environnement, ADR dans `docs/adr/`.

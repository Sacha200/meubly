# Phase 3 - Comparateur multi-marchands : plan d'implementation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Des articles identiques (meme EAN) compares entre quatre marchands independants, regroupes en produits a variantes, collectes chaque jour, supervises par l'admin et montres par une nouvelle liste et une fiche produit v2 sous la marque Prixoli.

**Architecture:** Une table `product` regroupe les `furniture` (variantes). Une collecte Node dans `meubly-back/ingestion/` lit les marchands par adaptateur (`shopify`, `nordicnest`), rapproche par EAN exact et ecrit `partner_product` / `offer` ; les triggers de la phase 2 tiennent les caches et l'historique. Le back expose produits, historique, clic sortant et supervision ; le front construit les nouvelles pages sous des routes non liees, puis une bascule finale les branche, lance la collecte en prod et retire IKEA.

**Tech Stack:** Supabase CLI 2.122.1 (`npx supabase@2.122.1`), Postgres 17, Node 22, Express 4 ESM, supabase-js 2, Vitest 3 + supertest, Vue 3 + Pinia + PrimeVue 3 + Tailwind 3, Cypress 13, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-15-phase-3-comparateur-multi-marchands-design.md`

## Global Constraints

- Une tache a la fois, chacune sur sa branche (`feat/...`, `chore/...`) partie de `master` a jour, PR vers `master` fusionnee par le proprietaire avant la tache suivante. Pas de PR empilee. Cocher les cases du plan dans la meme PR.
- AUCUNE ecriture sur le projet cloud `rlxyptqvtpdhrdpdoiwy` sans accord explicite du proprietaire juste avant, pour cette ecriture-la. `db push` prod : lance par le proprietaire (`! npx -y supabase@2.122.1 db push --linked --yes`) apres un `--dry-run` qui montre exactement la migration attendue.
- Ne jamais lire ni afficher `.env`. Ne jamais lancer `bd/ingestion/*`. Ne jamais `docker compose down --remove-orphans`.
- Collecte : respect de `robots.txt`, au plus 1 requete / 2 s par site, pause 60 s sur 429, arret de l'adaptateur sur 403 ou page de controle. Aucun contournement. Agent : `PrixoliBot/1.0 (+<URL>)`, URL lue dans `INGEST_BOT_URL` (defaut `https://github.com/Sacha200/meubly` jusqu'a la tache 12).
- Rapprochement automatique par EAN valide (cle GTIN) uniquement. Sans EAN : aucune creation, aucune offre publiee.
- L'ingestion n'ecrit jamais `cached_min_price`, `cached_nb_offers`, `price_history`, `updated_at`.
- Prix barre marchand (`compare_at_price`) : ni stocke ni affiche.
- Migrations : `npx supabase@2.122.1 migration new <nom>`, idempotentes, fonctions avec `SET search_path = ''` et noms qualifies, RLS dans la meme migration pour toute nouvelle table, terminees par `NOTIFY pgrst, 'reload schema';`. `docs/security-matrix.md` et `docs/diagrams/data-model.md` mis a jour dans la meme PR.
- Back : couches routes -> controllers -> services -> repositories ; seuls les repositories appellent Supabase ; validation express-validator a la route ; erreurs avec `statusCode`. Reponses JSON en snake_case, comme les routes `furnitures` existantes.
- Front : nouveaux composants en `<script setup>`, HTTP dans `src/api/*` re-exporte par `src/clientapi.js`, aucun `supabase.from()`, aucune couleur en dur (tokens), labels / focus visible / clavier.
- Aucune dependance npm ajoutee.
- Tests des adaptateurs : sur fichiers enregistres dans `meubly-back/tests/fixtures/ingestion/`, aucun appel reseau.
- Avant chaque PR : `npm run lint`, `npm run format:check`, `npm run test:run` (back et front), `npm run test:db` si la base est touchee, `npm run build` front si le front est touche, puis `graphify update .`.
- Commits conventionnels termines par `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`.

## Review Focus

1. EAN range dans `sku` au lieu de `barcode`, ou `barcode` a 13 chiffres dont la cle est fausse : le premier est pris comme EAN, le second traite comme "sans EAN" (taches 2 et 3).
2. Deux variantes d'un meme marchand portant le meme EAN : une seule offre (la premiere), l'autre notee dans `ingestion_run.errors`, pas de plantage sur `offer_unique_listing` (tache 4).
3. Execution interrompue par un 403 au milieu du catalogue : statut `failed`, aucune offre perimee (tache 4).
4. `GET /out/:offerId` pour une offre `stale` / `removed`, un identifiant inconnu, ou une URL qui n'est pas `http(s)` : 404, aucune redirection, aucun `click_out` (tache 8).
5. Produit dont toutes les offres sont perimees : absent de la liste ; sa fiche ouverte par lien direct affiche "Plus d'offre pour le moment" au lieu d'une erreur (taches 7 et 12).

---

## Fichiers

- Back, collecte : `meubly-back/ingestion/{gtin.js, text.js, politeFetch.js, brands.js, categoryMap.js, match.js, run.js, cli.js}`, `meubly-back/ingestion/adapters/{index.js, shopify.js, nordicnest.js}`, `meubly-back/repositories/ingestionRepository.js`.
- Back, API : `meubly-back/repositories/{productRepository.js, priceHistoryRepository.js, clickOutRepository.js}`, `meubly-back/services/{productService.js, outService.js, ingestionAdminService.js}`, `meubly-back/controllers/{productController.js, outController.js, ingestionAdminController.js}`, `meubly-back/routes/v1/{products.js, out.js, adminIngestion.js}`, modifies : `routes/v1.js`, `middlewares/rateLimit.js`, `repositories/offerRepository.js`, `package.json`.
- Base : `supabase/migrations/<ts>_{product_variants, ingestion_matching, product_summary, phase3_contract}.sql`, `supabase/seed.sql`.
- Front : `src/api/{productsApi.js, ingestionAdminApi.js}`, `src/views/{ProductListView.vue, ProductView.vue, AboutPricesView.vue}`, `src/views/Admin/flux/listView.vue`, `src/components/Catalog/{ProductTile.vue, CatalogFilters.vue}`, `src/components/Product/{ProductHero.vue, VariantPicker.vue, OfferList.vue, PriceHistoryChart.vue, SpecTable.vue, SimilarProducts.vue, AiScenePanel.vue}`, `src/components/BrandLogo.vue`, modifies : `router/index.js`, `AppHeader.vue`, `AppFooter.vue`, `index.html`, `config/themeColors.js`, `tailwind.config.js`, `Admin/provider/ProviderForm.vue`, composants `Home/*`.
- CI : `.github/workflows/{ingest-probe.yml (tache 0, supprime en tache 13), ingest.yml}`.
- Supprimes a la bascule : `bd/ingestion/`, service `ingestion` de `docker-compose.yml`, `ResultatRechercheView.vue`, `ProductDetailView.vue`, `components/Detail/{ProductDetail.vue, TableComparison.vue}`, composants `Filters/*` s'ils ne sont plus importes.

---

### Task 0: Porte de decision (mesure, aucun code produit)

Branche `chore/phase-3-gate`. Travail dans `.superpowers/spike-phase3/` (non versionne), sauf le workflow de sonde.

**Files:**
- Create: `.github/workflows/ingest-probe.yml`
- Modify: la spec (section 2.2 et 8) avec les chiffres mesures

- [x] **Step 1 :** Dans les scripts du spike, remplacer l'agent par `PrixoliBot/1.0 (+https://github.com/Sacha200/meubly)` et relancer `access-check.mjs` sur `www.connox.fr www.fleux.com thecoolrepublic.com www.nordicnest.fr`. Attendu : `robots` 200 et `home` 200 pour les quatre. Un refus = retour proprietaire. *Fait : refus de The Cool Republic (defi Cloudflare) ; decision proprietaire : demande d'autorisation, depart a trois marchands.*
- [x] **Step 2 :** Collecter les catalogues complets : `/products.json` pagine pour The Cool Republic (Connox et Fleux sont deja dans `data/catalog-*.json`), tous les plans de site Nordic Nest (URL `/marques-de-design/<marque>/<fiche>/`). Calculer les marques presentes chez au moins 2 marchands (meme normalisation que `norm` de `match.mjs`). *Fait sans The Cool Republic (bloque) : 79 marques communes.*
- [x] **Step 3 :** Pour ces marques seulement, lire les fiches (`.js` Shopify, page Nordic Nest) a 1 requete / 2 s avec cache disque, puis compter les EAN valides vus chez au moins 2 marchands. Sortie attendue : un tableau marchand x (fiches lues, variantes, % avec EAN) et le nombre d'articles comparables, ventile par paire de marchands. *Fait par echantillon (300 fiches Nordic Nest tirees au hasard) plutot que par lecture complete (environ 15 h) : environ 3 100 fiches comparables, presque toutes Connox x Nordic Nest (spec 2.2).*
- [x] **Step 4 :** Ecrire `ingest-probe.yml` : `workflow_dispatch` seulement, Node 22, un script en ligne qui lit `robots.txt` et une page de catalogue par marchand avec l'agent declare et affiche les codes HTTP. Le proprietaire le lance depuis l'onglet Actions. Attendu : 200 partout. *Fait : 200 partout sauf The Cool Republic (403, defi).*
- [x] **Step 5 : PORTE.** Moins de 300 articles comparables, ou un refus (agent declare ou GitHub Actions) : arret, compte rendu chiffre au proprietaire. Sinon : reporter les chiffres dans la spec (2.2 et critere de la section 8), noter la duree de lecture de Nordic Nest (elle fixe `maxPagesPerRun` de la tache 5), commit, PR.

### Task 1: Schema additif (produit, variantes, file de rapprochement)

Branche `feat/product-variants-schema`.

**Files:**
- Create: `supabase/migrations/<ts>_product_variants.sql`
- Modify: `supabase/seed.sql`, `meubly-back/tests/db/schema.db.test.js`, `meubly-back/tests/db/rls.db.test.js`, `docs/security-matrix.md`, `docs/diagrams/data-model.md`

**Interfaces (produit pour les taches suivantes) :**
- `public.product (product_id uuid PK default gen_random_uuid(), brand text, title text NOT NULL, description text, designer text, cover_url text, created_at timestamptz NOT NULL default now())`, lecture `anon`/`authenticated`, ecriture service role, index trigram sur `title`.
- `furniture.product_id uuid NULL REFERENCES product ON DELETE SET NULL` (index), `furniture.variant_label text`.
- `partner.adapter text NULL CHECK (adapter IN ('shopify','nordicnest'))`, `partner.adapter_config jsonb NOT NULL default '{}'`. `partner.api_key_hash` supprimee.
- Enum `match_status ('pending','accepted','rejected')` ; `public.match_candidate (match_candidate_id bigint identity PK, partner_product_id uuid NOT NULL REFERENCES partner_product ON DELETE CASCADE, furniture_id uuid NOT NULL REFERENCES furniture ON DELETE CASCADE, score numeric(4,3) NOT NULL, reason text, status match_status NOT NULL default 'pending', decided_by uuid REFERENCES auth.users ON DELETE SET NULL, decided_at timestamptz, created_at timestamptz NOT NULL default now(), UNIQUE (partner_product_id, furniture_id))`, RLS active, droits `anon`/`authenticated` retires.
- `partner_product` : politique `catalog_read` supprimee et droits `anon`/`authenticated` retires.
- Categories racines ajoutees si absentes (par `label`) : Salon, Chambre, Bureau, Cuisine et salle a manger, Salle de bain, Jardin et exterieur, Luminaires, Decoration, Rangement, Enfant, Autres.

- [x] **Step 1 :** Verifier que rien ne lit ce qu'on retire : `grep -rn "api_key_hash\|partner_product" meubly-back meubly-front/src --include=*.js --include=*.vue` hors `node_modules` et tests. Attendu : `api_key_hash` seulement dans `tests/unit/adminRoutes.test.js` (a adapter), `partner_product` seulement dans des repositories (service role).
- [x] **Step 2 : tests en echec.** Dans `schema.db.test.js` : `product` existe avec ses colonnes ; `furniture.product_id` et `variant_label` existent ; `partner.adapter = 'autre'` est refuse ; `partner.api_key_hash` n'existe plus ; les 11 categories racines existent. Dans `rls.db.test.js` : `anonClient()` lit `product` ; `anonClient()` obtient 0 ligne ou une erreur de droit sur `partner_product` et `match_candidate` ; `anonClient()` ne peut pas inserer dans `product`.
- [x] **Step 3 :** `npm run test:db`. Attendu : echec sur les nouveaux tests.
- [x] **Step 4 :** Ecrire la migration selon le bloc Interfaces. Completer `seed.sql` : 2 produits a 2 variantes chacun avec `gtin` valides, 2 partenaires avec `adapter = 'shopify'`, des offres chez les deux pour au moins une variante.
- [x] **Step 5 :** `npx supabase@2.122.1 db reset` puis `npm run test:db` et `npm run test:run`. Attendu : tout vert.
- [x] **Step 6 :** Mettre a jour matrice et diagramme. Commit, PR. Le `db push` prod attend la reprise du projet et l'accord du proprietaire ; il peut etre fait a n'importe quel moment avant la tache 14 (migration additive).

### Task 2: Socle de collecte (EAN, texte, requetes polies)

Branche `feat/ingestion-core`.

**Files:**
- Create: `meubly-back/ingestion/gtin.js`, `text.js`, `politeFetch.js`
- Test: `meubly-back/tests/unit/ingestion/{gtin,text,politeFetch}.test.js`

**Interfaces (produit) :**
- `isGtin(value: unknown): boolean` : 8, 12, 13 ou 14 chiffres avec cle de controle juste.
- `pickGtin(...candidates: unknown[]): string | null` : premier candidat valide apres `String().trim()`.
- `normText(s: string): string` : minuscules, sans accents, `&` retire, tout non alphanumerique en espace, espaces reduits.
- `createPoliteFetch({ botUrl?: string, delayMs?: number = 2000, fetchImpl?: typeof fetch, sleep?: (ms) => Promise<void> }): (url: string) => Promise<string>` :
  - envoie `User-Agent: PrixoliBot/1.0 (+botUrl)` ;
  - lit `robots.txt` une fois par hote ; URL interdite pour `*` ou `prixolibot` -> leve `BlockedError` ;
  - attend `delayMs` entre deux requetes du meme hote ;
  - 429 : attend 60 000 ms et reessaie, 3 fois au plus, puis leve ;
  - 403, ou corps contenant `captcha|datadome|cf-chl` avec moins de 20 000 caracteres : leve `BlockedError` ;
  - autre statut non 2xx : leve `HttpError` portant `status`.
- `class BlockedError extends Error`, `class HttpError extends Error { status }`.

- [x] **Step 1 : tests en echec.**
  - `gtin` : `isGtin("5710441280323") === true` ; `isGtin("5710441280324") === false` ; `isGtin("510960116082") === false` ; `isGtin("AB450-A996")`, `isGtin(null)` faux ; `pickGtin("B9926429-500", "5400959200004") === "5400959200004"` ; `pickGtin("", undefined) === null`.
  - `text` : `normText("&Tradition  Été") === "tradition ete"`.
  - `politeFetch` (avec `fetchImpl` et `sleep` simules) : l'en-tete `User-Agent` vaut `PrixoliBot/1.0 (+https://x.test)` ; `robots.txt` avec `Disallow: /prive` rejette `/prive/a` par `BlockedError` sans appeler la page ; deux URL du meme hote declenchent `sleep(2000)` ; un 429 puis un 200 renvoie le corps apres `sleep(60000)` ; un 403 leve `BlockedError` ; un 500 leve `HttpError` avec `status === 500` ; `robots.txt` en 404 autorise tout.
- [x] **Step 2 :** `npm run test:run -- ingestion`. Attendu : echec (modules absents).
- [x] **Step 3 :** Implementer les trois modules. Rien a l'import (pas d'appel reseau, pas de minuterie).
- [x] **Step 4 :** `npm run test:run`. Attendu : vert. Commit, PR.

### Task 3: Adaptateur Shopify

Branche `feat/ingestion-shopify`.

**Files:**
- Create: `meubly-back/ingestion/adapters/shopify.js`, `meubly-back/ingestion/adapters/index.js`
- Create: `meubly-back/tests/fixtures/ingestion/shopify/{products-page1.json, products-page2.json, product-connox.js.json, product-fleux.js.json}` (extraits reels du spike, 2 a 3 produits chacun, page 2 vide)
- Test: `meubly-back/tests/unit/ingestion/shopify.test.js`

**Interfaces :**
- Consomme : `pickGtin`, `isGtin`, `normText`, `createPoliteFetch`.
- Produit le contrat d'adaptateur, commun a tous :

```js
/**
 * @typedef {Object} ScrapedItem
 * @property {string} externalId      identifiant de la variante chez le marchand
 * @property {string} pageId          identifiant de la page produit chez le marchand
 * @property {string} url             URL publique de la variante
 * @property {string} brand
 * @property {string} productTitle    sans la marque ni la variante
 * @property {string} variantLabel    "" si variante unique
 * @property {string|null} gtin       EAN valide ou null
 * @property {string|null} manufacturerRef
 * @property {number} price           euros TTC
 * @property {"in_stock"|"out_of_stock"|"unknown"} availability
 * @property {string[]} images        6 au plus, image de la variante en premier
 * @property {string|null} description  900 caracteres au plus, sans HTML
 * @property {Record<string, string|number>} attributes
 * @property {number|null} weightKg
 * @property {string|null} categoryHint  type ou rayon annonce par le marchand
 */
/**
 * @typedef {Object} Adapter
 * @property {(ctx: AdapterCtx) => Promise<Set<string>>} listBrands   marques normalisees (normText)
 * @property {(ctx: AdapterCtx, brands: Set<string>) => AsyncGenerator<ScrapedItem>} listItems
 * @typedef {{ config: object, fetchText: (url: string) => Promise<string>, knownPages?: Map<string, string> }} AdapterCtx
 */
```
- `adapters/index.js` : `export const adapters = { shopify, nordicnest }` (la cle `nordicnest` arrive en tache 5).
- `adapter_config` Shopify : `{ "baseUrl": "https://www.connox.fr", "stripBrandPrefix": true }` (`stripBrandPrefix` retire le prefixe `MARQUE - ` du titre ; vrai pour Connox seulement).
- `ctx.knownPages` : `pageId -> updated_at` deja vus ; une page dont `updated_at` n'a pas change n'est pas relue en `.js` et ses variantes sont rendues a partir de `products.json` avec `gtin: null` remplace par celui deja connu (voir tache 4, `knownGtins`). Pour rester simple : `knownPages` porte `{ updatedAt, gtins: Record<externalId, string|null> }`.

- [ ] **Step 1 : tests en echec** (`fetchText` simule servant les fixtures) :
  - `listBrands` lit les pages jusqu'a une page vide et renvoie les `vendor` normalises ;
  - `listItems` ne lit en `.js` que les produits dont la marque est dans `brands` ;
  - produit Connox : `productTitle` sans le prefixe `MARQUE - `, `price` en euros (centimes / 100), `gtin` pris dans `barcode`, `availability` selon `available`, `variantLabel === ""` quand le titre de variante est `Default Title`, `url` de la forme `<baseUrl>/products/<handle>?variant=<id>` ;
  - produit Fleux : `gtin` pris dans `sku`, `manufacturerRef` pris dans `barcode` ;
  - variante au `barcode` de 13 chiffres a cle fausse : `gtin === null` ;
  - `compare_at_price` absent de l'objet rendu ;
  - page presente dans `knownPages` avec le meme `updated_at` : aucun appel `.js`, `gtin` repris de `knownPages`.
- [ ] **Step 2 :** lancer, attendu : echec.
- [ ] **Step 3 :** Implementer `shopify.js` (`/products.json?limit=250&page=N`, `/products/<handle>.js`).
- [ ] **Step 4 :** `npm run test:run`. Attendu : vert. Commit, PR.

### Task 4: Rapprochement, ecriture en base, peremption, commande `ingest`

Branche `feat/ingestion-run`.

**Files:**
- Create: `supabase/migrations/<ts>_ingestion_matching.sql`, `meubly-back/ingestion/{brands.js, categoryMap.js, match.js, run.js, cli.js}`, `meubly-back/repositories/ingestionRepository.js`
- Modify: `meubly-back/package.json` (script `"ingest": "node ingestion/cli.js"`), `docs/diagrams/ingestion-flow.md`, `docs/diagrams/offer-states.md` (seuils 3 j / 14 j)
- Test: `meubly-back/tests/unit/ingestion/{brands,categoryMap,match}.test.js`, `meubly-back/tests/db/ingestion.db.test.js`

**Interfaces :**
- Consomme : contrat `Adapter` / `ScrapedItem` (tache 3), tables de la tache 1.
- Migration : fonction `public.find_similar_furniture(p_brand text, p_title text) RETURNS TABLE (furniture_id uuid, score real)` : meubles de meme marque (comparaison insensible a la casse) dont `extensions.similarity(title, p_title) >= 0.6`, 3 au plus, meilleurs d'abord ; execution reservee a `service_role`. Index unique `partner_product (partner_id, external_id)` s'il n'existe pas.
- `brands.js` : `BRAND_ALIASES: Record<string,string>` (ex. `"audo copenhagen" -> "audo"`, `"and tradition" -> "tradition"`, complete avec les ecarts releves en tache 0) ; `canonicalBrand(name: string): string` ; `commonBrands(sets: Set<string>[]): Set<string>` (marques presentes dans au moins 2 ensembles).
- `categoryMap.js` : `categoryLabelFor(item: ScrapedItem): string` rend l'un des 11 libelles racines de la tache 1, par mots-cles sur `categoryHint` puis `productTitle` normalises, `"Autres"` par defaut. Table de mots-cles reprise de `cat()` dans `.superpowers/spike-phase3/build-proto.mjs`, etendue : cuisine / arts de la table -> "Cuisine et salle a manger" ; exterieur / jardin / outdoor -> "Jardin et exterieur" ; vase / miroir / tapis / coussin / bougeoir -> "Decoration".
- `match.js` : `decide(item: ScrapedItem, lookup: { furnitureByGtin: (gtin) => Promise<{furniture_id, product_id}|null>, similar: (brand, title) => Promise<{furniture_id, score}[]> }): Promise<{ action: "attach", furnitureId } | { action: "create" } | { action: "candidate", candidates } | { action: "skip" }>`.
- `ingestionRepository` (seul a toucher Supabase pour la collecte) : `listActiveAdapterPartners()`, `startRun(partnerId)`, `finishRun(runId, { status, seen, created, updated, errors })`, `upsertPartnerProduct(partnerId, item, furnitureId|null)`, `furnitureByGtin(gtin)`, `findSimilar(brand, title)`, `createProduct(item)`, `createFurniture(item, productId, categoryLabel)`, `fillEmptyFields(furnitureId, item)`, `productIdForPage(partnerId, pageId)`, `upsertOffer(furnitureId, partnerId, item, now)`, `addCandidates(partnerProductId, candidates)`, `expireOffers(partnerId, now)`, `knownPages(partnerId)`, `purgeOldClicks(now)`.
- `run.js` : `runPartner({ partner, adapter, brands, repo, fetchText, now }): Promise<{ status: "succeeded"|"partial"|"failed", seen, created, updated, errors }>`.
- `cli.js` : `npm run ingest -- --partner <nom>|--all [--dry-run]`. Refuse de demarrer si `SUPABASE_URL` n'est pas local et que `INGEST_ALLOW_REMOTE` ne vaut pas `1`. `--dry-run` n'ecrit rien et affiche les compteurs.

**Regles fixees :**
- `partner_product.raw_payload` = l'objet `ScrapedItem` sans `description` ni `images`.
- `furniture.title` = `productTitle` suivi de ` - variantLabel` s'il y en a un ; `product.title` = `productTitle` ; `attributes` recoit `item.attributes` ; premiere image -> `cover_url`, toutes -> `furniture_image`.
- Produit d'une variante creee : celui d'une autre variante de la meme page (`productIdForPage`), sinon celui d'un `furniture` deja rattache par EAN sur cette page, sinon nouveau `product`. Deux produits differents trouves pour une meme page : le premier gagne, une entree dans `errors`.
- `fillEmptyFields` ne remplit que les colonnes NULL ou vides, jamais d'ecrasement.
- `upsertOffer` : cle `(furniture_id, partner_id, seller_name NULL, condition 'new')`, `status = 'active'`, `last_seen_at = now`, `shipping_cost` NULL. Deuxieme item du meme marchand sur le meme `furniture` dans une execution : ignore, note dans `errors`.
- `expireOffers` : `active` et `last_seen_at < now - 3 jours` -> `stale` ; `stale` et `last_seen_at < now - 14 jours` -> `removed`. Appele seulement si le statut de l'execution est `succeeded` ou `partial`.
- Statut : `BlockedError` -> `failed` (arret immediat) ; erreurs sur des items isoles -> `partial` ; plus de 20 % d'items en erreur -> `failed`.
- `errors` : 50 entrees au plus, `{ externalId, message }`.

- [ ] **Step 1 : tests unitaires en echec.**
  - `brands` : `commonBrands([new Set(["hay","muuto"]), new Set(["hay"]), new Set(["muuto","gubi"])])` contient `hay` et `muuto`, pas `gubi` ; `canonicalBrand("Audo Copenhagen") === "audo"`.
  - `categoryMap` : "Suspension PH 5" -> `"Luminaires"` ; "Chaise About A Chair" -> `"Salon"` ; "Table de jardin Palissade" -> `"Jardin et exterieur"` (le jardin prime) ; "Objet inconnu" -> `"Autres"`.
  - `match` : EAN connu -> `attach` ; EAN valide inconnu -> `create` ; sans EAN et un similaire -> `candidate` ; sans EAN et aucun similaire -> `skip` ; `similar` n'est jamais appele quand un EAN existe.
- [ ] **Step 2 : tests base en echec** (`ingestion.db.test.js`, adaptateur factice rendant des `ScrapedItem`, partenaires crees par `adminClient()`) :
  - deux marchands, meme EAN : 1 `furniture`, 1 `product`, 2 offres actives, `cached_nb_offers === 2`, `cached_min_price` = le plus petit prix ;
  - deux variantes d'une meme page : 2 `furniture`, meme `product_id` ;
  - item sans EAN : aucune `furniture` creee, une ligne `partner_product` avec `furniture_id` NULL ;
  - item sans EAN proche d'un meuble existant de meme marque : une ligne `match_candidate` `pending` ;
  - relance au meme prix : aucune nouvelle ligne `price_history` ; relance a un autre prix : une ligne de plus ;
  - Review Focus 2 : deux items du meme marchand, meme EAN -> 1 offre, 1 entree dans `errors`, statut `partial` ;
  - Review Focus 3 : adaptateur qui leve `BlockedError` apres 1 item -> statut `failed`, l'offre ancienne (`last_seen_at` il y a 5 jours) reste `active` ;
  - peremption : apres une execution reussie, offre vue il y a 5 jours -> `stale`, vue il y a 15 jours et deja `stale` -> `removed` ;
  - une ligne `ingestion_run` par execution avec `finished_at` et les compteurs.
- [ ] **Step 3 :** lancer les deux suites, attendu : echec.
- [ ] **Step 4 :** Ecrire la migration, puis `brands.js`, `categoryMap.js`, `match.js`, `ingestionRepository.js`, `run.js`, `cli.js`.
- [ ] **Step 5 :** `db reset`, `npm run test:db`, `npm run test:run`. Attendu : vert.
- [ ] **Step 6 : essai reel local.** Creer en local les partenaires Connox, Fleux (`adapter = 'shopify'`), lancer `npm run ingest -- --all`. Attendu : des produits a plusieurs offres visibles dans Studio (:54323), executions `succeeded`. Noter les compteurs dans la PR.
- [ ] **Step 7 :** Mettre a jour les deux diagrammes. Commit, PR.

### Task 5: Adaptateur Nordic Nest

Branche `feat/ingestion-nordicnest`.

**Files:**
- Create: `meubly-back/ingestion/adapters/nordicnest.js`, fixtures `meubly-back/tests/fixtures/ingestion/nordicnest/{sitemapindex.xml, sitemap-0.xml, product-hay.html}` (extraits reels reduits)
- Modify: `meubly-back/ingestion/adapters/index.js`
- Test: `meubly-back/tests/unit/ingestion/nordicnest.test.js`

**Interfaces :** contrat `Adapter` de la tache 3. `adapter_config` : `{ "baseUrl": "https://www.nordicnest.fr", "sitemapIndex": "/api/sitemap/fr-fr/sitemapindex.xml", "maxPagesPerRun": <valeur fixee en tache 0> }`. `ctx.knownPages` porte ici `pageId -> { lastSeenAt }` : les pages sont lues par roulement, jamais vues d'abord, puis les plus anciennes, dans la limite de `maxPagesPerRun`.

- [ ] **Step 1 : tests en echec :**
  - `listBrands` rend les marques tirees des URL `/marques-de-design/<marque>/<fiche>/` (tirets en espaces, `normText`) et ignore les URL de designers et de rayons ;
  - `listItems` ne lit que les fiches des marques demandees ;
  - une fiche a 5 variantes dans son JSON-LD rend 5 items : `gtin` de chaque variante, `brand` "HAY", `price` numerique, `availability` selon `offers.availability`, `pageId` = chemin de la fiche, `externalId` = `sku` ;
  - JSON-LD absent ou illisible : aucun item, pas d'exception ;
  - avec `maxPagesPerRun: 1` et deux fiches dont une connue, seule la fiche jamais vue est lue.
- [ ] **Step 2 :** lancer, attendu : echec. **Step 3 :** implementer. **Step 4 :** `npm run test:run` vert.
- [ ] **Step 5 : essai reel local.** Partenaire Nordic Nest en local, `npm run ingest -- --partner "Nordic Nest"`. Attendu : des `furniture` deja crees par les marchands Shopify gagnent une offre Nordic Nest. Compter en SQL les `furniture` a 2 marchands ou plus et le noter dans la PR. Commit, PR.

### Task 6: API produits et historique de prix

Branche `feat/products-api`.

**Files:**
- Create: `supabase/migrations/<ts>_product_summary.sql`, `repositories/{productRepository.js, priceHistoryRepository.js}`, `services/productService.js`, `controllers/productController.js`, `routes/v1/products.js`
- Modify: `routes/v1.js`, `repositories/offerRepository.js`, `docs/security-matrix.md`
- Test: `tests/unit/productsRoutes.test.js`, `tests/db/products.api.db.test.js`

**Interfaces :**
- Vue `public.product_summary` (`security_invoker = true`, lecture `anon`/`authenticated`) : `product_id, brand, title, cover_url, created_at, min_price` (plus petit prix d'offre active), `best_gap` (plus grand ecart entre l'offre la plus chere et la moins chere d'une meme variante), `nb_partners` (marchands distincts aux offres actives), `nb_variants` (variantes ayant une offre active), `category_ids uuid[]`. Un produit sans offre active n'y figure pas.
- `GET /api/v1/products` : parametres `q` (<= 100 car.), `category` (uuid), `brand` (<= 60 car.), `min_price`, `max_price` (>= 0), `multi` (`true` = `nb_partners >= 2`), `sort` (`price_asc` | `price_desc` | `gap_desc` | `newest`, defaut `gap_desc`), `page` (>= 1, defaut 1), `page_size` (1 a 48, defaut 24). Reponse `{ items: ProductSummary[], total, page, page_size }`. Parametre invalide : 400.
- `GET /api/v1/products/:id` : `{ product: { product_id, brand, title, description, designer, cover_url }, variants: [{ furniture_id, variant_label, gtin, cover_url, images: string[], attributes, size_width, size_height, size_depth, weight_kg, cached_min_price, cached_nb_offers }] }`, variantes triees par `cached_min_price` (NULL en dernier). Inconnu : 404. Produit connu sans offre active : 200 avec ses variantes (`cached_nb_offers = 0`).
- `GET /api/v1/furnitures/:id/price-history` : `{ series: [{ partner_name, points: [{ observed_at, price }] }] }`, offres actives seulement, 365 jours au plus.
- `GET /api/v1/furnitures/:id/offers` : inchange, `last_seen_at` deja present.

- [ ] **Step 1 : tests en echec.** Unitaires (repositories simules, comme `tests/integration/furnitureRoutes.test.js`) : 400 pour `page_size=500`, `sort=xyz`, `category=abc` ; 404 pour un produit inconnu ; valeurs par defaut transmises au service (`page 1`, `page_size 24`, `sort gap_desc`). Base (seed de la tache 1) : la liste rend les 2 produits du seed ; `multi=true` ne rend que celui a 2 marchands ; `q` filtre par titre ; Review Focus 5 : apres passage de toutes les offres d'un produit en `stale`, il disparait de la liste et `GET /products/:id` rend 200 avec `cached_nb_offers = 0` ; l'historique rend une serie par marchand.
- [ ] **Step 2 :** lancer, echec. **Step 3 :** migration puis couches. **Step 4 :** `db reset`, `npm run test:db`, `npm run test:run` verts. Matrice mise a jour. Commit, PR.

### Task 7: Clic sortant

Branche `feat/out-redirect`.

**Files:**
- Create: `repositories/clickOutRepository.js`, `services/outService.js`, `controllers/outController.js`, `routes/v1/out.js`
- Modify: `routes/v1.js`, `middlewares/rateLimit.js`, `repositories/offerRepository.js`, `docs/security-matrix.md`
- Test: `tests/unit/outRoute.test.js`, `tests/db/out.api.db.test.js`

**Interfaces :**
- `GET /api/v1/out/:offerId` : identifiant non uuid -> 400 ; offre absente, non `active`, ou `url_website` qui ne commence pas par `http://` ou `https://` -> 404 ; sinon insere `click_out (offer_id, user_id)` (`user_id` si un jeton valide est present, sinon NULL ; pas d'IP ni d'agent) et repond 302 avec `Location: url_website` et `Referrer-Policy: no-referrer`.
- `outLimiter` dans `rateLimit.js` : 60 requetes par minute et par IP.
- `offerRepository.findActiveById(offerId): Promise<{ offer_id, url_website } | null>`.

- [ ] **Step 1 : tests en echec.** Unitaires : 400, 404 (les trois cas du Review Focus 4, avec verification que `clickOutRepository.insert` n'est pas appele), 302 avec le bon `Location`. Base : un 302 cree exactement une ligne `click_out` ; avec un jeton d'utilisateur de test, `user_id` est renseigne.
- [ ] **Step 2 :** echec. **Step 3 :** implementer. **Step 4 :** suites vertes, matrice. Commit, PR.

### Task 8: API de supervision (admin)

Branche `feat/ingestion-admin-api`.

**Files:**
- Create: `services/ingestionAdminService.js`, `controllers/ingestionAdminController.js`, `routes/v1/adminIngestion.js`
- Modify: `repositories/ingestionRepository.js`, `routes/v1.js`, `routes/v1/provider.js` et `services/providerService.js` (champ `is_affiliate` accepte s'il ne l'est pas deja), `docs/security-matrix.md`
- Test: `tests/unit/adminIngestionRoutes.test.js`, `tests/db/matchCandidates.api.db.test.js`

**Interfaces** (toutes `requireAuth` + `requireAdmin`, garde posee par route) :
- `GET /api/v1/admin/ingestion-runs?limit=50` : `[{ ingestion_run_id, partner_name, status, started_at, finished_at, seen_count, created_count, updated_count, error_count, errors }]`, plus recentes d'abord.
- `GET /api/v1/admin/ingestion-summary` : `[{ partner_id, partner_name, is_active, last_run_status, last_run_at, active_offers, stale_offers }]` et `uncategorized_count` (meubles dans "Autres").
- `GET /api/v1/admin/match-candidates?status=pending` : `[{ match_candidate_id, score, reason, partner_name, external_title, external_url, price, furniture_id, furniture_title, furniture_cover_url }]`.
- `POST /api/v1/admin/match-candidates/:id/accept` : rattache le `partner_product` au meuble, cree l'offre a partir de `raw_payload`, passe le candidat a `accepted` et les autres candidats du meme `partner_product` a `rejected`, renseigne `decided_by` / `decided_at`. Deja decide : 409.
- `POST /api/v1/admin/match-candidates/:id/reject` : `rejected`. Deja decide : 409.

- [ ] **Step 1 : tests en echec.** Unitaires : 401 sans jeton et 403 pour un compte non admin sur les cinq routes ; 409 sur un candidat deja decide. Base : accepter cree une offre active chez le bon marchand et `cached_nb_offers` augmente de 1 ; refuser ne cree rien.
- [ ] **Step 2 :** echec. **Step 3 :** implementer. **Step 4 :** suites vertes, matrice. Commit, PR.

### Task 9: Ecran admin "Flux"

Branche `feat/admin-flux`.

**Files:**
- Create: `meubly-front/src/api/ingestionAdminApi.js`, `src/views/Admin/flux/listView.vue`
- Modify: `src/clientapi.js`, `src/router/index.js` (route `/admin/flux`, meme garde que `/admin/providers`), lien dans le menu admin de `AppHeader.vue`, `src/views/Admin/provider/ProviderForm.vue` (case "Lien affilie")
- Test: `meubly-front/tests/unit/adminFlux.test.js`

**Interfaces :** `listIngestionRuns()`, `getIngestionSummary()`, `listMatchCandidates()`, `acceptMatchCandidate(id)`, `rejectMatchCandidate(id)` dans `ingestionAdminApi.js`, sur le modele de `providersApi.js` (`authFetch`).

Contenu de l'ecran : un tableau par marchand (derniere execution, statut, offres actives / perimees), la liste des 50 dernieres executions avec leurs erreurs depliables, le compteur "sans categorie", et la file des rapprochements (article du marchand avec lien, meuble propose avec image, score, boutons Accepter / Refuser).

- [ ] **Step 1 : tests en echec :** les cinq fonctions appellent la bonne URL et la bonne methode avec l'en-tete d'autorisation ; la vue affiche une ligne par candidat ; un clic sur "Accepter" appelle `acceptMatchCandidate` puis retire la ligne ; une erreur d'API affiche un message et laisse la ligne.
- [ ] **Step 2 :** echec. **Step 3 :** implementer. **Step 4 :** `npm run test:run`, `npm run lint`, `npm run build` verts. Verification visuelle sur la stack locale. Commit, PR.

### Task 10: Liste des produits

Branche `feat/product-list`.

**Files:**
- Create: `src/api/productsApi.js`, `src/views/ProductListView.vue`, `src/components/Catalog/{ProductTile.vue, CatalogFilters.vue}`
- Modify: `src/clientapi.js`, `src/router/index.js` (route `/produits`, non liee dans la navigation)
- Test: `tests/unit/{productsApi,productList}.test.js`

**Interfaces :**
- `productsApi.js` : `listProducts(params)` (memes noms que l'API), `getProduct(id)`, `getPriceHistory(furnitureId)`, `outUrl(offerId): string` (URL absolue de `/out/:offerId`).
- `ProductTile` : props `product: ProductSummary` ; affiche image, marque, titre, "des X EUR", "N marchands", pastille "jusqu'a -Y EUR" si `best_gap > 0` ; lien vers `/produit/<product_id>`.
- `CatalogFilters` : `v-model` d'un objet `{ q, category, brand, min_price, max_price, multi, sort }`.
- Les filtres et la page vivent dans la query de l'URL (lien partageable, retour arriere correct).

- [ ] **Step 1 : tests en echec :** `listProducts({ q: "hay", page: 2 })` appelle `/products?q=hay&page=2` ; la vue affiche une tuile par produit recu ; etat vide "Aucun produit ne correspond" ; etat d'erreur avec bouton "Reessayer" ; changer le tri met a jour la query et relance l'appel avec `page=1` ; pagination : le bouton "Suivant" est desactive sur la derniere page.
- [ ] **Step 2 :** echec. **Step 3 :** implementer selon la liste du prototype (`.superpowers/spike-phase3/proto/index.html`). **Step 4 :** tests, lint, build verts ; verification visuelle a 375 px et 1280 px, navigation clavier. Commit, PR.

### Task 11: Fiche produit v2

Branche `feat/product-page-v2`.

**Files:**
- Create: `src/views/ProductView.vue`, `src/components/Product/{ProductHero.vue, VariantPicker.vue, OfferList.vue, PriceHistoryChart.vue, SpecTable.vue, SimilarProducts.vue, AiScenePanel.vue}`
- Modify: `src/router/index.js` (route `/produit/:productId`, non liee ; variante dans `?variante=<furniture_id>`), `src/components/Detail/ProductReviews.vue` seulement si une prop manque
- Test: `tests/unit/{productView,offerList,priceHistoryChart}.test.js`, `cypress/e2e/product-v2.cy.js`

Reference visuelle : `.superpowers/brainstorm/1023-1794158174/content/fiche-produit-v2.html` (structure, espacements, libelles). Sections et onglets collants : Prix, Historique des prix, Mise en scene IA, Avis, Infos produit.

**Regles fixees :**
- Variante affichee : celle de `?variante=`, sinon la moins chere. Changer de variante remplace la query sans recharger la page et recharge offres et historique.
- `OfferList` : une ligne par offre dans l'ordre rendu par l'API ; marchand, titre de l'offre, prix, "livraison : voir le site" quand `shipping_cost` est NULL, disponibilite, "prix verifie il y a ..." (a partir de `last_seen_at`), bouton "Voir l'offre" vers `outUrl(offer_id)` en `target="_blank" rel="noopener nofollow"`. Phrase de transparence sous la liste, avec lien vers `/a-propos-des-prix`.
- Encadre meilleur prix : prix de la premiere offre, nombre de marchands, economie = ecart avec l'offre la plus chere si au moins 2 offres.
- `PriceHistoryChart` : SVG en ligne (une ligne par marchand), sans bibliotheque ; avec moins de 2 points : texte "Historique disponible apres quelques jours de suivi". Un tableau equivalent masque visuellement est fourni pour les lecteurs d'ecran.
- `SpecTable` : marque, designer, dimensions, poids, EAN, puis les cles de `attributes` ; une ligne sans valeur n'est pas affichee.
- `AiScenePanel` : extrait de la scene IA de `ProductDetail.vue` sans changer son appel d'API. Avis : `ProductReviews.vue` reutilise, avec la liste des `furniture_id` du produit en lecture et la variante affichee en ecriture.
- Favori : coeur dans `ProductHero`, sur la variante affichee, via l'API favoris existante.
- `SimilarProducts` : `listProducts({ category, page_size: 5 })` sans le produit courant, 4 tuiles.
- Review Focus 5 : variante sans offre -> encadre "Plus d'offre pour le moment", liste d'offres vide sans erreur, reste de la fiche affiche.

- [ ] **Step 1 : tests en echec :** variante par defaut = la moins chere ; `?variante=` respecte ; changement de variante -> nouvel appel offres avec le bon `furniture_id` ; lien d'offre = `outUrl` avec `rel` contenant `nofollow` et `noopener` ; "livraison : voir le site" si `shipping_cost` NULL ; graphique : texte de repli avec 1 point, une `polyline` par marchand avec 2 points ou plus ; etat sans offre (Review Focus 5) ; produit inconnu (404) -> message et lien vers `/produits`.
- [ ] **Step 2 :** echec. **Step 3 :** implementer.
- [ ] **Step 4 :** Cypress `product-v2.cy.js` sur la stack locale ensemencee : ouvrir `/produits`, cliquer la premiere tuile, changer de variante, verifier que le prix affiche change et que le lien "Voir l'offre" pointe vers `/api/v1/out/`.
- [ ] **Step 5 :** tests, lint, build verts ; comparaison visuelle avec la maquette a 375 px et 1280 px ; parcours clavier complet (onglets, variantes, formulaire d'avis). Commit, PR.

### Task 12: Marque Prixoli et page "A propos de nos prix"

Branche `feat/prixoli-brand`.

**Files:**
- Create: `src/components/BrandLogo.vue`, `src/views/AboutPricesView.vue`, `meubly-front/public/favicon.svg`
- Modify: `AppHeader.vue`, `AppFooter.vue`, `index.html` (titre, icone), `src/views/Admin/provider/listView.vue`, `src/config/themeColors.js` et `tailwind.config.js` (token `ink: #1C1B19`), `src/router/index.js` (route `/a-propos-des-prix`, liee dans le pied de page), tests et specs Cypress qui cherchent le texte "Meubly"
- Test: `tests/unit/brand.test.js`

**Interfaces :** `BrandLogo` : SVG en ligne (etiquette de prix sur carre dore arrondi, repris de `.superpowers/spike-phase3/proto/index.html`) suivi du mot "Prixoli" ; prop `compact: boolean` (logo seul, avec `aria-label="Prixoli"`).

Texte de la page (4 paragraphes courts) : d'ou viennent les prix (releves automatiques sur les sites des marchands, identifies comme PrixoliBot) ; frequence (chaque jour, date de verification affichee sur chaque offre, offre masquee au-dela de 3 jours) ; classement (par prix, aucune mise en avant payante, aucun lien affilie a ce jour) ; contact marchand pour correction ou retrait (adresse fournie par le proprietaire au moment de la tache).

- [ ] **Step 1 : tests en echec :** l'entete et le pied de page affichent "Prixoli" et plus "Meubly" ; `document.title` contient "Prixoli" ; la page "A propos" contient les quatre titres.
- [ ] **Step 2 :** echec. **Step 3 :** implementer ; `grep -rn "Meubly" meubly-front/src meubly-front/index.html` ne doit plus rien rendre hors commentaires techniques (`apiBase.js`, cle de `themeStore.js` : inchanges, ce ne sont pas des textes affiches).
- [ ] **Step 4 :** Mettre `INGEST_BOT_URL` par defaut a l'URL de prod de `/a-propos-des-prix` (demander l'URL Vercel au proprietaire) dans `politeFetch.js` et son test. Suites vertes, build. Commit, PR.

### Task 13: Collecte planifiee

Branche `chore/ingest-workflow`.

**Files:**
- Create: `.github/workflows/ingest.yml`
- Delete: `.github/workflows/ingest-probe.yml`
- Modify: `README.md` (section exploitation de la collecte)

**Regles fixees :**
- Declencheurs : `workflow_dispatch` (entree `partner`) ; le bloc `schedule` est ecrit mais commente jusqu'a la tache 14.
- Une tache par marchand (matrice : Connox, Fleux, Nordic Nest ; The Cool Republic s'y ajoute s'il autorise l'agent), `fail-fast: false`, `timeout-minutes: 330`, `concurrency` par marchand sans annulation.
- Horaire prevu : `0 3 * * *` (UTC).
- Etapes : checkout, Node 22, `npm ci` dans `meubly-back`, `npm run ingest -- --partner "<nom>"` avec `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` tires des secrets GitHub `INGEST_SUPABASE_URL` et `INGEST_SUPABASE_SERVICE_ROLE_KEY`, `INGEST_ALLOW_REMOTE=1`. `permissions: contents: read`.
- `purgeOldClicks` (clics de plus de 13 mois) appele par `cli.js` en fin de `--all` ou dans une tache dediee de la matrice.

- [ ] **Step 1 :** Ecrire le workflow. Le proprietaire ajoute les deux secrets (il ne me les communique pas).
- [ ] **Step 2 :** Verification sans ecriture : lancement manuel avec `--dry-run` ajoute temporairement a la commande, pour un marchand Shopify. Attendu : compteurs affiches, aucune ligne en base. Retirer `--dry-run`.
- [ ] **Step 3 :** README. Commit, PR.

### Task 14: Bascule

Branche `feat/phase-3-switch`. **Chaque ecriture en prod de cette tache demande l'accord explicite du proprietaire juste avant.**

**Files:**
- Create: `supabase/migrations/<ts>_phase3_contract.sql`
- Modify: `meubly-front/src/router/index.js`, composants `Home/*`, `SearchBar.vue`, `FavoritesView.vue`, `.github/workflows/ingest.yml` (decommenter `schedule`), `docker-compose.yml` (retrait du service `ingestion`), `supabase/seed.sql`
- Delete: `bd/ingestion/`, `ResultatRechercheView.vue`, `ProductDetailView.vue`, `components/Detail/{ProductDetail.vue, TableComparison.vue}`, `cypress/e2e/product-detail.cy.js`, composants `Filters/*` non importes, routes et fonctions `furnitures` du back que plus rien n'appelle (verifier par `grep` avant chaque suppression)

**Interfaces :**
- Routes : `/resultat-recherche` et `/product-detail/:id` redirigent vers `/produits` (les anciens identifiants IKEA n'existent plus) ; la recherche de l'entete envoie vers `/produits?q=` ; les sections de l'accueil et la page Favoris pointent vers `/produit/<product_id>?variante=<furniture_id>`.
- Migration `phase3_contract` (dans cet ordre, gardes idempotentes) : suppression des offres du partenaire IKEA `8d2e3d7c-1f4a-4a2c-8c3f-0b9cf7f8e2a1` ; suppression des `furniture` sans `product_id` ; suppression du partenaire IKEA ; suppression des categories sans meuble hors les 11 racines ; `furniture.product_id` passe a NOT NULL avec `ON DELETE CASCADE` ; la migration s'arrete en erreur s'il reste un `furniture` sans `product_id`.

- [ ] **Step 1 : prerequis prod.** Projet Supabase repris par le proprietaire ; migrations des taches 1, 4 et 6 poussees (`db push --dry-run` puis push par le proprietaire) ; advisors securite et performance relus.
- [ ] **Step 2 :** Le proprietaire cree les quatre partenaires en prod par l'admin (nom, URL, `is_affiliate = false`) ; `adapter` et `adapter_config` sont poses par une requete SQL montree au proprietaire avant execution.
- [ ] **Step 3 : premiere collecte en prod**, marchand par marchand, par lancement manuel du workflow. Apres chacune : ligne `ingestion_run`, compteurs, taille de la base (`pg_database_size`). Attendu : sous 250 Mo au total ; sinon arret et retour proprietaire.
- [ ] **Step 4 : tests.** Adapter les tests front aux nouvelles routes ; Cypress : accueil -> recherche -> fiche -> clic marchand. Suites, lint, build verts.
- [ ] **Step 5 : chiffrage IKEA.** Requete de lecture en prod : nombre de meubles, offres, favoris et avis qui partiront. Montrer les chiffres au proprietaire. Sauvegarde hors git des tables `furniture`, `offer`, `favorite`, `review`, `category`, `furniture_category`, `furniture_image` (fichier sensible, jamais commite).
- [ ] **Step 6 :** Fusion de la PR (front et back bascules, deploiement automatique), puis `db push` de `phase3_contract` par le proprietaire apres `--dry-run`. Ordre voulu : le code qui n'affiche plus IKEA part avant la suppression des donnees.
- [ ] **Step 7 :** Verification en prod : la liste montre des produits a plusieurs marchands, une fiche s'ouvre, un clic marchand cree une ligne `click_out`, plus aucun article IKEA, advisors sans ERROR. Le `schedule` du workflow est actif.

### Task 15: Cloture de phase

Branche `docs/phase-3-closeout`. A faire apres 7 jours de collecte planifiee.

**Files:** `README.md`, `CLAUDE.md`, `docs/ROADMAP.md`, `docs/diagrams/{architecture,data-model,ingestion-flow,offer-states}.md`, `docs/security-matrix.md`, memoire du projet.

- [ ] **Step 1 :** Verifier les criteres de la section 8 de la spec, chiffres a l'appui (articles comparables visibles, aucune offre active verifiee il y a plus de 3 jours, 7 jours d'executions dans l'ecran "Flux", plus de "Meubly" a l'ecran).
- [ ] **Step 2 :** Mettre a jour les documents : commandes (`npm run ingest`), tables, regles de collecte, pieges rencontres, points reportes (frais de livraison, Silvera, Cdiscount, affiliation, domaine et emails Prixoli, copie locale des images). Supprimer de `CLAUDE.md` la mention de `bd/ingestion`.
- [ ] **Step 3 :** `/simplify` puis `/code-review` sur l'ensemble de la phase. Commit, PR.

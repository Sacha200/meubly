# Phase 2 - Modele de donnees du comparateur (conception)

Date : 2026-11-04. Feuille de route : `docs/ROADMAP.md`, phase 2. Decisions prises avec le proprietaire en seance (questions Q1 a Q29) ; les choix laisses a Claude sont marques **[choix Claude]**.

## 1. Intention

Meubly (futur Prixoli) montre, pour chaque meuble du catalogue, les offres de plusieurs marchands afin que le visiteur compare le prix et le reste (livraison, delais, etat, conditions). Reference assumee : idealo.fr, dont on reprend les points forts (prix total, historique de prix, fraicheur des donnees, regroupement par produit) et dont on corrige les points faibles (liste d'offres a rallonge, classement influence par les marchands payants, rien de specifique au meuble, prix barres repris tels quels).

La phase 2 donne au schema la capacite de porter ce metier, et le rend reproductible et versionne. Elle ne fait pas encore entrer de nouvelles donnees (phase 3) ni ne change l'interface (phase 4).

## 2. Etat constate en prod (lecture seule, 2026-11-04)

- Postgres 17.11 (prod), 15.8 dans la stack locale self-hosted (`docker-compose.yml`, service `db`, Kong :8000). Supabase CLI non installe.
- Historique de migrations cloud : seulement 006 a 010 (`supabase_migrations`) ; 001 a 005 ont ete appliquees a la main. `review` existe deja en prod (la feuille de route est en retard sur ce point).
- 7 917 meubles, 8 037 offres, 6 791 `partner_product`, 16 partenaires.
- **Seules les offres du partenaire IKEA `8d2e3d7c-1f4a-4a2c-8c3f-0b9cf7f8e2a1` sont reelles** (7 897 offres, 6 773 `partner_product`, import du script). Les 140 autres offres (Amazon x2, BUT/But, Cdiscount, Conforama x2, La Redoute x2, Maisons du Monde x2, ancien partenaire Ikea `897576b8-...` avec 32 offres, MockPartner) sont des donnees de demo : titres generiques, prix inventes, URL fabriquees. Partenaires de test : MockPartner, Competitor, "Funiture Store API (GitHub)".
- 19 meubles n'existent qu'a travers ces offres de demo (0 favori, 0 avis, 0 image).
- 19 paires (meuble, partenaire) en double, **toutes chez des partenaires de demo** (verifie : 0 doublon chez IKEA `8d2e3d7c-...`) ; elles disparaissent avec les offres de demo.
- Aucun trigger dans `public`. `cached_min_price` / `cached_nb_offers` ne sont remplis que par les scripts d'ingestion (`bd/ingestion/main.py`, `scrape_ikea.mjs`) : 3 meubles ont un minimum faux, 12 un nombre faux.
- Aucune dimension <= 0, aucun prix negatif, aucune offre orpheline. **7 896 meubles sur 7 917 n'ont pas de dimensions.**
- Index : pas d'index sur `offer(furniture_id)` ni `offer(partner_id)` ; aucun index trigram.
- Extensions : `pg_trgm` dans `public` (advisor WARN), `pg_graphql` actif (lints 0026/0027). Le code n'utilise pas GraphQL.
- `is_active` d'offre n'est lu que dans `meubly-back/repositories/offerRepository.js` ; le front n'y touche pas. La politique RLS `catalog_read` sur `offer` est `USING (true)`.

## 3. Objectifs

1. **Socle reproductible** : une migration baseline tiree de la prod, historique cloud aligne, base locale sur la stack Supabase CLI en Postgres 17. `supabase db reset` local reproduit le schema prod.
2. **Donnees honnetes** : plus aucune offre ni partenaire de demo en prod, plus de doublons.
3. **Schema metier** : l'offre porte ce qu'un comparateur de meubles doit comparer ; le meuble porte de quoi etre rapproche en phase 3 ; historique de prix, clics sortants et executions d'ingestion ont leur table.
4. **Integrite par la base** : contraintes, statut d'offre, triggers pour l'historique et les caches, horodatages fixes par Postgres.
5. **Advisors** : securite sans ERROR et sans les WARN `pg_trgm`/GraphQL ; performance sans FK non indexee.

## 4. Non-objectifs

- Pipeline d'ingestion, adaptateurs marchands, regle de peremption des offres, purge planifiee (phase 3).
- Endpoint `GET /out/:offerId`, courbe de prix, indicateur "bon prix", alerte prix, regroupement des variantes, affichage "meilleure offre par marchand" (phase 4). La table d'alerte sera creee en phase 4 si la fonctionnalite est retenue.
- Note marchand, moyens de paiement, questions/reponses, points forts/faibles, prix a l'etranger : jamais dans le modele pour l'instant.
- Extraction des dimensions manquantes (phase 3, peut-etre depuis `partner_product.raw_payload`).
- Renommage Meubly -> Prixoli (lot separe).

## 5. Anti-objectifs (echec meme si "ca marche")

- Une migration qui passe en local mais diverge de la prod, ou un `db reset` qui ne reproduit pas la prod.
- Une perte de donnees reelles (offres IKEA, favoris, avis, profils) pendant le nettoyage.
- Un visiteur qui voit un prix invente, une offre non active, ou un prix barre non verifie.
- Une ecriture de prix qui ne laisse pas de trace dans `price_history`, ou des caches qui divergent des offres.
- Des donnees personnelles superflues (IP, user-agent) dans `click_out`.

## 6. Decisions

### 6.1 Socle (Q2, Q3, Q12)

- Baseline : dump du schema prod via Supabase CLI (lance par `npx supabase`, version figee dans le plan apres verification), en une migration baseline unique. Les fichiers 001 a 010 sont deplaces dans `bd/supabase/migrations/archive/` (conserves pour l'historique, plus rejoues). L'historique cloud est aligne sur la baseline (`migration repair` ou equivalent documente, a verifier dans la doc CLI avant usage).
- **[choix Claude]** Emplacement : la CLI attend `supabase/migrations/`. Le builder choisit entre deplacer le dossier a la racine (`supabase/`) ou configurer la CLI pour `bd/supabase/` ; preference pour le format standard de la CLI, avec mise a jour de CLAUDE.md, README et `apply-local.sh`.
- Base locale : stack Supabase CLI (`supabase start`, Postgres 17) en remplacement des services Supabase self-hosted du `docker-compose.yml`. Les conteneurs applicatifs (`meubly-back`, `meubly-front`, `ingestion`, SonarQube) restent en docker compose et pointent sur la stack CLI. Mailpit (utilise pour tester le mot de passe oublie) est fourni par la CLI. `npm run test:db`, `bd/supabase/apply-local.sh`, `.env.example`, `docs/diagrams/architecture.md` (ports) suivent.
- Donnees locales (Q30) : les donnees de l'ancienne base locale self-hosted (comptes de test, favoris, avis, objets Storage) sont abandonnees, accord du proprietaire. La stack CLI repart d'un seed **versionne et synthetique** (`seed.sql`) : quelques meubles et categories, le partenaire IKEA avec son UUID de prod `8d2e3d7c-1f4a-4a2c-8c3f-0b9cf7f8e2a1`, des offres de demo multi-marchands (local uniquement), un compte de test compatible avec `meubly-back/tests/db/helpers.js`, et le bucket Storage `ai-generated` (via `config.toml` ou le seed). Import complet du catalogue a la demande depuis un export prod non versionne (script dedie, sens prod -> local uniquement).
- Mise en prod : pas de branche Supabase (payant, plan gratuit). Validation complete sur la stack CLI locale, puis application en prod une migration a la fois, avec accord explicite du proprietaire avant chacune, et advisors securite + performance relances apres chacune.
- Filet : dump des donnees prod (tables `public` concernees) avant toute migration de donnees, stocke hors git.
- **[choix Claude]** Ordre migrations / deploiement : Vercel et Render deploient automatiquement a la fusion sur `master` (README). Tout changement de schema qui casserait le code en prod suit le schema "etendre puis contracter" : (a) migration additive (ex. `status` ajoute et synchronise avec `is_active`), (b) fusion et deploiement du back qui lit la nouvelle colonne, (c) migration qui retire l'ancienne (`is_active`). Aucune interruption de `GET /furnitures/:id/offers`.
- **[choix Claude]** Scripts d'ingestion (`bd/ingestion/*`) : aucun planning (pas de cron ni de workflow CI, lancement manuel uniquement). Ils sont **geles pendant la phase 2** : ne pas les lancer contre la prod. Ils seront reecrits en phase 3. Attention : `cloud_to_local.mjs` ecrit en realite du LOCAL vers le CLOUD malgre son nom ; ne pas l'utiliser pour alimenter la stack locale.

### 6.2 Nettoyage des donnees prod (Q4, Q5, Q29)

Migration de donnees idempotente, comptages montres avant/apres :

1. Supprimer toutes les offres dont le partenaire n'est pas IKEA `8d2e3d7c-...` (140 offres).
2. Supprimer les 19 meubles qui n'ont plus aucune offre apres l'etape 1 (avec leurs lignes dependantes : `furniture_category`, `partner_product` lies ; favoris, avis et images : 0 au comptage, a reverifier au moment de l'execution).
3. **[choix Claude]** Supprimer tous les partenaires sauf IKEA `8d2e3d7c-...`, avec leurs `partner_product` (18 lignes de test). Les vrais marchands seront recrees en phase 3 avec leurs champs reels (`is_affiliate`, URL). Fusionner des doublons devenus vides n'a plus d'interet.
4. Doublons (meuble, partenaire) : aucun attendu apres l'etape 1. La migration verifie qu'il n'en reste aucun et **s'arrete en erreur** sinon (pas de suppression automatique d'offres IKEA reelles ; on revient vers le proprietaire).
5. Recalculer `cached_min_price` / `cached_nb_offers` pour tous les meubles.
6. Le meuble sans aucune offre (1, hors demo) : **[choix Claude]** le conserver et le signaler au proprietaire dans le compte rendu.

Seed **local** : les offres de demo peuvent etre gardees dans un seed reserve a la stack locale pour tester l'affichage multi-marchands ; jamais appliquees en prod.

### 6.3 Offre (`offer`) (Q6, Q14, Q15, Q18, Q22, Q24, Q25)

| Colonne | Type | Regle |
|---|---|---|
| `status` | enum `offer_status` (`active`, `stale`, `removed`) | NOT NULL, defaut `active` ; remplace `is_active` (migration : `true` -> `active`, sinon `removed`), puis `is_active` supprimee |
| `last_seen_at` | timestamptz | NOT NULL, defaut `now()` ; initialise depuis `updated_at` |
| `price` | numeric(10,2) | NOT NULL, `CHECK (price >= 0)`, prix article TTC en euros |
| `shipping_cost` | numeric(10,2) | nullable (NULL = inconnu), `CHECK (>= 0)` |
| `total_price` | numeric(10,2) | colonne generee stockee : `price + shipping_cost` (NULL si livraison inconnue) |
| `eco_fee` | numeric(10,2) | nullable, `CHECK (>= 0 AND <= price)` ; eco-participation deja comprise dans `price` |
| `availability` | enum `offer_availability` (`in_stock`, `out_of_stock`, `unknown`) | NOT NULL, defaut `unknown` |
| `delivery_min_days`, `delivery_max_days` | integer | nullables, `>= 0`, `min <= max` |
| `delivery_mode` | enum `delivery_mode` (`parcel`, `curbside`, `room_of_choice`, `installed`, `unknown`) | NOT NULL, defaut `unknown` |
| `assembly_included` | boolean | nullable (NULL = inconnu) |
| `return_days` | integer | nullable, `>= 0` |
| `condition` | enum `offer_condition` (`new`, `used`, `refurbished`) | NOT NULL, defaut `new` |
| `seller_name` | text | nullable ; vendeur tiers sur une marketplace |
| `created_at` | timestamptz | NOT NULL, defaut `now()` |
| `updated_at` | timestamptz | fixe par trigger |

- `furniture_id` et `partner_id` passent NOT NULL (0 orpheline constatee).
- Unicite : `UNIQUE NULLS NOT DISTINCT (furniture_id, partner_id, seller_name, condition)`.
- Index : `offer(furniture_id)` (peut etre couvert par l'index unique, a verifier par l'advisor), `offer(partner_id)`, et un index partiel `offer(furniture_id) WHERE status = 'active'` si les plans de requete le justifient.
- Pas de colonne devise (euros TTC implicites). Pas de prix barre du marchand (Q26).
- RLS : `catalog_read` sur `offer` remplacee par une politique `offer_read_active` (`USING (status = 'active')`) pour anon et authenticated. Le back (service role) voit tout.
- **[choix Claude]** Precision de `numeric(10,2)` : les colonnes existantes sont `numeric` sans precision ; le builder verifie qu'aucun prix existant n'a plus de 2 decimales avant de typer, sinon garde `numeric`.

### 6.4 Meuble (`furniture`) (Q16, Q17, Q19, Q27, Q10)

- Une ligne = un produit exact (modele + couleur + taille). Pas de table de variantes en phase 2.
- Nouvelles colonnes nullables : `brand` text, `gtin` text (unique quand renseigne, `CHECK` sur 8, 12, 13 ou 14 chiffres), `manufacturer_ref` text, `weight_kg` numeric (`> 0`), `attributes` jsonb (defaut `'{}'`, `CHECK (jsonb_typeof(attributes) = 'object')`).
- Dimensions `size_width`, `size_height`, `size_depth` : en centimetres, `CHECK (> 0)` quand renseignees, `COMMENT ON COLUMN` precisant l'unite.
- Index trigram GIN sur `title` (`gin_trgm_ops`), apres deplacement de `pg_trgm` dans `extensions`. **[choix Claude]** La requete de recherche du back (`ilike`) n'est pas modifiee en phase 2 : un index trigram GIN accelere deja `ilike '%q%'`.
- `cached_min_price` / `cached_nb_offers` : maintenus par trigger (6.6).

### 6.5 Partenaire (`partner`) (Q23)

- Ajout `is_affiliate` boolean NOT NULL defaut `false`.
- Principe de produit (pas de colonne) : tri par defaut par prix total, aucune place payante, mention "lien affilie" affichee quand `is_affiliate`.
- **[choix Claude]** `partner.api_key_hash` : non touche en phase 2 (signale comme a reevaluer en phase 3).

### 6.6 Triggers et fonctions

Toutes les fonctions : `SET search_path = ''`, noms qualifies, `SECURITY INVOKER` sauf besoin justifie.

- `set_updated_at()` generique, `BEFORE UPDATE`, sur `offer`, `partner_product`, `review` (Q11). Le back cesse d'envoyer `updated_at` pour `review` ; `review.created_at` garde le defaut `now()`.
- `record_price_history()` sur `offer`, `AFTER INSERT` et `AFTER UPDATE OF price, shipping_cost` : insere une ligne dans `price_history` a la creation et a chaque changement effectif (`IS DISTINCT FROM`) (Q7).
- **[choix Claude]** `refresh_furniture_offer_cache()` sur `offer`, `AFTER INSERT/UPDATE/DELETE` : recalcule pour le ou les meubles touches `cached_min_price = min(price)` et `cached_nb_offers = count(*)` sur les offres `active`. Base : prix article (et non prix total) pour garder le sens actuel du filtre et du tri du back ; un `cached_min_total_price` pourra etre ajoute en phase 4. Les scripts d'ingestion ne doivent plus ecrire ces colonnes (a retirer en phase 3, signale dans le plan).
- Chargement initial de `price_history` : une ligne par offre existante au moment de la migration (`observed_at = updated_at` ou `now()`), pour que l'historique ne demarre pas vide.

### 6.7 Nouvelles tables (Q7, Q8, Q9, Q20)

`price_history`
- `price_history_id` bigint identity PK, `offer_id` uuid NOT NULL FK `offer ON DELETE CASCADE`, `price` numeric NOT NULL `>= 0`, `shipping_cost` numeric nullable, `observed_at` timestamptz NOT NULL defaut `now()`.
- Index `(offer_id, observed_at DESC)`.
- Au niveau offre ; la courbe "minimum du meuble par jour" est calculee a la lecture en phase 4.
- RLS : **[choix Claude]** lecture anon/authenticated limitee aux lignes dont l'offre est `active` (`EXISTS` sur `offer`, coherent avec `offer_read_active`) ; aucune ecriture hors service role et trigger.

`click_out`
- `click_out_id` bigint identity PK, `offer_id` uuid NOT NULL FK `offer ON DELETE CASCADE`, `user_id` uuid nullable FK `auth.users ON DELETE SET NULL`, `clicked_at` timestamptz NOT NULL defaut `now()`.
- Aucune IP, aucun user-agent. Retention 13 mois (purge en phase 3).
- Index `(offer_id, clicked_at)`, `(user_id)`.
- RLS : active, aucune politique pour anon/authenticated (ecriture et lecture par le back uniquement).

`ingestion_run`
- `ingestion_run_id` bigint identity PK, `partner_id` uuid NOT NULL FK `partner`, `started_at` timestamptz NOT NULL defaut `now()`, `finished_at` timestamptz nullable, `status` enum `ingestion_status` (`running`, `succeeded`, `failed`, `partial`), compteurs integer NOT NULL defaut 0 (`seen_count`, `created_count`, `updated_count`, `error_count`), `errors` jsonb defaut `'[]'`.
- Index `(partner_id, started_at DESC)`.
- RLS : active, aucune politique pour anon/authenticated.

### 6.8 Extensions (Q10)

- `pg_trgm` deplace dans `extensions` (`ALTER EXTENSION pg_trgm SET SCHEMA extensions`), verifier que rien ne reference les fonctions dans `public`.
- `pg_graphql` desactive. Verifier avant en prod qu'aucun client (front, back, Studio) n'en depend ; le code n'y fait aucun appel (verifie le 2026-11-04).

### 6.9 Code applicatif touche

- `offerRepository.js` : `.eq("status", "active")` a la place de `is_active`, colonnes selectionnees mises a jour (nouveaux champs exposes par `GET /furnitures/:id/offers`). Tests Vitest/supertest d'abord.
- `providerService.js` : `isActive` porte sur `partner.is_active` (inchange) ; ajouter `isAffiliate` en lecture et ecriture admin, avec validation.
- `review` : ne plus envoyer `updated_at` depuis le back.
- Front : aucun changement fonctionnel exige ; `npm run build` et tests verts.
- Scripts d'ingestion : non modifies en phase 2, mais incompatibles avec `is_active` supprime ; le plan doit le signaler (ils seront reecrits en phase 3) ou faire l'adaptation minimale.

### 6.10 Documentation

- `docs/diagrams/` : diagramme de classes (schema), C4 mis a jour, flux d'ingestion cible, etats d'offre (`active` -> `stale` -> `removed`, retour `active` si revue). Mermaid, en `.md`.
- `docs/security-matrix.md` : nouvelles tables et politique `offer_read_active`.
- `docs/ROADMAP.md` : statut phase 2, `review` retire de la liste, points ouverts. README et CLAUDE.md (commandes CLI, ports, piege PG 15 supprime).

## 7. Contraintes

- Postgres 17 partout apres la phase. Migrations idempotentes, numerotees apres la baseline.
- Rien n'ecrit en prod sans accord explicite, une migration a la fois ; DDL et DML de nettoyage separes.
- TDD : tests de schema/RLS dans `npm run test:db` (stack locale) avant chaque migration ; tests Vitest/supertest du back avant le code.
- `.gitignore` ignore `*.md` : les nouveaux fichiers de `docs/` sont deja couverts par `!docs/**/*.md`.
- Ne jamais lire ni commiter `.env`.

## 8. Laisse au builder

- Ordre exact des migrations et decoupage en taches (une tache a la fois, voir CLAUDE.md).
- Version de la CLI, commande exacte de baseline et de reparation d'historique, apres lecture de la doc.
- Branchement des conteneurs applicatifs sur la stack CLI (reseau, URL, cles locales).
- Noms exacts des contraintes et index.

## 9. Fini quand

- `supabase db reset` local reproduit le schema prod (diff vide entre local et prod).
- Advisors : securite sans ERROR, sans WARN `pg_trgm` ni GraphQL (WARN mots de passe compromis accepte) ; performance sans FK non indexee.
- En prod : 0 offre de demo, 0 partenaire de test, 0 doublon, caches coherents avec les offres actives, `price_history` initialisee.
- `npm run lint`, `npm run test:run`, `npm run test:db` verts, CI verte.
- Diagrammes, matrice de droits, ROADMAP, README, CLAUDE.md a jour.

## 10. Points ouverts signales

- 7 896 meubles sans dimensions : bloque la fonctionnalite "rentre-t-il chez moi" tant que la phase 3 ne les extrait pas.
- `partner_product` (dont `raw_payload`) est en lecture publique via `catalog_read` : a reevaluer (donnees internes).
- Scripts d'ingestion qui ecrivent les caches et `is_active` : a reecrire en phase 3.

# Phase 3 - Comparateur multi-marchands (conception)

Date : 2026-11-15. Feuille de route : `docs/ROADMAP.md`, phase 3, elargie a une partie de la phase 4 (liste et fiche produit) a la demande du proprietaire ("tout livrer ensemble"). Decisions prises avec le proprietaire en seance du 2026-11-08 au 2026-11-15 ; les choix laisses a Claude sont marques **[choix Claude]**.

## 1. Intention

Prixoli (nom de code du depot : Meubly) devient un comparateur du type idealo / leDenicheur pour la maison : **le meuble de qualite ou de designer au meilleur prix**. Pour un meme article (meme modele, meme couleur, meme taille), le visiteur voit les prix de plusieurs marchands independants, choisit sa variante, lit une fiche courte avec les details qui comptent, et part chez le marchand.

La phase 3 fait entrer de vraies offres de plusieurs marchands, donne au schema la notion de produit a variantes, et livre les deux pages qui montrent ce travail (liste et fiche produit v2). Le catalogue IKEA mono-marchand disparait.

## 2. Etat constate

### 2.1 Production

- **Le projet Supabase de prod est en pause** (`status: INACTIVE`, constate le 2026-11-15) : le site de prod ne peut plus lire sa base. La reprise se fait depuis le tableau de bord Supabase, par le proprietaire.
- Derniers chiffres connus (fin de phase 2, 2026-11-06) : 7 898 meubles, tous issus d'IKEA, un seul partenaire, une offre par meuble. 3 449 meubles sans dimension, 1 093 sans categorie. Favoris et avis : a recompter a la reprise.
- Aucune ingestion planifiee. `bd/ingestion/*` est gele et incompatible avec le schema.

### 2.2 Essai de collecte local (jetable, `.superpowers/spike-phase3/`, non versionne)

- Connox et Fleux (Shopify) : catalogue complet par `/products.json`, variantes et code-barres par `/products/<handle>.js`. Connox publie un EAN valide sur 94 % des variantes. Fleux range l'EAN dans `sku` et la reference fabricant dans `barcode` : seul le controle de la cle GTIN permet de savoir lequel est l'EAN.
- **AmbienteDirect fusionne avec Connox** (meme groupe, memes numeros d'article). Ce n'est pas un marchand independant : il est ecarte. Sur les 212 articles "comparables" du prototype, 11 seulement l'etaient entre boutiques independantes.
- Verification d'acces du 2026-11-11 (lecture de `robots.txt` et d'une fiche, sans contournement) :

| Boutique | Acces | Identifiant | Decision |
|---|---|---|---|
| Connox | oui (Shopify) | EAN | phase 3 |
| Fleux | oui (Shopify) | EAN (dans `sku`) | phase 3 |
| The Cool Republic | refus de l'agent declare (defi Cloudflare 403, le 2026-11-17) | EAN | en attente : autorisation demandee le 2026-11-24 |
| Nordic Nest | oui (plan du site + JSON-LD) | EAN par variante | phase 3 |
| Silvera | oui | reference interne seulement | plus tard |
| Cdiscount | oui | EAN | plus tard (prix moyens) |
| Made in Design, La Redoute, Finnish Design Shop, Lightonline, ManoMano, Maisons du Monde, But, Leroy Merlin | refus (403) | - | affiliation uniquement |
| Conforama, Nedgis | interdit par `robots.txt` | - | affiliation uniquement |

- **Porte 6.9, mesuree le 2026-11-17** (agent `PrixoliBot`, 1 requete / 2 s) :
  - Acces : Connox, Fleux et Nordic Nest repondent 200 (`robots.txt` et catalogue), en local comme depuis GitHub Actions (sonde `ingest-probe.yml`). The Cool Republic oppose un defi Cloudflare (403) a l'agent declare : il est retire du depart, sans contournement, en attendant sa reponse.
  - Marques communes a au moins deux des trois marchands : 79. Fiches a lire pour ces marques : Connox 6 454, Fleux 968, Nordic Nest 19 541 (sur 46 589 fiches au plan du site).
  - Echantillon aleatoire de 300 fiches Nordic Nest de ces marques : 283 portent un EAN (1,9 variante par fiche en moyenne), 48 ont le meme EAN chez un autre marchand (47 Connox, 1 Fleux).
  - Estimation : **environ 3 100 fiches comparables** (intervalle a 95 % : 2 300 a 3 900), borne basse car le rapprochement de l'echantillon passait par le titre. La comparaison repose surtout sur la paire Connox x Nordic Nest ; Fleux recoupe peu.
  - Duree de lecture : Nordic Nest, 19 541 fiches a 2 s, environ 11 h. Cela depasse la limite de 6 h d'un job GitHub Actions : la tache 5 doit plafonner `maxPagesPerRun` et repartir les fiches sur plusieurs passages.
- Le prototype local (liste + fiche v2 sur donnees reelles) a ete valide par le proprietaire. La maquette de reference est `.superpowers/brainstorm/1023-1794158174/content/fiche-produit-v2.html`.

### 2.3 Code

- Back : routes v1 `furnitures`, `categories`, `favorites`, `reviews`, `provider`, `users`, `ai`, `health`. `furnitureRepository.search` filtre sur titre, categorie, prix, tri. Pas de route de clic sortant ni d'historique de prix.
- Front : `HomeView`, `ResultatRechercheView`, `ProductDetailView` (`/product-detail/:id`), favoris, admin (utilisateurs, partenaires, meubles). `TableComparison.vue` retrie les offres a l'envers et impose 2 s d'attente. "Meubly" apparait dans `AppHeader`, `AppFooter`, `index.html`, la liste admin des partenaires.
- Depot GitHub public : GitHub Actions y est gratuit.

## 3. Objectifs

1. **Vraies comparaisons** : des articles identiques (meme EAN) avec les prix d'au moins deux marchands independants.
2. **Produits a variantes** : un produit regroupe ses variantes (couleur, finition, taille) ; chaque variante porte ses offres.
3. **Fraicheur** : collecte planifiee, tracee, avec peremption automatique des offres non revues.
4. **Supervision** : un ecran admin montre les executions, les erreurs et les rapprochements a valider.
5. **Interface** : nouvelle liste et fiche produit v2 conformes a la maquette validee, sous la marque Prixoli.
6. **Catalogue maison** : meubles, luminaires, decoration, cuisine et arts de la table, jardin et exterieur.

## 4. Non-objectifs

- Affiliation (Awin, Effiliation...) et marchands qui refusent la collecte. Silvera et Cdiscount : apres la phase 3.
- Alerte prix, indicateur "bon prix", comparaison cote a cote de deux produits.
- Changement de domaine, d'adresses email et de modeles d'email vers Prixoli (lot separe). La phase 3 ne change que le nom et le logo affiches.
- Remplacement du modele de scene IA (parque) : la fonction actuelle est seulement replacee dans la nouvelle fiche.
- Performance (polices, images responsives), audit RGAA complet, montees de version : phases 4 a 6. Les nouvelles pages respectent quand meme les regles d'accessibilite de `CLAUDE.md`.
- Frais de livraison des marchands Shopify : inconnus par la collecte, laisses a NULL et affiches "livraison : voir le site".
- Copie des images chez nous : on affiche les images servies par les marchands.

## 5. Anti-objectifs (echec meme si "ca marche")

- Presenter comme identiques deux articles differents (autre couleur, autre taille, autre tissu).
- Presenter comme deux marchands deux enseignes d'une meme entreprise.
- Afficher un prix perime sans le dire, ou une offre que le marchand a retiree.
- Afficher un prix barre repris du marchand sans verification.
- Contourner un blocage (403, `robots.txt`, captcha), ou charger un site marchand au point de le gener.
- Une production vide ou incoherente entre deux fusions sur `master`.
- Perdre des favoris ou des avis sans que le proprietaire l'ait vu chiffre et accepte.
- Depasser les 500 Mo du plan gratuit Supabase.

## 6. Decisions

### 6.1 Sources et regles de collecte

- Marchands de depart : **Connox, Fleux, Nordic Nest**. The Cool Republic refuse l'agent declare (2.2) : il rejoindra la liste par simple configuration `shopify` s'il l'autorise. D'autres suivront ; ajouter un marchand doit se limiter a un adaptateur et une ligne `partner`.
- Regles appliquees par tous les adaptateurs : lecture et respect de `robots.txt` a chaque execution, au plus une requete toutes les 2 secondes par site, pause d'une minute sur un 429, arret de l'adaptateur sur un 403 ou une page de controle (jamais de contournement).
- **[choix Claude]** Agent identifie : `PrixoliBot/1.0 (+<URL de la page "A propos de nos prix">)`, et non un faux navigateur comme dans l'essai. Si un marchand le bloque ou demande l'arret, son partenaire passe a `is_active = false` et ses offres ne sont plus visibles. Consequence a verifier en 6.9 : un marchand accessible avec un agent de navigateur peut refuser un agent declare.
- **[choix Claude]** Perimetre de collecte : seulement les **marques vendues par au moins deux des quatre marchands**. Cela vise les articles comparables et borne le volume. La liste des marques communes est recalculee a chaque execution a partir des catalogues.
- Risque juridique (conditions d'utilisation des sites, droit des bases de donnees, droits sur les images) : non tranche par un juriste, accepte par le proprietaire pour cette phase. La page "A propos de nos prix" donne un contact de retrait.

### 6.2 Modele de donnees

Principe **[choix Claude]** : `furniture` reste l'article vendable, c'est-a-dire **la variante** (elle porte deja `gtin` unique, les offres, les favoris et les avis). Une nouvelle table `product` regroupe les variantes. Aucune table existante n'est renommee.

| Objet | Changement |
|---|---|
| `product` (nouvelle) | `product_id`, `brand`, `title`, `description`, `designer`, `cover_url`, `created_at`. Lecture publique, ecriture service role. |
| `furniture` | `product_id` FK vers `product` (nullable pendant la bascule, NOT NULL apres le retrait d'IKEA), `variant_label` (ex. "Chene / noir"). Couleur, finition, taille, materiaux, hauteur d'assise vont dans `attributes` (jsonb existant). |
| `furniture_category` | inchange : la categorie reste portee par la variante ; la liste lit celle de la premiere variante du produit. |
| `partner` | `adapter` (texte, ex. `shopify`, `nordicnest` ; NULL = pas de collecte) et `adapter_config` (jsonb : URL de base, ordre des champs EAN). |
| `partner_product` | `raw_payload` reduit aux champs utiles (pas la page entiere). **Lecture publique retiree** (point ouvert de la phase 2) : service role seulement. |
| `match_candidate` (nouvelle) | `partner_product_id`, `furniture_id` propose, `score`, `reason`, `status` (`pending`, `accepted`, `rejected`), `decided_by`, `decided_at`. Service role seulement, sans politique RLS, comme `ingestion_run`. |
| `partner.api_key_hash` | supprimee (jamais utilisee). |

- Avis et favoris restent attaches a la variante. **[choix Claude]** La fiche affiche les avis de toutes les variantes du produit ; un avis publie est rattache a la variante affichee.
- Categories : nouvelle arborescence racine **[choix Claude]** : Salon, Chambre, Bureau, Cuisine et salle a manger, Salle de bain, Jardin et exterieur, Luminaires, Decoration, Rangement, Enfant. Chaque adaptateur associe le type ou le titre du marchand a une categorie par une table de correspondance dans le code ; un article sans correspondance va dans "Autres" et apparait dans l'ecran admin. Les anciennes categories IKEA sont supprimees avec le catalogue IKEA.
- Migrations : additives d'abord, retrait a la fin ("etendre puis contracter", comme en phase 2), via `supabase migration new`, idempotentes, avec RLS, `docs/security-matrix.md` et `docs/diagrams/data-model.md` mis a jour.

### 6.3 Retrait d'IKEA

- Tous les meubles IKEA partent : IKEA ne vend pas chez d'autres marchands et son catalogue n'a pas d'EAN pour etre rapproche. Si un jour un article IKEA apparait chez un marchand collecte, il entrera par la collecte comme tout autre article.
- Suppression en une migration de donnees a la bascule finale (6.8), apres : sauvegarde des tables concernees hors git, comptage affiche des favoris et avis qui partiront en cascade, **accord explicite du proprietaire au moment de l'execution**.

### 6.4 Collecte (pipeline)

- **[choix Claude]** Emplacement : `meubly-back/ingestion/`, en Node, lance par `npm run ingest -- --partner <nom>`. Il reutilise le client Supabase, les repositories, Vitest et ESLint du back. `bd/ingestion/` et le service `ingestion` du `docker-compose.yml` sont supprimes.
- Un adaptateur expose une seule fonction qui parcourt le catalogue du marchand et rend des articles normalises : identifiant externe, URL, marque, titre du produit, libelle de variante, EAN, reference fabricant, prix, disponibilite, images, attributs, indice de categorie, identifiant de la page produit du marchand. Deux adaptateurs : `shopify` (Connox, Fleux, plus tard The Cool Republic s'il autorise l'agent, parametres par `adapter_config`) et `nordicnest` (plan du site, puis JSON-LD de chaque fiche).
- Deroule d'une execution, conforme a `docs/diagrams/ingestion-flow.md` : ligne `ingestion_run` -> adaptateur -> upsert `partner_product` -> rapprochement -> upsert `offer` (`status = active`, `last_seen_at`) -> peremption -> cloture avec compteurs. L'ingestion n'ecrit jamais les caches ni `price_history` (triggers).
- Rapprochement **[choix Claude]** :
  1. EAN valide (cle GTIN verifiee, cherche dans tous les champs candidats) deja connu : l'offre rejoint ce `furniture`.
  2. EAN valide inconnu : creation du `furniture` et, si besoin, du `product`.
  3. Pas d'EAN : aucune creation, aucune offre publiee. Si un `furniture` de meme marque a un titre proche (similarite trigram au-dessus d'un seuil fixe dans le plan), une ligne `match_candidate` est creee pour l'admin ; sinon l'article reste dans `partner_product` seulement.
- Regroupement en produit : les variantes d'une meme page marchand partagent un `product`. Quand un EAN deja rattache a un produit reapparait chez un autre marchand, les autres variantes de cette page rejoignent le meme produit. En cas de conflit (deux produits existants pour une meme page), le premier gagne et le cas est note dans `ingestion_run.errors`.
- Fiche : titre, description, images et attributs viennent du premier marchand qui a cree l'article ; les champs vides sont completes par les suivants, jamais ecrases.
- Peremption **[choix Claude]** : une offre active non revue depuis plus de 3 jours passe a `stale` (invisible) ; non revue depuis 14 jours, a `removed`. Une execution en echec ne perime rien. Chaque offre affichee porte "prix verifie il y a ...".
- Prix barre du marchand (`compare_at_price`) : non stocke, non affiche.
- Volume : avant la bascule, mesure de la taille de la base locale apres une collecte complete ; objectif sous 250 Mo (moitie du plan gratuit).

### 6.5 Planification

- **[choix Claude]** GitHub Actions, un workflow planifie par marchand (depot public, donc gratuit ; 6 h maximum par execution). Shopify : une fois par jour (le catalogue complet tient en quelques dizaines de requetes ; la fiche `.js` d'un produit n'est relue que s'il est nouveau ou modifie). Nordic Nest : une fois par jour dans la limite du perimetre 6.1 ; si le perimetre depasse ce qu'une execution peut relire, les fiches sont relues par roulement, les plus anciennes d'abord, avec un plafond de 3 jours (coherent avec la peremption).
- Secrets : URL Supabase et cle service role en secrets GitHub, ajoutes par le proprietaire. Le workflow n'ecrit en prod qu'apres la bascule (6.8).
- Purge des `click_out` de plus de 13 mois dans le meme workflow quotidien.
- Inconnue : les marchands peuvent refuser les adresses de centres de donnees de GitHub. Verifie en 6.9 ; repli : lancement depuis le poste du proprietaire par une tache planifiee.

### 6.6 API back

Couches habituelles (route -> controller -> service -> repository), validation a la frontiere, limite de debit globale.

| Route | Role |
|---|---|
| `GET /api/v1/products` | liste paginee cote serveur : recherche, categorie, marque, fourchette de prix, "au moins 2 marchands", tri (prix, ecart de prix, nouveaute). Une carte par produit avec prix minimum et nombre de marchands. |
| `GET /api/v1/products/:id` | produit, variantes (libelle, attributs, prix minimum, nombre d'offres), specifications. |
| `GET /api/v1/furnitures/:id/offers` | existante ; tri par prix total si connu, sinon prix ; ajoute la date de verification. |
| `GET /api/v1/furnitures/:id/price-history` | points de prix des offres actives de la variante. |
| `GET /api/v1/out/:offerId` | enregistre un `click_out` puis redirige (302) vers l'URL de l'offre lue en base ; jamais d'URL fournie par le client. Limite de debit dediee. |
| `GET /api/v1/admin/ingestion-runs` | admin : executions recentes, compteurs, erreurs. |
| `GET /api/v1/admin/match-candidates`, `POST .../:id/accept`, `POST .../:id/reject` | admin : file de validation ; accepter cree l'offre. |

Les routes `furnitures` existantes restent jusqu'a la bascule, puis celles que plus rien n'appelle sont retirees.

### 6.7 Front

- **Liste** (remplace `ResultatRechercheView`) : grille de cartes produit (image, marque, titre, "des X EUR", "N marchands"), filtres categorie / marque / prix / "au moins 2 marchands", tri, pagination serveur, etats vide et erreur.
- **Accueil** : memes sections, branchees sur les nouvelles categories et les cartes produit (pas de refonte).
- **Fiche produit v2** (remplace `ProductDetailView`), route `/produit/:id` avec la variante en parametre ; `/product-detail/:id` redirige. Sections de la maquette : entete (galerie, marque, titre, favori, choix de variante, encadre meilleur prix), onglets collants Prix / Historique des prix / Mise en scene IA / Avis / Infos produit, liste des offres par marchand, courbe d'historique, tableau de specifications, "Dans le meme style". Les liens marchands passent par `/out/:offerId`, en `rel="noopener nofollow"`.
- Favoris, avis (publication comprise) et scene IA : fonctions existantes, replacees dans la nouvelle fiche sans changer leur API.
- **Admin "Flux"** : executions par marchand, erreurs, articles sans categorie, file de rapprochements a accepter ou refuser. Case `isAffiliate` ajoutee au formulaire partenaire.
- **Marque** : nom "Prixoli" et logo (etiquette de prix sur carre dore, comme dans le prototype) dans l'entete, le pied de page, le titre et l'icone de l'onglet. Couleur encre `#1C1B19` ajoutee aux tokens du theme ; pas de couleur en dur.
- **Page "A propos de nos prix"** : d'ou viennent les prix, frequence de verification, classement par prix sans mise en avant payante, aucun lien d'affiliation a ce stade, contact pour un marchand.
- Nouveaux composants en `<script setup>`, appels HTTP dans `src/api/*`, aucun appel `supabase.from()`.

### 6.8 Ordre de livraison

Une PR par lot, toujours vers `master`, la prod reste coherente apres chacune. Les nouvelles pages vivent sous des routes non liees jusqu'a la bascule.

1. Schema additif (`product`, colonnes, `match_candidate`, droits).
2. Coeur de collecte + adaptateur Shopify, executions sur la base locale.
3. Adaptateur Nordic Nest.
4. API produits, historique, clic sortant.
5. API et ecran admin "Flux".
6. Liste.
7. Fiche produit v2.
8. Marque Prixoli et page "A propos de nos prix".
9. **Bascule** : premiere collecte en prod, routes pointees sur les nouvelles pages, retrait d'IKEA, migration de contraction, workflows planifies actives, suppression de `bd/ingestion`, mise a jour de `README`, `CLAUDE.md`, `ROADMAP` et des diagrammes.

Les prix collectes deviennent visibles en production a l'etape 9, avec accord explicite du proprietaire pour chaque ecriture en prod.

### 6.9 Porte de decision avant de construire

Premiere tache du plan, sur la base locale, avant tout autre lot : collecter les catalogues des quatre marchands avec l'agent declare (6.1), depuis le poste local puis depuis GitHub Actions, et compter les articles de meme EAN vendus par au moins deux marchands.

- **[choix Claude]** Moins de 300 articles comparables, ou un marchand qui refuse l'agent declare ou GitHub Actions : retour vers le proprietaire avec les chiffres avant de continuer.
- Sinon, le chiffre mesure fixe le critere de fin (section 8).

### 6.10 Tests

- Adaptateurs testes sur des reponses enregistrees (aucun appel reseau dans les tests).
- Tests unitaires : cle GTIN, EAN dans le mauvais champ (Fleux), rapprochement, regroupement en produit, peremption.
- `npm run test:db` : droits des nouvelles tables (public sans acces a `match_candidate` et `partner_product`), triggers toujours justes apres une collecte.
- Back : supertest sur chaque nouvelle route, 401/403 sur les routes admin, redirection `/out` limitee aux URL en base.
- Front : tests Vitest des nouveaux composants, un parcours Cypress liste -> fiche -> changement de variante -> clic marchand.

## 7. Risques

| Risque | Parade |
|---|---|
| Trop peu d'articles communs entre marchands independants | porte 6.9 ; ajout de Silvera / Cdiscount ou affiliation |
| Blocage d'un marchand apres quelques jours | arret propre de l'adaptateur, partenaire desactive, alerte dans l'ecran "Flux" |
| Structure d'un site qui change | tests sur reponses enregistrees, compteur d'erreurs par execution, execution `partial` |
| Mauvais rapprochement | EAN exact seulement en automatique ; le reste passe par l'admin |
| Images qui disparaissent chez le marchand | image de remplacement ; copie locale a envisager plus tard |
| Limite de 500 Mo | perimetre par marques communes, `raw_payload` reduit, mesure avant bascule |
| Projet Supabase gratuit mis en pause apres une semaine sans activite | la collecte quotidienne cree de l'activite ; reprise manuelle d'ici la |

## 8. Fini quand

- Au moins 2 300 articles comparables (borne basse mesuree en 2.2, et au minimum 300) sont visibles en prod avec deux offres actives ou plus de marchands independants.
- Aucune offre visible n'a ete verifiee il y a plus de 3 jours.
- Les quatre workflows tournent seuls depuis 7 jours, visibles dans l'ecran "Flux".
- Plus aucun article IKEA ni mention "Meubly" a l'ecran ; `bd/ingestion` supprime.
- Suites back, front, base et parcours Cypress vertes ; advisors Supabase sans ERROR.

## 9. Points a confirmer par le proprietaire

1. Reprise du projet Supabase de prod (en pause).
2. Agent de collecte declare `PrixoliBot` (6.1), au risque d'etre refuse par un marchand.
3. Risque juridique de la collecte et de l'affichage des images accepte pour cette phase (6.1).
4. Perte des favoris et avis portes par les articles IKEA (6.3), chiffree au moment de la suppression.
5. Seuil de 300 articles comparables pour la porte 6.9.

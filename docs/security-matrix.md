# Matrice de droits

Mise en place en phase 1 (2026-10). Source de conception : `docs/superpowers/specs/2026-10-19-phase-1-security-design.md`.

La matrice est appliquee a deux niveaux :

1. **API back** (`meubly-back`) : gardes `requireAuth` / `requireAdmin` par route. Le back utilise la service role et contourne donc le RLS : la garde de route est la protection principale.
2. **Base** (`bd/supabase/migrations/009_rls.sql`) : RLS sur toutes les tables publiques, pour tout acces direct avec la cle anon (front via SDK, PostgREST, GraphQL).

## Roles

| Role | Qui | Comment on l'obtient |
|---|---|---|
| `anon` | visiteur non connecte | par defaut |
| `USER` | compte connecte | inscription Supabase Auth ; profil cree par trigger avec `role = 'USER'` |
| `ADMIN` | proprietaire | **uniquement** via le tableau de bord Supabase (voir plus bas) |
| service role | le back | cle `SUPABASE_SERVICE_ROLE_KEY`, jamais exposee au front |

Aucun chemin applicatif (UI ou API) ne permet d'attribuer `ADMIN`. Le trigger `handle_new_user` ignore tout `role` present dans les metadonnees d'inscription.

## Ressources

| Ressource | anon | USER | ADMIN (via API) |
|---|---|---|---|
| Catalogue : `furniture`, `offer`, `category`, `partner`, `furniture_image`, `furniture_category`, `partner_product` | lire (offres actives seulement) | lire (offres actives seulement) | lire + ecrire |
| `price_history` | lire (offres actives) | lire (offres actives) | - (ecrit par trigger) |
| `click_out`, `ingestion_run` | - | - | - (back en service role uniquement) |
| `profile` | - | lire le sien | lister, consulter |
| `favorite` | - | lire / ajouter / retirer les siens | - |
| `review` | lire | lire ; creer / modifier / supprimer le sien | supprimer n'importe quel avis |
| Compte Supabase Auth | s'inscrire, se connecter | gerer sa session | bloquer, debloquer, supprimer (pas soi-meme) |
| Generation de scene IA | - | oui, 5 / heure | oui, 5 / heure |

Un compte bloque (`banned_until` dans le futur) recoit 403 sur toute route authentifiee, a chaque requete, sans attendre l'expiration de son jeton.

## Politiques RLS (`009_rls.sql`)

| Table | Politique | Operation | Roles | Condition |
|---|---|---|---|---|
| 6 tables catalogue (hors `offer`) | `catalog_read` | SELECT | anon, authenticated | `true` |
| `offer` | `offer_read_active` (phase 2) | SELECT | anon, authenticated | `status = 'active'` |
| `price_history` | `price_history_read_active` (phase 2) | SELECT | anon, authenticated | l'offre liee est `active` |
| `click_out`, `ingestion_run` | aucune (RLS active, droits retires) | - | - | lecture et ecriture par le back seulement |
| `profile` | `profile_read_own` | SELECT | authenticated | `user_id = auth.uid()` |
| `favorite` | `favorite_read_own` / `favorite_insert_own` / `favorite_delete_own` | SELECT / INSERT / DELETE | authenticated | `user_id = auth.uid()` |
| `review` | `review_read` | SELECT | anon, authenticated | `true` |
| `review` | `review_insert_own` / `review_update_own` / `review_delete_own` | INSERT / UPDATE / DELETE | authenticated | `user_id = auth.uid()` |

Droits revoques : toute ecriture `anon` ; tout acces `anon` a `profile` et `favorite` ; toute ecriture `authenticated` sur le catalogue et `profile`.

## Routes de l'API v1

| Methode | Route | Garde | Limite de debit |
|---|---|---|---|
| GET | `/health` | - | aucune |
| GET | `/furnitures`, `/furnitures/:id`, `/furnitures/:id/offers` | - | globale |
| POST, PATCH, DELETE | `/furnitures[/:id]` | auth + admin | globale |
| GET | `/categories`, `/categories/:id` | - | globale |
| POST, PUT, DELETE | `/categories[/:id]` | auth + admin | globale |
| GET | `/providers`, `/providers/:id` | - | globale |
| POST, PATCH, DELETE | `/providers[/:id]` | auth + admin | globale |
| GET | `/furnitures/:id/reviews` | - | globale |
| GET | `/furnitures/:id/reviews/me` | auth | globale |
| POST | `/furnitures/:id/reviews` | auth | 20 / heure / utilisateur |
| DELETE | `/furnitures/:id/reviews/me` | auth | 20 / heure / utilisateur |
| DELETE | `/reviews/:reviewId` | auth + admin | globale |
| GET, POST, DELETE | `/favorites[/:furnitureId]` | auth | globale |
| POST | `/ai/generate-scene` | auth | 5 / heure / utilisateur |
| GET | `/users`, `/users/:id` | auth + admin | globale |
| POST | `/users/:id/block`, `/users/:id/unblock` | auth + admin | globale |
| DELETE | `/users/:id` | auth + admin | globale |

Limite globale : 300 requetes / 15 min / IP sur `/api/v1` (hors `/health`). Route inconnue : 404.

Identification de l'IP en prod (mesure du 2026-11-04) : une requete traverse Cloudflare puis le proxy Render, `X-Forwarded-For` vaut "client, relais, relais", et une valeur envoyee par le client reste a gauche du client. D'ou `app.set("trust proxy", 3)` : `req.ip` est l'IP vue par Cloudflare, une adresse falsifiee est ignoree, et un faux `CF-Connecting-IP` est rejete par Cloudflare (403). A remesurer si l'hebergement change (avec `1`, les visiteurs partageaient des compteurs).

## Nommer un administrateur

1. Supabase > projet `rlxyptqvtpdhrdpdoiwy` > Table Editor > `profile`.
2. Trouver la ligne du compte (colonne `email`).
3. Passer `role` a `ADMIN` et enregistrer. La contrainte `profile_role_check` n'accepte que `USER` ou `ADMIN`.
4. Se reconnecter dans l'application pour que le front relise le role.

Retirer le role : remettre `USER` de la meme maniere.

## Autres protections

- **SSRF :** la generation IA recoit un `furnitureId`, et non une URL. L'image est lue en base, puis telechargee uniquement depuis une liste blanche (`AI_IMAGE_HOSTS`, par defaut `www.ikea.com`, `images.unsplash.com` et l'hote Supabase). Elle exige `https`, refuse les redirections, limite la taille a 10 Mo et impose un type `image/*`.
- **Erreurs :** une erreur 5xx renvoie un message generique ; aucun message Supabase ni `stack` (hors developpement) n'est renvoye.
- **Mots de passe :** geres uniquement par Supabase Auth. Aucun hash n'est stocke par l'application. Regles Auth en prod : 10 caracteres minimum, minuscule, majuscule et chiffre. La protection contre les mots de passe compromis (HaveIBeenPwned) exige le plan Pro : avertissement des advisors accepte.
- **Reinitialisation :** `resetPasswordForEmail` (message neutre, que le compte existe ou non), lien PKCE valable 1 h, `updateUser` puis deconnexion globale. Les liens generes depuis le tableau de bord Supabase utilisent le flux implicite (`#access_token`) et sont refuses par le front : passer par « Mot de passe oublie ? ».
- **Blocage d'un compte :** `ban_duration` Supabase. Les sessions existantes ne sont pas fermees, mais leur renouvellement est refuse et `requireAuth` repond 403 a chaque requete.

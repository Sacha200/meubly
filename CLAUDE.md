# Meubly

Comparateur de prix de meubles. Monorepo : `meubly-front` (Vue 3), `meubly-back` (Express), `bd/` (schema SQL + ingestion).
Feuille de route : `docs/ROADMAP.md`. Architecture : `docs/diagrams/architecture.md`.

## Environnements

| Env | Front | Back | Base |
|---|---|---|---|
| Local | Vite :5173 | nodemon :5000 | Supabase self-hosted (docker compose, Kong :8000) |
| Prod | Vercel | Render | Supabase cloud `rlxyptqvtpdhrdpdoiwy` (eu-west-3) |

- Toute action sur le projet Supabase cloud (MCP Supabase) touche la PRODUCTION : lecture libre, mais DDL/DML uniquement apres accord explicite, et de preference sur une branche Supabase d'abord.
- Ne jamais lire, afficher ni commiter le contenu de `.env` (racine, `meubly-back/.env`). Les noms de variables sont dans `.env.example` (local uniquement : pas encore versionne, ses cles JWT restent a verifier).

## Commandes

```bash
# Back (meubly-back) - app.js = app Express (testable), server.js = point d'entree
npm run dev            # nodemon server.js
npm run test:run       # vitest run (tests/db exclus)
npm run test:db        # tests sur la stack locale (RLS, API reelle) ; charge le .env RACINE, refuse toute URL Supabase non locale
npm run test:coverage

# Front (meubly-front)
npm run dev
npm run build          # verifier apres tout changement front
npm run test:run       # vitest (jsdom)
npm run test:e2e       # cypress, necessite la stack complete

# Les deux projets (verifies par la CI .github/workflows/ci.yml)
npm run lint           # ESLint flat config, 0 erreur exigee
npm run format:check   # Prettier ; npm run format pour corriger

# Stack locale
docker compose up -d --build
docker compose --profile app -f docker-compose.yml -f docker-compose.dev.yml up -d --build
bash bd/supabase/apply-local.sh bd/supabase/migrations/NNN_x.sql   # migration sur la base LOCALE (supabase_admin)
```

Node 22 en local. Shell principal Windows (PowerShell), Git Bash disponible.

## Architecture back (meubly-back)

Couches strictes : `routes/v1/*` -> `controllers/*` -> `services/*` -> `repositories/*` -> client Supabase (`supabase.js`).
- Les repositories sont les SEULS a appeler `supabase.from(...)` et `supabase.auth.admin` (`authAdminRepository.js`). Pas de requete Supabase dans un controller ou un middleware.
- Le client global utilise la service role : il contourne le RLS. Toute route d'ecriture doit donc etre protegee par `requireAuth` (+ `requireAdmin` si admin) au niveau du routeur. Matrice des droits : `docs/security-matrix.md` (a tenir a jour pour toute nouvelle route ou table).
- Rate limiting (`express-rate-limit`) : global sur `/api/v1`, plus des limites par utilisateur sur l'IA et les avis.
- Validation des entrees a la frontiere (route) : express-validator est deja utilise (`routes/v1/reviews.js`), garder ce pattern ou Zod de facon coherente par module.
- Erreurs : lever des erreurs avec `statusCode`, laisser `middlewares/errorMiddleware.js` repondre. Ne pas renvoyer `error.message` brut d'une erreur Supabase au client.
- ESM (`"type": "module"`), imports avec extension `.js`. Prettier : `.prettierrc` (double quotes, semi, width 100).

## Architecture front (meubly-front)

- Vue 3 + Pinia + Vue Router + PrimeVue 3 + Tailwind 3. Alias `@` -> `src`.
- Majorite des composants en Options API (`export default {}`). Nouveaux composants : `<script setup>` ; ne pas reecrire un composant existant juste pour changer d'API.
- Appels HTTP dans `src/api/*` uniquement (re-exportes par `src/clientapi.js`), base URL via `src/api/apiBase.js` (`VITE_API_BASE_URL`).
- Regle cible : le front n'utilise le SDK Supabase QUE pour l'auth/session. Donnees metier via l'API back. Ne pas ajouter de nouvel appel `supabase.from()` cote front.
- Le role lu dans le store/localStorage sert a l'affichage uniquement ; l'autorisation reelle est cote back + RLS.
- Theme : tokens dans `src/config/themeColors.js` et `tailwind.config.js` (primaire `#B88E2F`). Pas de couleur en dur.
- Accessibilite visee : RGAA / WCAG 2.1 AA (labels, focus visible, contraste, navigation clavier).

## Base de donnees

Tables (snake_case, `public`) : `profile`, `category` (hierarchique `parent_id`), `furniture`, `furniture_category`, `furniture_image`, `partner`, `offer`, `partner_product`, `favorite`, `review`. RLS active sur toutes (`009_rls.sql`) ; `profile.user_id` -> FK `auth.users`, profil cree par le trigger `handle_new_user`.
- Les noms `"User"`, `"Provider"`, `"Furniture"` etc. sont OBSOLETES (renommes par `bd/supabase/migrations/005_*`). Toute occurrence restante est un bug.
- `furniture.cached_min_price` / `cached_nb_offers` sont denormalises : toute ecriture d'offre doit les maintenir.
- Nouvelles migrations : fichier numerote dans `bd/supabase/migrations/NNN_description.sql`, idempotent, avec politiques RLS pour toute nouvelle table.

## Workflow attendu

1. Avant de modifier : expliquer brievement les effets de bord (autres couches, front/back, RLS, donnees prod).
2. TDD : ecrire/mettre a jour le test (Vitest + supertest cote back) avant le code, puis lancer la suite concernee. Ne pas annoncer "ca marche" sans sortie de test.
3. Pas de raccourci sale : si une solution rapide degrade l'architecture, proposer l'alternative propre et expliquer pourquoi.
4. Securite par defaut : valider/sanitiser les entrees, aucun secret en dur, pas d'URL utilisateur appelee cote serveur sans liste blanche.
5. Documenter le code non trivial (JSDoc) et mettre a jour README / `docs/` si l'architecture change.
6. Travailler sur une branche (`feat/...`, `fix/...`), jamais directement sur `master`. Commits conventionnels (`feat(scope): ...`).

## Pieges connus

- Ne rien executer a l'import d'un module back (pas de `listen`, pas d'appel reseau) : les tests importent `app.js` directement.
- supabase-js ne leve pas sur erreur HTTP : toujours lire `error` dans `{ data, error }`.
- Un `router.use(requireAuth)` sans prefixe dans un routeur v1 s'appliquerait a toute l'API : mettre la garde par route.
- Le role `ADMIN` ne s'attribue que dans le tableau de bord Supabase (`profile.role`) ; aucun chemin applicatif ne doit le permettre.
- `meubly-back/.env` ne definit pas `SUPABASE_URL` : hors Docker, `npm start` echoue sans variables exportees.
- `.gitignore` ignore `*.md` sauf exceptions : ajouter une exception pour tout nouveau document a versionner.
- Stack dev Docker : `node_modules` vit dans un volume anonyme, reinstalle seulement si nodemon/vite manque. Apres un changement de dependances : `up -d --build --renew-anon-volumes meubly-back meubly-front`.
- Node 22 obligatoire (images Docker, `engines` du back) : supabase-js >= 2.118 plante a l'import sous Node 20.
- Fins de ligne forcees en LF (`.gitattributes`) ; Prettier echoue sur du CRLF.

## Skills utiles (installes dans `.claude/skills`)

- `supabase`, `supabase-postgres-best-practices` : tout travail schema, RLS, requetes, migrations.
- `web-design-guidelines` : audit UI/accessibilite d'un composant.
- `ui-ux-pro-max` : direction visuelle, palettes, patterns UX.
- Process (plugin superpowers) : `brainstorming` avant une fonctionnalite, `test-driven-development`, `systematic-debugging` sur un bug, `verification-before-completion` avant de conclure. `/simplify` et `/code-review` en fin de lot.

# Meubly

## Description

**Meubly** est une application de comparaison et de recherche de meubles.
Le projet combine :
- un frontend **Vue 3** pour l'experience utilisateur ;
- un backend **Express.js** pour la logique metier ;
- **Supabase** pour l'authentification, les donnees et le storage (cloud en prod, stack Supabase CLI en local) ;
- des integrations IA/media (Gemini, Replicate, OpenRouter, Unsplash) pour l'enrichissement de contenu.

---

## Architecture

```mermaid
flowchart TB

    %% ── Externe (hors Docker) ──────────────────────────────
    DEPLOY["☁️ Déploiement cloud<br/>GitHub → Vercel (front)<br/>GitHub → Render (back)"]
    AI["🤖 Services IA<br/>Gemini · Replicate<br/>Unsplash · OpenRouter"]

    %% ── Docker Compose ─────────────────────────────────────
    subgraph DOCKER["🐳 Docker Compose - Environnement local"]
        direction LR

        subgraph ROW1["&nbsp;"]
            direction LR
            FRONT["🌐 Navigateur<br/>Vue 3 · Vite<br/>Pinia · Vue Router"]
            BACK["⚙️ meubly-back<br/>Express · Supabase Auth<br/>Helmet · CORS · express-validator"]
            DEVOPS["🔧 DevOps<br/>SonarQube (qualité)<br/>Mailpit (sandbox SMTP)"]
        end

        subgraph ROW2["&nbsp;"]
            direction LR
            SUPA["🗄️ Supabase CLI (hors compose)<br/>API :54321 · Auth · REST<br/>Storage · PostgreSQL 17"]
            ING["📥 Ingestion<br/>CSV / JSON · IKEA<br/>CRON jobs"]
        end
    end

    %% ── Relations externes ─────────────────────────────────
    DEPLOY -.->|auto-deploy front| FRONT
    DEPLOY -.->|auto-deploy back| BACK
    BACK -->|HTTP REST génération IA| AI

    %% ── Relations internes ─────────────────────────────────
    FRONT -->|REST API logique métier| BACK
    FRONT -->|SDK Supabase JS auth·session| SUPA
    BACK -->|Supabase client DB·Storage| SUPA
    BACK -->|scan qualité SonarQube CI| DEVOPS
    ING -->|pg direct INSERT catalogue| SUPA
```

Documentation detaillee :
- `docs/diagrams/architecture.md`

---

## Stack technique

| Couche | Technologies | Usage |
|---|---|---|
| Frontend | Vue 3, Vite, Pinia, PrimeVue, Tailwind | Interface utilisateur |
| Backend | Node.js, Express, express-validator, express-rate-limit, Supabase Auth, Vitest | API metier |
| Data Platform | Supabase (cloud en prod, Supabase CLI 2.122.1 en local) | Auth + donnees + API |
| Base de donnees | PostgreSQL 17 (prod et local) | Stockage relationnel |
| Ingestion | Service `bd/ingestion` (CRON, CSV/JSON, IKEA adapter) | Import de donnees |
| Qualite | SonarQube Community, Vitest, Cypress | Analyse qualite + tests |
| Email dev | Mailpit | Sandbox SMTP locale |

---

## Securite et roles

Detail complet (roles, politiques RLS, garde de chaque route) : [`docs/security-matrix.md`](docs/security-matrix.md).

- **Comptes :** geres uniquement par Supabase Auth (aucun hash de mot de passe stocke par l'application). Le profil est cree par un trigger avec `role = 'USER'`.
- **Ecritures :** toute route d'ecriture exige un jeton (`requireAuth`) ; le catalogue, les partenaires et les comptes exigent en plus `ADMIN` (`requireAdmin`). Un compte bloque recoit 403.
- **RLS :** active sur toutes les tables publiques (schema : `supabase/migrations/`) : lecture publique du catalogue et des avis, `profile` / `favorite` / avis limites a leur proprietaire.
- **Limitation de debit :** 300 requetes / 15 min / IP sur l'API, 5 generations IA / heure et 20 ecritures d'avis / heure par utilisateur. En prod, l'IP est celle vue par Cloudflare (`trust proxy 3`, voir `meubly-back/app.js`).
- **Mot de passe oublie :** lien « Mot de passe oublie ? » sur la page de connexion, email de reinitialisation (lien valable 1 h, a ouvrir dans le meme navigateur : flux PKCE), page `/reinitialiser-mot-de-passe`, puis deconnexion de toutes les sessions. Regles : 10 caracteres minimum, une majuscule, une minuscule, un chiffre.
- **Emails en prod :** SMTP Brevo, expediteur `no-reply@prixoli.fr`. Les modeles sont versionnes dans `bd/supabase/email-templates/` et recopies a la main dans le tableau de bord Supabase (Authentication > Emails > Templates).
- **Avis :** un avis par utilisateur et par meuble (note 1-5, commentaire optionnel de 1000 caracteres max), modifiable et supprimable par son auteur, supprimable par un admin.
- **Nommer un administrateur :** tableau de bord Supabase > Table Editor > `profile` > ligne du compte > `role = ADMIN`, puis se reconnecter. Aucun chemin applicatif ne permet d'obtenir ce role.

---

## Prerequis

- Node.js 22 (obligatoire : supabase-js >= 2.118 plante a l'import sous Node 20)
- npm 10+
- Docker Desktop + Docker Compose v2

---

## Base locale (Supabase CLI)

La base locale est la stack officielle Supabase CLI, en Postgres 17 comme la prod. Version figee : toujours `npx supabase@2.122.1`.

```bash
npx supabase@2.122.1 start      # demarre la stack (Docker Desktop requis)
npx supabase@2.122.1 status     # URL et cles locales (cles de demo publiques)
npx supabase@2.122.1 db reset   # recree la base : supabase/migrations + supabase/seed.sql
npx supabase@2.122.1 stop
```

| Service | URL |
|---|---|
| API Supabase | `http://127.0.0.1:54321` (`http://host.docker.internal:54321` depuis un conteneur) |
| PostgreSQL | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Studio | `http://127.0.0.1:54323` |
| Mailpit (emails locaux) | `http://127.0.0.1:54324` |

- Schema : `supabase/migrations/` (baseline tiree de la prod le 2026-11-04, puis une migration par evolution ; nouvelles migrations via `migration new <nom>`). Les anciennes migrations 001-010 sont archivees dans `bd/supabase/migrations/archive/`.
- Donnees : `supabase/seed.sql`, synthetique (quelques meubles, IKEA et deux marchands de demo). Catalogue prod complet : `scripts/import-prod-catalog.md`.
- Liaison au projet cloud (`login`, `link`) : a lancer dans son propre terminal (TTY requis).

---

## Configuration environnement

```bash
cp .env.example .env
```

Renseigner `SUPABASE_PUBLIC_URL`, `ANON_KEY` et `SERVICE_ROLE_KEY` avec les valeurs de `npx supabase@2.122.1 status`, puis, au besoin, les cles API externes (`REPLICATE_API_TOKEN`, `OPENROUTER_API_KEY`, `UNSPLASH_ACCESS_KEY`). `.env` n'est jamais versionne.

---

## Demarrage rapide (sans Docker pour front/back)

```bash
cd meubly-back && npm install && npm run dev     # http://localhost:5000
cd meubly-front && npm install && npm run dev    # http://localhost:5173
```

---

## Demarrage Docker (front et back)

La stack CLI doit tourner (`supabase start`). Compose ne contient que l'application et les outils :

| Profil | Services | Commande |
|---|---|---|
| `app` | `meubly-back` + `meubly-front` en hot reload | `docker compose --profile app -f docker-compose.yml -f docker-compose.dev.yml up -d --build` |
| `ingestion` | service `ingestion` (gele pendant la phase 2) | `docker compose --profile ingestion up -d ingestion` |
| `sonar` | `sonarqube` + `sonarqube_db` | `docker compose --profile sonar up -d` |

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f meubly-back
docker compose -f docker-compose.yml -f docker-compose.dev.yml stop meubly-back meubly-front
```

> Ne pas lancer `docker compose down --remove-orphans` : les conteneurs de la stack CLI portent aussi l'etiquette `meubly` et seraient supprimes.

Apres un changement de dependances : `up -d --build --renew-anon-volumes meubly-back meubly-front`.

### Problemes frequents

| Symptome | Cause probable | Solution |
|---|---|---|
| Tests DB : "ANON_KEY / SERVICE_ROLE_KEY absentes" | `.env` racine incomplet | Recopier les valeurs de `supabase status` |
| Le back en conteneur ne joint pas Supabase | Stack CLI arretee | `npx supabase@2.122.1 start` |
| Port `5000` ou `5173` deja utilise | Autre processus | verifier avec `netstat -ano` |
| Hot reload inactif sous Windows | Polling desactive | `CHOKIDAR_USEPOLLING=true` dans le dev override |

---

## Ingestion de donnees

Le service `ingestion` tourne avec le profil `ingestion`.

### Lancer l'ingestion en service

```bash
docker compose --profile ingestion up -d ingestion
```

### Run unique (batch manuel)

```bash
docker compose --profile ingestion run --rm -e RUN_ONCE=true ingestion
```

### Logs ingestion

```bash
docker logs -f ingestion
```

Notes IKEA :
- Par defaut, tentative en guest token
- Si `401 Unauthorized`, definir `IKEA_TOKEN` dans `.env`
- Activer `IKEA_DEBUG=true` pour investiguer le parsing

---

## Qualite de code (SonarQube)

SonarQube est integre dans `docker-compose.yml` avec le profil `sonar`.

### Demarrer SonarQube

```bash
docker compose --profile sonar up -d
```

UI SonarQube :
- `http://localhost:9000` (premiere connexion : `admin` / `admin`)

### Config de scan

- `meubly-back/sonar-project.properties`
- `meubly-front/sonar-project.properties`

### Analyse backend (exemple)

```bash
cd meubly-back
npm run test:coverage

# depuis la racine du repo (PowerShell)
$env:SONAR_TOKEN="VOTRE_TOKEN"
$p=(Get-Location).Path
docker run --rm `
  -e SONAR_HOST_URL="http://host.docker.internal:9000" `
  -e SONAR_TOKEN=$env:SONAR_TOKEN `
  -v "$p/meubly-back:/usr/src" `
  sonarsource/sonar-scanner-cli:latest
```

---

## URLs locales utiles

| Service | URL |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:5000/api/v1` |
| API Supabase (CLI) | `http://127.0.0.1:54321` |
| Supabase Studio | `http://127.0.0.1:54323` |
| Mailpit UI | `http://127.0.0.1:54324` |
| SonarQube | `http://localhost:9000` |

---

## Commandes utiles

```bash
# Etat des conteneurs (tous, pas seulement ceux du compose)
docker ps

# Etat des conteneurs du projet uniquement
docker compose ps

# Logs globaux en temps reel
docker compose logs -f

# Logs d'un service specifique
docker compose logs -f meubly-back
docker compose logs -f meubly-front

# Rebuild uniquement le backend
docker compose up -d --build meubly-back

# Rebuild uniquement le frontend
docker compose up -d --build meubly-front

# Redemarrer un service (sans rebuild)
docker compose restart meubly-back

# Stopper front/back (la stack Supabase CLI se stoppe avec `npx supabase@2.122.1 stop`)
docker compose stop meubly-back meubly-front

# Base locale propre : `npx supabase@2.122.1 db reset` (jamais `down --remove-orphans`)

# Inspecter les variables d'environnement d'un service
docker compose exec back env | sort

# Statistiques ressources en temps reel
docker stats
```

---

## Base de donnees et SQL

- Schema de reference : `supabase/migrations/` (voir "Base locale (Supabase CLI)").
- `bd/supabase/` : modeles d'emails, anciennes migrations archivees et scripts historiques (plus utilises pour initialiser la base).

---

## Tests

### Backend

```bash
cd meubly-back
npm run test
npm run test:run
npm run test:coverage
```

### Frontend

```bash
cd meubly-front
npm run test
npm run test:run
npm run test:coverage
npm run test:e2e
```

---

## Documentation projet

| Document | Description |
|---|---|
| `docs/diagrams/architecture.md` | Architecture globale detaillee |
| `docker-compose.yml` | Stack principale (Supabase, app, sonar, ingestion) |
| `docker-compose.dev.yml` | Overrides dev pour front/back en hot reload |
| `meubly-back/sonar-project.properties` | Configuration Sonar backend |
| `meubly-front/sonar-project.properties` | Configuration Sonar frontend |

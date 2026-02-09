# Meubly - Application de comparaison de meubles

## 🚀 Démarrage rapide

### 1. Démarrer le backend
```bash
cd meubly-back
npm run dev
```
Le serveur backend sera accessible sur `http://localhost:5000`

### 2. Démarrer le frontend
```bash
cd meubly-front
npm run dev
```
L'application sera accessible sur `http://localhost:5173`

## 🐳 Démarrage avec Docker (Supabase local)

### 1. Préparer les variables d'environnement
Copie le fichier `.env.example` en `.env` à la racine et ajuste les secrets :
```bash
cp .env.example .env
```

### 2. Lancer la stack complète
```bash
docker compose up --build
```

### 2bis. Lancer en mode dev (profil app)
```bash
docker compose --profile app -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

### 2ter. Batch d’ingestion (multi-partners)
Le service `ingestion` tourne avec le profil `app` et exécute un batch selon `BATCH_CRON` (voir `.env` / `.env.example`).

- **Configurer IKEA (`ikea_api`)** :
  - Par défaut on tente un **guest token**.
  - Si IKEA renvoie `401 Unauthorized`, tu peux copier un token depuis les cookies sur ikea.com et le fournir via `IKEA_TOKEN`.
  - Active `IKEA_DEBUG=true` pour afficher la forme des réponses (utile pour ajuster le parsing).

- **Déclencher une ingestion manuelle (run once)** :

```bash
docker compose --profile app -f docker-compose.yml -f docker-compose.dev.yml run --rm -e RUN_ONCE=true ingestion
```

- **Voir les logs ingestion** :

```bash
docker logs -f ingestion
```

### Commandes utiles Docker
```bash
# Voir les conteneurs
docker ps

# Voir les logs
docker compose logs -f

# Rebuild un service (ex: back ou front)
docker compose --profile app -f docker-compose.yml -f docker-compose.dev.yml up -d --build meubly-back
docker compose --profile app -f docker-compose.yml -f docker-compose.dev.yml up -d --build meubly-front

# Stopper les services
docker compose down

# Nettoyer les volumes (attention: supprime la DB locale)
docker compose down -v
```

### 3. URLs utiles
- Front: `http://localhost:5173`
- Back: `http://localhost:5000/api/v1`
- Supabase API (Kong): `http://localhost:8000`
- Supabase Studio: `http://localhost:3000`

### 4. Base de données
Les scripts SQL sont dans `bd/supabase/`. Tu peux les exécuter via Supabase Studio (SQL Editor) une fois la stack lancée.

Note: sur une DB locale fraîche (après `docker compose down -v`), le schéma applicatif Meubly est aussi monté en init (`bd/supabase/full_schema_model.sql`) et sera créé automatiquement au premier démarrage.

## 📋 Prérequis

- Node.js installé
- Les dépendances installées dans les deux dossiers (`npm install`)

## 🔧 Configuration

L'API est configurée pour utiliser `http://localhost:5000` par défaut.
Les données de comparaison sont maintenant disponibles pour toutes les catégories.

## ✅ Statut

- ✅ Backend fonctionnel
- ✅ Frontend fonctionnel  
- ✅ Base de données corrigée
- ✅ API de comparaison opérationnelle
- ✅ Toutes les catégories ont des données

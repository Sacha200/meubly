
## **ANNEXE D - GUIDE D'INSTALLATION ET D'UTILISATION**

### **D.1 - Prérequis et installation**

#### **Prérequis système**
- **Node.js** version 18 ou supérieure
- **npm** (inclus avec Node.js)
- **Git** pour cloner le repository
- **Compte Supabase** pour la base de données

#### **Installation du projet**

**1. Cloner le repository**
```bash
git clone [URL_DU_REPO]
cd meubly
```

**2. Configuration de la base de données Supabase**
- Créer un projet sur [supabase.com](https://supabase.com)
- Récupérer les clés d'API (URL et clé anonyme)
- Créer les tables selon le schéma de l'Annexe C

**3. Configuration des variables d'environnement**

Créer un fichier `.env` dans `meubly-back/` :
```env
# Supabase Configuration
SUPABASE_URL=votre_url_supabase
SUPABASE_ANON_KEY=votre_cle_anonyme_supabase

# JWT Secret
JWT_SECRET=votre_secret_jwt

# Server Configuration
PORT=5000
NODE_ENV=development
```

Créer un fichier `.env` dans `meubly-front/` :
```env
# API Configuration
VITE_API_URL=http://localhost:5000/api/v1

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### **D.2 - Lancement du projet**

#### **Installation des dépendances**

**Backend :**
```bash
cd meubly-back
npm install
```

**Frontend :**
```bash
cd meubly-front
npm install
```

#### **Démarrage des services**

**1. Démarrer le backend**
```bash
cd meubly-back
npm run dev
```
Le serveur sera accessible sur `http://localhost:5000`

**2. Démarrer le frontend**
```bash
cd meubly-front
npm run dev
```
L'application sera accessible sur `http://localhost:5173`

#### **Vérification de l'installation**

**1. Test du backend**
```bash
curl http://localhost:5000/api/v1/furnitures
```
Doit retourner une liste de meubles au format JSON.

**2. Test du frontend**
Ouvrir `http://localhost:5173` dans le navigateur.
La page d'accueil doit s'afficher avec la liste des produits.

### **D.3 - Guide utilisateur**

#### **Fonctionnalités principales**

**1. Navigation et recherche**
- **Page d'accueil** : Affichage des produits populaires
- **Barre de recherche** : Recherche par nom de produit
- **Filtres par catégorie** : Canapés, Tables, Chaises, etc.
- **Navigation responsive** : Adaptation mobile/desktop

**2. Gestion des favoris**
- **Ajouter aux favoris** : Clic sur l'icône cœur
- **Voir les favoris** : Page dédiée accessible depuis le header
- **Supprimer des favoris** : Clic sur l'icône cœur dans les favoris

**3. Comparaison de prix**
- **Page de détail** : Clic sur "Comparer" depuis une carte produit
- **Tableau comparatif** : Affichage des prix par fournisseur
- **Liens directs** : Accès direct aux sites e-commerce

**4. Authentification**
- **Inscription** : Formulaire d'inscription avec validation
- **Connexion** : Formulaire de connexion sécurisé
- **Déconnexion** : Bouton de déconnexion dans le header

#### **Interface d'administration**

**Accès :** Connectez-vous avec un compte administrateur

**Gestion des utilisateurs :**
- Liste des utilisateurs
- Création de nouveaux utilisateurs
- Modification des rôles
- Suppression d'utilisateurs

**Gestion des produits :**
- Liste des meubles
- Ajout de nouveaux produits
- Modification des informations
- Suppression de produits

**Gestion des fournisseurs :**
- Liste des fournisseurs
- Ajout de nouveaux fournisseurs
- Modification des informations
- Suppression de fournisseurs

#### **Parcours utilisateur typique**

**1. Découverte des produits**
```
Accueil → Parcours des catégories → Sélection d'un produit
```

**2. Recherche ciblée**
```
Barre de recherche → Filtrage par catégorie → Comparaison de prix
```

**3. Gestion des favoris**
```
Ajout aux favoris → Consultation des favoris → Achat direct
```

#### **FAQ et dépannage**

**Q : L'application ne se lance pas**
A : Vérifiez que Node.js est installé et que les ports 5000 et 5173 sont libres.

**Q : Erreur de connexion à la base de données**
A : Vérifiez les variables d'environnement Supabase dans le fichier `.env`.

**Q : Les images ne s'affichent pas**
A : Vérifiez que les assets sont bien présents dans le dossier `public/assets/`.

**Q : Erreur d'authentification**
A : Vérifiez la configuration Auth0 dans les variables d'environnement.

#### **Commandes utiles**

**Tests automatisés :**
```bash
# Tests unitaires
npm run test

# Tests E2E
npm run test:e2e

# Tous les tests
npm run test:all
```

**Build de production :**
```bash
# Backend
npm run build

# Frontend
npm run build
```

**Base de données :**
```bash
# Peupler la base de données
npm run seed
```

---

**Ce guide complet permet à tout développeur de comprendre, installer et utiliser le projet Meubly de manière autonome.**

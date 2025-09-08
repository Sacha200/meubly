# Tests pour Meubly Frontend

## 📋 Vue d'ensemble


## 🌐 Tests end-to-end (Cypress)

### 5.1 Présentation de Cypress

Cypress représente l'outil de référence pour les tests end-to-end dans l'écosystème JavaScript moderne. Son choix pour le projet Meubly s'est imposé naturellement grâce à ses avantages techniques exceptionnels et son intégration parfaite avec Vue.js.

#### 5.1.1 Architecture et avantages techniques

**Architecture moderne :** Contrairement aux solutions traditionnelles comme Selenium, Cypress exécute les tests directement dans le navigateur, éliminant ainsi les problèmes de synchronisation et offrant une fiabilité exceptionnelle. Cette approche permet une gestion automatique des attentes asynchrones et des états du DOM.

**Fiabilité et stabilité :** Cypress se distingue par sa capacité à attendre automatiquement que les éléments soient prêts avant d'interagir avec eux, éliminant les erreurs de timing qui plaguent souvent les tests E2E traditionnels.

**Capacités de debugging avancées :** L'outil offre une interface graphique intuitive avec captures d'écran automatiques à chaque étape, enregistrement vidéo des tests, et un mode temps réel permettant de voir les actions s'exécuter en direct.

**Performance supérieure :** Les tests Cypress s'exécutent plus rapidement que les solutions traditionnelles grâce à leur architecture optimisée et leur gestion intelligente des ressources.

#### 5.1.2 Intégration avec Vue.js

L'intégration de Cypress avec Vue.js s'avère particulièrement harmonieuse :

- **Support natif :** Cypress détecte automatiquement les applications Vue.js et s'adapte à leur cycle de vie
- **Configuration simple :** L'intégration avec Vite se fait sans configuration complexe
- **Gestion des états :** Cypress interagit parfaitement avec les stores Pinia et les composants réactifs
- **Détection automatique :** Les composants Vue sont automatiquement détectés et peuvent être testés de manière fiable

### 5.2 Configuration et installation

#### 5.2.1 Installation des dépendances

```bash
npm install cypress --save-dev
```

#### 5.2.2 Configuration initiale

Le fichier `cypress.config.js` configure l'environnement de test :

```javascript
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.js',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000
  }
})
```

## 📸 **Organisation des captures d'écran pour le mémoire**

### **Disposition recommandée dans le mémoire :**

#### **Page 1 : Introduction et configuration**
**📸 Capture d'écran 1 : Interface principale de Cypress**
*Montrer l'interface Cypress avec la liste des tests disponibles et les options de configuration*

**📸 Capture d'écran 2 : Structure des fichiers de test**
*Montrer l'arborescence des dossiers cypress dans l'éditeur*

**📸 Capture d'écran 4 : Sélection du navigateur (Electron)**
*Montrer l'écran de sélection du navigateur avec Electron sélectionné*

**Commentaire :** Ces captures introduisent l'environnement de test et montrent la configuration initiale. Disposer en format 2x2 ou 2x1 selon l'espace disponible.

---

#### **Page 2 : Tests de la page d'accueil**
**📸 Capture d'écran 3 : Test d'affichage du header en cours**
*Montrer Cypress en train de tester l'affichage du header avec les éléments surlignés*

**📸 Capture d'écran 4 : Test de recherche en cours**
*Montrer Cypress en train de saisir un terme de recherche et cliquer sur le bouton*

**📸 Capture d'écran 5 : Test de basculement de thème**
*Montrer Cypress en train de cliquer sur le bouton de thème et l'interface basculer entre clair et sombre*

**📸 Capture d'écran 6 : Test d'affichage des produits**
*Montrer Cypress en train de vérifier l'affichage des cartes produits*

**Commentaire :** Ces captures illustrent les tests principaux de la page d'accueil. Disposer en format 2x2 pour montrer la progression des tests.

---

#### **Page 3 : Tests d'authentification et fonctionnalités**
**📸 Capture d'écran 7 : Test de connexion en cours**
*Montrer Cypress en train de remplir le formulaire de connexion*

**📸 Capture d'écran 8 : Test d'inscription**
*Montrer Cypress en train de remplir le formulaire d'inscription*

**📸 Capture d'écran 9 : Test de la page produit**
*Montrer Cypress en train de naviguer sur la page produit et vérifier les éléments*

**Commentaire :** Ces captures montrent les tests des fonctionnalités utilisateur critiques. Disposer en format 1x3 ou 2x2 selon l'importance.

---

#### **Page 4 : Résultats et rapports**
**📸 Capture d'écran 10 : Interface principale de Cypress**
*Montrer l'interface Cypress avec la liste des tests et les options*

**📸 Capture d'écran 11 : Test en cours d'exécution**
*Montrer un test en cours avec les actions visibles en temps réel*

**📸 Capture d'écran 12 : Résultats des tests**
*Montrer le rapport final avec les statistiques de réussite/échec*

**📸 Capture d'écran 13 : Rapport de couverture E2E**
*Montrer un rapport de couverture avec les pourcentages de tests*

**Commentaire :** Ces captures concluent la démonstration en montrant les résultats et métriques. Disposer en format 2x2 pour un impact visuel optimal.

---

### **Conseils de mise en page :**

1. **Format des captures :** Utiliser des captures haute résolution (minimum 1200px de large)
2. **Légendes :** Placer les légendes sous chaque capture avec une police plus petite
3. **Espacement :** Laisser un espacement de 1-2cm entre les captures
4. **Bordures :** Ajouter des bordures fines (1px) pour délimiter les captures
5. **Numérotation :** Maintenir la numérotation cohérente avec le texte
6. **Références :** Citer les captures dans le texte avec "voir Figure X"

### **Exemple de légende complète :**

```
Figure 5.1 : Interface principale de Cypress
L'interface graphique de Cypress affiche la liste des tests disponibles pour le projet Meubly.
On distingue clairement les fichiers de test (home.cy.js, authentication.cy.js, product-detail.cy.js)
et les options de configuration accessibles depuis la barre latérale.
```

**📸 Capture d'écran 1 : Interface principale de Cypress**
*Montrer l'interface Cypress avec la liste des tests disponibles et les options de configuration*

### 5.3 Structure des tests E2E

#### 5.3.1 Organisation des fichiers

```
cypress/
├── e2e/
│   ├── home.cy.js           # Tests de la page d'accueil
│   ├── authentication.cy.js # Tests d'authentification
│   └── product-detail.cy.js # Tests de la page produit
├── support/
│   ├── commands.js          # Commandes personnalisées
│   └── e2e.js              # Configuration globale
├── fixtures/
│   ├── users.json          # Données de test utilisateurs
│   └── products.json       # Données de test produits
└── cypress.config.js        # Configuration principale
```

#### 5.3.2 Commandes personnalisées

Le fichier `cypress/support/commands.js` définit des commandes réutilisables :

```javascript
// Authentification
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login')
  cy.get('[data-testid="email-input"]').type(email)
  cy.get('[data-testid="password-input"]').type(password)
  cy.get('[data-testid="login-button"]').click()
  cy.url().should('include', '/dashboard')
})

// Navigation
Cypress.Commands.add('searchProduct', (searchTerm) => {
  cy.get('[data-testid="search-input"]').type(searchTerm)
  cy.get('[data-testid="search-button"]').click()
})

// Vérifications
Cypress.Commands.add('shouldBeVisibleAndContain', (selector, text) => {
  cy.get(selector).should('be.visible').and('contain', text)
})
```





 



  

**📸 Capture d'écran 4 : Test de recherche en cours**
*Montrer Cypress en train de saisir un terme de recherche et cliquer sur le bouton*

#### 5.4.3 Tests de basculement de thème

```javascript
describe('Page d\'accueil - Basculement de thème', () => {
  beforeEach(() => {
    cy.visit('/')
  });

  it('should toggle between light and dark themes', () => {
    // Vérification du bouton de thème
    cy.get('[data-testid="theme-toggle"]').should('be.visible')
    cy.get('[data-testid="theme-toggle"]').should('have.attr', 'aria-label', 'Basculer le thème')
    
    // Test du thème clair par défaut
    cy.get('body').should('not.have.class', 'dark')
    cy.get('[data-testid="theme-toggle"]').should('contain', '🌙')
    
    // Basculement vers le thème sombre
    cy.get('[data-testid="theme-toggle"]').click()
    cy.get('body').should('have.class', 'dark')
    cy.get('[data-testid="theme-toggle"]').should('contain', '☀️')
    
    // Basculement vers le thème clair
    cy.get('[data-testid="theme-toggle"]').click()
    cy.get('body').should('not.have.class', 'dark')
    cy.get('[data-testid="theme-toggle"]').should('contain', '🌙')
  });

  it('should persist theme preference', () => {
    // Changement de thème
    cy.get('[data-testid="theme-toggle"]').click()
    cy.get('body').should('have.class', 'dark')
    
    // Rechargement de la page
    cy.reload()
    
    // Vérification de la persistance
    cy.get('body').should('have.class', 'dark')
    cy.get('[data-testid="theme-toggle"]').should('contain', '☀️')
  });
});
```

**📸 Capture d'écran 5 : Test de basculement de thème**
*Montrer Cypress en train de cliquer sur le bouton de thème et l'interface basculer entre clair et sombre*



**📸 Capture d'écran 6 : Test d'affichage des produits**
*Montrer Cypress en train de vérifier l'affichage des cartes produits*

### 5.5 Tests d'authentification

#### 5.5.1 Tests de connexion


**📸 Capture d'écran 7 : Test de connexion en cours**
*Montrer Cypress en train de remplir le formulaire de connexion*

#### 5.5.2 Tests d'inscription

```javascript
describe('Authentification - Inscription', () => {
  beforeEach(() => {
    cy.visit('/register')
  });

  it('should register with valid information', () => {
    const testEmail = `test${Date.now()}@example.com`
    
    cy.get('[data-testid="firstname-input"]').type('Jean')
    cy.get('[data-testid="lastname-input"]').type('Dupont')
    cy.get('[data-testid="email-input"]').type(testEmail)
    cy.get('[data-testid="password-input"]').type('Password123!')
    cy.get('[data-testid="confirm-password-input"]').type('Password123!')
    cy.get('[data-testid="register-button"]').click()
    
    cy.get('[data-testid="success-message"]').should('contain', 'Compte créé avec succès')
    cy.url().should('include', '/login')
  });

  it('should validate password strength', () => {
    cy.get('[data-testid="password-input"]').type('weak')
    cy.get('[data-testid="password-strength"]').should('contain', 'Faible')
    cy.get('[data-testid="password-input"]').clear().type('StrongPass123!')
    cy.get('[data-testid="password-strength"]').should('contain', 'Fort')
  });
});
```

**📸 Capture d'écran 8 : Test d'inscription**
*Montrer Cypress en train de remplir le formulaire d'inscription*

### 5.6 Tests de la page produit

#### 5.6.1 Tests d'affichage des détails

```javascript
describe('Page produit - Affichage des détails', () => {
  beforeEach(() => {
    cy.visit('/produit/1')
  });

  it('should display product information', () => {
    cy.get('[data-testid="product-title"]').should('be.visible')
    cy.get('[data-testid="product-price"]').should('be.visible')
    cy.get('[data-testid="product-description"]').should('be.visible')
    cy.get('[data-testid="product-images"]').should('be.visible')
    cy.get('[data-testid="product-specifications"]').should('be.visible')
  });

  it('should display comparison table', () => {
    cy.get('[data-testid="comparison-table"]').should('be.visible')
    cy.get('[data-testid="table-headers"]').should('contain', 'Prix')
    cy.get('[data-testid="table-headers"]').should('contain', 'Livraison')
    cy.get('[data-testid="table-headers"]').should('contain', 'Garantie')
  });

  it('should handle favorite functionality', () => {
    cy.get('[data-testid="favorite-button"]').should('be.visible')
    cy.get('[data-testid="favorite-button"]').click()
    cy.get('[data-testid="favorite-button"]').should('have.class', 'favorited')
    cy.get('[data-testid="favorite-button"]').click()
    cy.get('[data-testid="favorite-button"]').should('not.have.class', 'favorited')
  });
});
```

**📸 Capture d'écran 9 : Test de la page produit**
*Montrer Cypress en train de naviguer sur la page produit et vérifier les éléments*

### 5.7 Exécution et résultats

#### 5.7.1 Commandes d'exécution

```bash
# Ouvrir l'interface Cypress
npm run cypress:open

# Lancer les tests en mode headless
npm run cypress:run

# Lancer un test spécifique
npx cypress run --spec "cypress/e2e/home.cy.js"

# Lancer tous les tests E2E
npm run test:e2e
```

#### 5.7.2 Interface Cypress

L'interface Cypress offre une expérience de développement exceptionnelle :

- **Mode temps réel :** Visualisation en direct des tests s'exécutant
- **Debugging avancé :** Possibilité de mettre des points d'arrêt et d'inspecter l'état
- **Captures automatiques :** Screenshots à chaque étape et vidéos des tests
- **Logs détaillés :** Informations complètes sur chaque action et assertion

**📸 Capture d'écran 10 : Interface principale de Cypress**
*Montrer l'interface Cypress avec la liste des tests et les options*

**📸 Capture d'écran 11 : Test en cours d'exécution**
*Montrer un test en cours avec les actions visibles en temps réel*

**📸 Capture d'écran 12 : Résultats des tests**
*Montrer le rapport final avec les statistiques de réussite/échec*

#### 5.7.3 Rapports et métriques

Cypress génère des rapports détaillés incluant :

- **Statistiques globales :** Nombre de tests passés/échoués
- **Temps d'exécution :** Durée de chaque test et total
- **Captures d'écran :** Images des étapes importantes
- **Vidéos :** Enregistrement complet des tests
- **Logs :** Traçabilité complète des actions

**📸 Capture d'écran 13 : Rapport de couverture E2E**
*Montrer un rapport de couverture avec les pourcentages de tests*

### 5.8 Avantages et bénéfices

#### 5.8.1 Fiabilité des tests

Les tests Cypress offrent une fiabilité exceptionnelle grâce à :
- **Gestion automatique des attentes :** Plus de problèmes de timing
- **Exécution dans le navigateur :** Environnement identique à l'utilisateur final
- **Retry automatique :** Gestion intelligente des flakiness
- **Isolation des tests :** Chaque test s'exécute dans un contexte propre

#### 5.8.2 Productivité développeur

L'expérience développeur est grandement améliorée par :
- **Interface graphique intuitive :** Visualisation claire des tests
- **Mode temps réel :** Feedback immédiat sur les modifications
- **Commandes personnalisées :** Réutilisation du code de test
- **Documentation excellente :** Ressources complètes et exemples

#### 5.8.3 Intégration continue

Cypress s'intègre parfaitement dans les pipelines CI/CD :
- **Mode headless :** Exécution automatisée sur les serveurs
- **Rapports détaillés :** Intégration avec les outils de reporting
- **Parallélisation :** Exécution simultanée de plusieurs tests
- **Notifications :** Alertes automatiques en cas d'échec


## 📊 Couverture de code

### Générer un rapport de couverture

```bash
npm run test:coverage
```

Le rapport sera généré dans le dossier `coverage/` avec :
- Rapport HTML interactif
- Rapport JSON pour les outils CI/CD
- Statistiques détaillées par fichier






### Configuration Vitest

Le fichier `vitest.config.js` configure :
- Environnement jsdom pour les tests Vue
- Mocks globaux (localStorage, fetch, etc.)
- Couverture de code
- Alias de chemins

### Configuration Cypress

Le fichier `cypress.config.js` configure :
- URL de base
- Timeouts
- Viewport
- Capture de screenshots

### Configuration Supabase pour les tests

Pour les tests d'authentification avec Supabase, il est recommandé de :

```javascript
// Dans cypress/support/e2e.js
beforeEach(() => {
  // Nettoyer l'état d'authentification avant chaque test
  cy.clearLocalStorage()
  cy.clearCookies()
  
  // Intercepter les appels Supabase pour les mocker
  cy.intercept('POST', '**/auth/v1/token', { fixture: 'auth-success.json' })
  cy.intercept('POST', '**/auth/v1/signup', { fixture: 'signup-success.json' })
})
```

**Note importante :** Les tests d'authentification utilisent Supabase au lieu d'Auth0, ce qui simplifie la configuration et offre une meilleure intégration avec l'architecture existante du projet.

## 🚨 Bonnes pratiques

### Tests unitaires
- Testez une fonctionnalité à la fois
- Utilisez des mocks pour les dépendances externes
- Nommez vos tests de manière descriptive
- Vérifiez les cas d'erreur

### Tests E2E
- Utilisez les data-testid pour sélectionner les éléments
- Évitez les sélecteurs CSS fragiles
- Testez les parcours utilisateur complets
- Vérifiez la responsivité

### Organisation
- Gardez les tests proches du code testé
- Utilisez des fixtures pour les données de test
- Documentez les commandes personnalisées
- Maintenez les tests à jour





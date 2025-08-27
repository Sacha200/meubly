# Tests pour Meubly Frontend

## 📋 Vue d'ensemble

Ce projet utilise une approche de test complète avec :
- **Tests unitaires** : Vitest + Vue Test Utils
- **Tests d'intégration** : Vitest + Supertest
- **Tests end-to-end** : Cypress

## 🚀 Installation des dépendances

```bash
npm install
```

## 🧪 Tests unitaires

### Exécution des tests unitaires

```bash
# Lancer les tests en mode watch
npm run test

# Lancer les tests une seule fois
npm run test:run

# Lancer les tests avec interface graphique
npm run test:ui

# Lancer les tests avec couverture de code
npm run test:coverage
```

### Structure des tests unitaires

```
tests/
├── unit/
│   ├── api.test.js          # Tests des fonctions API
│   └── stores.test.js       # Tests des stores Pinia
├── setup.js                 # Configuration globale des tests
└── vitest.config.js         # Configuration Vitest
```

### Exemples de tests

#### Test d'une fonction API
```javascript
describe('getProducts', () => {
  it('should fetch products successfully', async () => {
    const mockProducts = [
      { id: 1, name: 'Chaise', price: 100 }
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts
    });

    const result = await getProducts();
    expect(result).toEqual(mockProducts);
  });
});
```

#### Test d'un store Pinia
```javascript
describe('AuthStore', () => {
  it('should initialize with default state', () => {
    const authStore = useAuthStore();
    expect(authStore.user).toBeNull();
    expect(authStore.isAuthenticated).toBe(false);
  });
});
```

## 🔄 Tests d'intégration

### Exécution des tests d'intégration

```bash
# Les tests d'intégration sont inclus dans les tests unitaires
npm run test:run
```

### Structure des tests d'intégration

```
tests/
└── integration/
    └── api.test.js          # Tests des routes API
```

## 🌐 Tests end-to-end (Cypress)

### Exécution des tests E2E

```bash
# Ouvrir l'interface Cypress
npm run cypress:open

# Lancer les tests en mode headless
npm run cypress:run

# Lancer tous les tests E2E
npm run test:e2e
```

### Structure des tests E2E

```
cypress/
├── e2e/
│   ├── home.cy.js           # Tests de la page d'accueil
│   ├── product-detail.cy.js # Tests de la page produit
│   └── authentication.cy.js # Tests d'authentification
├── support/
│   ├── commands.js          # Commandes personnalisées
│   └── e2e.js              # Configuration globale
└── cypress.config.js        # Configuration Cypress
```

### Exemples de tests E2E

#### Test de navigation
```javascript
describe('Page d\'accueil', () => {
  it('should display the search bar', () => {
    cy.visit('http://localhost:5173')
    cy.get('[data-testid="search-bar"]').should('be.visible')
  });
});
```

#### Test d'authentification
```javascript
describe('Authentification', () => {
  it('should login successfully', () => {
    cy.login('test@example.com', 'password123')
    cy.get('[data-testid="user-menu"]').should('be.visible')
  });
});
```

## 📊 Couverture de code

### Générer un rapport de couverture

```bash
npm run test:coverage
```

Le rapport sera généré dans le dossier `coverage/` avec :
- Rapport HTML interactif
- Rapport JSON pour les outils CI/CD
- Statistiques détaillées par fichier

## 🛠️ Commandes personnalisées Cypress

### Commandes disponibles

```javascript
// Authentification
cy.login(email, password)
cy.logout()

// Navigation
cy.searchProduct(searchTerm)
cy.visitProduct(productId)

// Vérifications
cy.shouldBeVisibleAndContain(selector, text)
cy.shouldShowError(errorMessage)
cy.shouldShowSuccess(successMessage)

// Utilitaires
cy.waitForPageLoad()
cy.checkPagination()
cy.checkTheme(theme)
cy.checkResponsive()
```

## 🔧 Configuration

### Variables d'environnement pour les tests

Créez un fichier `.env.test` :

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_SUPABASE_URL=your_test_supabase_url
VITE_SUPABASE_ANON_KEY=your_test_supabase_key
```

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

## 🔍 Debugging

### Debugger les tests unitaires

```bash
# Mode debug avec Vitest
npm run test -- --reporter=verbose

# Mode watch avec logs
npm run test -- --reporter=verbose --watch
```

### Debugger les tests E2E

```bash
# Ouvrir Cypress en mode debug
npm run cypress:open

# Lancer un test spécifique
npx cypress run --spec "cypress/e2e/home.cy.js"
```

## 📈 Intégration CI/CD

### GitHub Actions

Exemple de workflow pour les tests :

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:run
      - run: npm run test:e2e
```

## 🎯 Métriques de qualité

### Objectifs de couverture
- **Tests unitaires** : > 80%
- **Tests d'intégration** : > 70%
- **Tests E2E** : Tous les parcours critiques

### Performance
- Tests unitaires : < 30 secondes
- Tests E2E : < 5 minutes
- Build complet : < 10 minutes

## 📚 Ressources

- [Documentation Vitest](https://vitest.dev/)
- [Documentation Cypress](https://docs.cypress.io/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Testing Vue.js Applications](https://www.manning.com/books/testing-vue-js-applications)

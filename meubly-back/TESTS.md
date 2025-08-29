# Tests pour Meubly Backend

## 📋 Vue d'ensemble

Ce projet utilise une approche de test complète avec :
- **Tests unitaires** : Vitest
- **Tests d'intégration** : Vitest + Supertest
- **Tests de services** : Vitest avec mocks

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

# Lancer les tests avec couverture de code
npm run test:coverage

# Lancer les tests en mode watch
npm run test:watch
```

### Structure des tests unitaires

```
tests/
├── unit/
│   └── furnitureService.test.js  # Tests du service de meubles
└── integration/
    └── furnitureRoutes.test.js   # Tests d'intégration des routes
```

### Exemples de tests

#### Test d'un service
```javascript
describe('FurnitureService', () => {
  it('should return furniture when found', async () => {
    const mockFurniture = {
      id: 1,
      name: 'Chaise de bureau',
      price: 150
    };

    const { supabase } = await import('../../supabase.js');
    supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => mockFurniture)
        }))
      }))
    });

    const result = await furnitureService.getFurnitureById(1);
    expect(result).toEqual(mockFurniture);
  });
});
```

## 🔄 Tests d'intégration

### Exécution des tests d'intégration

```bash
# Les tests d'intégration sont inclus dans les tests unitaires
npm run test:run
```

### Exemples de tests d'intégration

#### Test d'une route API
```javascript
describe('Furniture Routes Integration Tests', () => {
  it('should return all furniture', async () => {
    const response = await request(server)
      .get('/api/v1/furnitures')
      .expect(200);

    expect(response.body).toBeInstanceOf(Array);
    expect(response.headers['content-type']).toMatch(/application\/json/);
  });
});
```

## 📊 Couverture de code

### Générer un rapport de couverture

```bash
npm run test:coverage
```

Le rapport sera généré avec :
- Statistiques par fichier
- Lignes couvertes/non couvertes
- Branches couvertes/non couvertes

## 🛠️ Configuration

### Configuration Vitest

Créez un fichier `vitest.config.js` :

```javascript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.js',
        'dist/'
      ]
    }
  }
})
```

### Variables d'environnement pour les tests

Créez un fichier `.env.test` :

```env
NODE_ENV=test
PORT=5001
SUPABASE_URL=your_test_supabase_url
SUPABASE_ANON_KEY=your_test_supabase_key
```

## 🚨 Bonnes pratiques

### Tests unitaires
- Testez une fonctionnalité à la fois
- Utilisez des mocks pour les dépendances externes (Supabase, etc.)
- Nommez vos tests de manière descriptive
- Vérifiez les cas d'erreur et de succès

### Tests d'intégration
- Testez les routes API complètes
- Vérifiez les codes de statut HTTP
- Testez les réponses JSON
- Vérifiez les headers de réponse

### Organisation
- Gardez les tests proches du code testé
- Utilisez des fixtures pour les données de test
- Documentez les mocks complexes
- Maintenez les tests à jour

## 🔍 Debugging

### Debugger les tests

```bash
# Mode debug avec Vitest
npm run test -- --reporter=verbose

# Mode watch avec logs
npm run test -- --reporter=verbose --watch

# Lancer un test spécifique
npm run test -- furnitureService.test.js
```

## 📈 Intégration CI/CD

### GitHub Actions

Exemple de workflow pour les tests backend :

```yaml
name: Backend Tests
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
      - run: npm run test:coverage
```

## 🎯 Métriques de qualité

### Objectifs de couverture
- **Tests unitaires** : > 80%
- **Tests d'intégration** : > 70%
- **Services critiques** : > 90%

### Performance
- Tests unitaires : < 20 secondes
- Tests d'intégration : < 30 secondes
- Build complet : < 5 minutes

## 📚 Ressources

- [Documentation Vitest](https://vitest.dev/)
- [Documentation Supertest](https://github.com/visionmedia/supertest)
- [Testing Node.js Applications](https://nodejs.org/en/docs/guides/testing-and-debugging/)
- [Express.js Testing](https://expressjs.com/en/advanced/best-practices-performance.html#testing)

## 🔧 Mocks et stubs

### Mock de Supabase

```javascript
vi.mock('../../supabase.js', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }
}));
```

### Mock de services externes

```javascript
// Mock d'un service de paiement
vi.mock('../../services/paymentService.js', () => ({
  processPayment: vi.fn(() => Promise.resolve({ success: true }))
}));
```

## 🚀 Exécution en production

### Tests avant déploiement

```bash
# Pipeline de tests complet
npm run test:run && npm run test:coverage

# Vérification de la couverture minimale
npm run test:coverage -- --coverage.threshold.lines=80
```

### Intégration avec les outils de qualité

- **SonarQube** : Analyse de la qualité du code
- **Codecov** : Suivi de la couverture de code
- **GitHub Actions** : CI/CD automatisé

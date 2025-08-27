# 📸 Guide des Captures d'Écran - Tests E2E

## 📁 Emplacement des captures d'écran

Les captures d'écran des erreurs de tests Cypress sont automatiquement sauvegardées dans :
```
meubly-front/cypress/screenshots/
```

## 🎯 Comment capturer les erreurs

### **1. Méthode automatique (recommandée)**
```bash
# Les captures sont automatiques lors des erreurs
npx cypress run --spec "cypress/e2e/home.cy.js"
```

### **2. Méthode manuelle**
```bash
# Ouvrir l'interface Cypress
npx cypress open

# Puis faire des captures manuelles pendant les tests
```

## 📋 Types de captures disponibles

### **Captures automatiques d'erreurs**
- **Format** : PNG
- **Nom** : `[test-name] -- [error-description].png`
- **Exemple** : `Page d'accueil -- should display header (failed).png`

### **Captures vidéo**
- **Format** : MP4
- **Emplacement** : `cypress/videos/`
- **Activation** : Automatique en mode headless

## 🖼️ Utilisation dans le mémoire

### **Exemples de captures à inclure**

1. **Interface Cypress** : Montrer l'outil de test
2. **Résultats de tests** : Avant/après les corrections
3. **Erreurs spécifiques** : Screenshots des échecs
4. **Succès** : Interface avec tous les tests verts

### **Légendes suggérées**

```
Figure X.1 : Interface Cypress - Sélection des tests E2E
Figure X.2 : Résultats initiaux - 1/6 tests réussis
Figure X.3 : Erreur de navigation - Élément <nav> manquant
Figure X.4 : Résultats finaux - 6/6 tests réussis
```

## 📊 Métriques visuelles

### **Avant les corrections**
- ❌ 5 erreurs
- ❌ 1 test réussi
- ⏱️ Temps d'exécution : ~55 secondes

### **Après les corrections**
- ✅ 0 erreur
- ✅ 6 tests réussis
- ⏱️ Temps d'exécution : ~3 secondes

## 🎨 Conseils pour les captures

1. **Résolution** : Utiliser une résolution standard (1280x720)
2. **Cadrage** : Inclure les informations importantes
3. **Légendes** : Expliquer le contexte de chaque capture
4. **Séquence** : Montrer la progression avant/après

## 📝 Commandes utiles

```bash
# Nettoyer les anciennes captures
rm -rf cypress/screenshots/*

# Relancer les tests pour nouvelles captures
npx cypress run --spec "cypress/e2e/home.cy.js"

# Ouvrir le dossier des captures
explorer cypress/screenshots
```

## 🔄 Workflow recommandé

1. **Faire une erreur** : Modifier temporairement un test pour qu'il échoue
2. **Capturer l'erreur** : Lancer les tests pour générer la capture
3. **Corriger l'erreur** : Appliquer la correction
4. **Capturer le succès** : Relancer les tests pour montrer le résultat
5. **Documenter** : Ajouter les captures au mémoire avec explications

---

*Guide pour l'utilisation des captures d'écran dans la documentation des tests*

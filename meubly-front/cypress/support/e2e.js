// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Gestion des erreurs non capturées
Cypress.on('uncaught:exception', (err, runnable) => {
  // Retourner false empêche Cypress de faire échouer le test
  // sur une erreur non capturée
  return false
})

// Configuration globale pour les tests
beforeEach(() => {
  // Réinitialiser l'état de l'application avant chaque test
  cy.clearLocalStorage()
  cy.clearCookies()
})

// Commandes personnalisées pour les tests
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login')
  cy.get('[data-testid="email-input"]').type(email)
  cy.get('[data-testid="password-input"]').type(password)
  cy.get('[data-testid="login-button"]').click()
  cy.url().should('not.include', '/login')
})

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="logout-button"]').click()
  cy.url().should('not.include', '/favoris')
})

Cypress.Commands.add('searchProduct', (searchTerm) => {
  cy.get('input[placeholder*="Rechercher"]').type(searchTerm)
  cy.get('button[type="submit"]').click()
})

Cypress.Commands.add('addToFavorites', () => {
  cy.get('[data-testid="add-to-favorites"]').click()
  cy.get('[data-testid="favorite-success"]').should('be.visible')
})

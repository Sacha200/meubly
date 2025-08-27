// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Commandes personnalisées pour les tests d'authentification
Cypress.Commands.add('registerUser', (userData) => {
  cy.visit('/register')
  cy.get('[data-testid="username-input"]').type(userData.username)
  cy.get('[data-testid="email-input"]').type(userData.email)
  cy.get('[data-testid="password-input"]').type(userData.password)
  cy.get('[data-testid="confirm-password-input"]').type(userData.confirmPassword)
  cy.get('[data-testid="register-button"]').click()
})

// Commande pour vérifier qu'un élément est visible et contient du texte
Cypress.Commands.add('shouldBeVisibleAndContain', (selector, text) => {
  cy.get(selector).should('be.visible').and('contain', text)
})

// Commande pour attendre que la page soit chargée
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('[data-testid="loading"]').should('not.exist')
})

// Commande pour vérifier les messages d'erreur
Cypress.Commands.add('shouldShowError', (errorMessage) => {
  cy.get('[data-testid="error-message"]').should('be.visible').and('contain', errorMessage)
})

// Commande pour vérifier les messages de succès
Cypress.Commands.add('shouldShowSuccess', (successMessage) => {
  cy.get('[data-testid="success-message"]').should('be.visible').and('contain', successMessage)
})

// Commande pour naviguer vers un produit
Cypress.Commands.add('visitProduct', (productId) => {
  cy.visit(`/produit/${productId}`)
  cy.waitForPageLoad()
})

// Commande pour vérifier la pagination
Cypress.Commands.add('checkPagination', () => {
  cy.get('[data-testid="pagination"]').should('be.visible')
  cy.get('[data-testid="pagination"]').find('button').should('have.length.greaterThan', 0)
})

// Commande pour changer de page
Cypress.Commands.add('changePage', (pageNumber) => {
  cy.get(`[data-testid="page-${pageNumber}"]`).click()
  cy.waitForPageLoad()
})

// Commande pour vérifier le thème
Cypress.Commands.add('checkTheme', (theme) => {
  if (theme === 'dark') {
    cy.get('body').should('have.class', 'dark')
  } else {
    cy.get('body').should('not.have.class', 'dark')
  }
})

// Commande pour intercepter les appels API
Cypress.Commands.add('interceptAPI', (method, url, alias) => {
  cy.intercept(method, url).as(alias)
})

// Commande pour attendre une requête API
Cypress.Commands.add('waitForAPI', (alias) => {
  cy.wait(`@${alias}`)
})

// Commande pour vérifier la navigation
Cypress.Commands.add('checkNavigation', (expectedPath) => {
  cy.url().should('include', expectedPath)
})

// Commande pour vérifier les éléments de navigation
Cypress.Commands.add('checkNavElements', () => {
  cy.get('nav').should('be.visible')
  cy.get('nav').find('a').should('have.length.greaterThan', 0)
})

// Commande pour vérifier le footer
Cypress.Commands.add('checkFooter', () => {
  cy.get('footer').should('be.visible')
  cy.get('footer').should('contain', 'Meubly')
})

// Commande pour vérifier la responsivité
Cypress.Commands.add('checkResponsive', () => {
  // Test sur mobile
  cy.viewport('iphone-x')
  cy.get('header').should('be.visible')
  
  // Test sur tablette
  cy.viewport('ipad-2')
  cy.get('header').should('be.visible')
  
  // Test sur desktop
  cy.viewport(1280, 720)
  cy.get('header').should('be.visible')
})

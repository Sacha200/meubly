
describe('Page de détail produit', () => {
  beforeEach(() => {
    // Visiter un produit spécifique
    cy.visit('http://localhost:5173/produit/1')
  })
// test de la page de détail produit
  it('should display product details', () => {
    cy.get('[data-testid="product-detail"]').should('be.visible')
    cy.get('[data-testid="product-name"]').should('be.visible')
    cy.get('[data-testid="product-price"]').should('be.visible')
    cy.get('[data-testid="product-description"]').should('be.visible')
  })
// test de l'image du produit
  it('should display product image', () => {
    cy.get('[data-testid="product-image"]').should('be.visible')
    cy.get('[data-testid="product-image"]').should('have.attr', 'src')
  })
// test de la table de comparaison
  it('should display comparison table', () => {
    cy.get('[data-testid="comparison-table"]').should('be.visible')
    cy.get('[data-testid="comparison-table"]').find('thead').should('be.visible')
    cy.get('[data-testid="comparison-table"]').find('tbody').should('be.visible')
  })
// test des offres de différents fournisseurs
  it('should display offers from different providers', () => {
    cy.get('[data-testid="offers-list"]').should('be.visible')
    cy.get('[data-testid="offer-item"]').should('have.length.greaterThan', 0)
  })
// test de l'ajout aux favoris
  it('should allow adding to favorites', () => {
    cy.get('[data-testid="add-to-favorites"]').click()
    cy.get('[data-testid="favorite-success"]').should('be.visible')
  })
  

  it('should display pagination if many offers', () => {
    cy.get('[data-testid="pagination"]').should('be.visible')
  })

  it('should navigate to provider website', () => {
    cy.get('[data-testid="provider-link"]').first().click()
    // Vérifier que le lien s'ouvre dans un nouvel onglet
    cy.get('[data-testid="provider-link"]').first().should('have.attr', 'target', '_blank')
  })

  it('should display breadcrumb navigation', () => {
    cy.get('[data-testid="breadcrumb"]').should('be.visible')
    cy.get('[data-testid="breadcrumb"]').should('contain', 'Accueil')
    cy.get('[data-testid="breadcrumb"]').should('contain', 'Produits')
  })

  it('should handle loading state', () => {
    cy.visit('http://localhost:5173/produit/999') // Produit inexistant
    cy.get('[data-testid="loading"]').should('be.visible')
  })

  it('should handle error state', () => {
    cy.visit('http://localhost:5173/produit/invalid-id')
    cy.get('[data-testid="error-message"]').should('be.visible')
  })
})

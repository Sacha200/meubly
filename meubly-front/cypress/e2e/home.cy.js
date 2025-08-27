describe('Page d\'accueil', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
  })

  it('should display the header with navigation', () => {
    cy.get('header').should('be.visible')
    cy.get('nav').should('be.visible')
  })

  it('should display the search bar', () => {
    cy.get('[data-testid="search-bar"]').should('be.visible')
    cy.get('input[placeholder*="Rechercher"]').should('be.visible')
  })

  it('should perform a search', () => {
    const searchTerm = 'chaise'
    
    cy.get('input[placeholder*="Rechercher"]').type(searchTerm)
    cy.get('button[type="submit"]').click()
    
    // Vérifier que l'utilisateur est redirigé vers la page de résultats
    cy.url().should('include', '/resultat-recherche')
  })

  it('should display products section', () => {
    cy.get('[data-testid="products-section"]').should('be.visible')
  })

  it('should display footer', () => {
    cy.get('footer').should('be.visible')
  })

  it('should have theme toggle button', () => {
    // Vérifier que le basculeur de thème est présent et visible
    cy.get('[data-testid="theme-toggle"]').should('be.visible')
    
    // Vérifier que le bouton est cliquable
    cy.get('[data-testid="theme-toggle"]').should('not.be.disabled')
    
    // Vérifier que le bouton a un titre (accessibilité)
    cy.get('[data-testid="theme-toggle"]').should('have.attr', 'title')
  })
})

describe('Authentification', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
  })

  describe('Inscription', () => {
    it('should navigate to registration page', () => {
      cy.get('[data-testid="register-link"]').click()
      cy.url().should('include', '/register')
    })

    it('should display registration form', () => {
      cy.visit('http://localhost:5173/register')
      cy.get('[data-testid="register-form"]').should('be.visible')
      cy.get('[data-testid="username-input"]').should('be.visible')
      cy.get('[data-testid="email-input"]').should('be.visible')
      cy.get('[data-testid="password-input"]').should('be.visible')
      cy.get('[data-testid="confirm-password-input"]').should('be.visible')
    })

    it('should register a new user successfully', () => {
      cy.visit('http://localhost:5173/register')
      
      const testUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      }

      cy.get('[data-testid="username-input"]').type(testUser.username)
      cy.get('[data-testid="email-input"]').type(testUser.email)
      cy.get('[data-testid="password-input"]').type(testUser.password)
      cy.get('[data-testid="confirm-password-input"]').type(testUser.confirmPassword)
      
      cy.get('[data-testid="register-button"]').click()
      
      // Vérifier le message de succès ou la redirection
      cy.get('[data-testid="success-message"]').should('be.visible')
    })

    it('should show validation errors for invalid data', () => {
      cy.visit('http://localhost:5173/register')
      
      cy.get('[data-testid="register-button"]').click()
      
      cy.get('[data-testid="username-error"]').should('be.visible')
      cy.get('[data-testid="email-error"]').should('be.visible')
      cy.get('[data-testid="password-error"]').should('be.visible')
    })

    it('should show error for password mismatch', () => {
      cy.visit('http://localhost:5173/register')
      
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="confirm-password-input"]').type('differentpassword')
      
      cy.get('[data-testid="register-button"]').click()
      
      cy.get('[data-testid="confirm-password-error"]').should('be.visible')
    })
  })

  describe('Connexion', () => {
    it('should navigate to login page', () => {
      cy.get('[data-testid="login-link"]').click()
      cy.url().should('include', '/login')
    })

    it('should display login form', () => {
      cy.visit('http://localhost:5173/login')
      cy.get('[data-testid="login-form"]').should('be.visible')
      cy.get('[data-testid="email-input"]').should('be.visible')
      cy.get('[data-testid="password-input"]').should('be.visible')
    })

    it('should login successfully with valid credentials', () => {
      cy.visit('http://localhost:5173/login')
      
      cy.get('[data-testid="email-input"]').type('test@example.com')
      cy.get('[data-testid="password-input"]').type('password123')
      
      cy.get('[data-testid="login-button"]').click()
      
      // Vérifier que l'utilisateur est connecté
      cy.get('[data-testid="user-menu"]').should('be.visible')
      cy.get('[data-testid="logout-button"]').should('be.visible')
    })

    it('should show error for invalid credentials', () => {
      cy.visit('http://localhost:5173/login')
      
      cy.get('[data-testid="email-input"]').type('invalid@example.com')
      cy.get('[data-testid="password-input"]').type('wrongpassword')
      
      cy.get('[data-testid="login-button"]').click()
      
      cy.get('[data-testid="error-message"]').should('be.visible')
    })

    it('should show validation errors for empty fields', () => {
      cy.visit('http://localhost:5173/login')
      
      cy.get('[data-testid="login-button"]').click()
      
      cy.get('[data-testid="email-error"]').should('be.visible')
      cy.get('[data-testid="password-error"]').should('be.visible')
    })
  })

  describe('Déconnexion', () => {
    it('should logout successfully', () => {
      // D'abord se connecter
      cy.visit('http://localhost:5173/login')
      cy.get('[data-testid="email-input"]').type('test@example.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
      
      // Puis se déconnecter
      cy.get('[data-testid="logout-button"]').click()
      
      // Vérifier que l'utilisateur est déconnecté
      cy.get('[data-testid="login-link"]').should('be.visible')
      cy.get('[data-testid="register-link"]').should('be.visible')
    })
  })

  describe('Protection des routes', () => {
    it('should redirect to login when accessing protected route while not authenticated', () => {
      cy.visit('http://localhost:5173/favoris')
      cy.url().should('include', '/login')
    })

    it('should allow access to protected route when authenticated', () => {
      // Se connecter d'abord
      cy.visit('http://localhost:5173/login')
      cy.get('[data-testid="email-input"]').type('test@example.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
      
      // Puis accéder à une route protégée
      cy.visit('http://localhost:5173/favoris')
      cy.url().should('include', '/favoris')
    })
  })
})

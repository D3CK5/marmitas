describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear cookies and localStorage to ensure clean state
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('Should allow registration of a new user', () => {
    // Generate a unique email to avoid conflicts
    const uniqueEmail = `test-${Date.now()}@example.com`;
    
    cy.visit('/register');
    
    // Fill registration form
    cy.get('[data-testid="name-input"]').type('Test User');
    cy.get('[data-testid="email-input"]').type(uniqueEmail);
    cy.get('[data-testid="password-input"]').type('SecureP@ssword123');
    cy.get('[data-testid="confirm-password-input"]').type('SecureP@ssword123');
    
    // Submit form
    cy.get('[data-testid="register-button"]').click();
    
    // Verify successful registration - should redirect to dashboard
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="user-menu"]').should('be.visible');
  });

  it('Should prevent login with invalid credentials', () => {
    cy.visit('/login');
    
    // Enter invalid credentials
    cy.get('[data-testid="email-input"]').type('invalid@example.com');
    cy.get('[data-testid="password-input"]').type('WrongPassword');
    
    // Submit form
    cy.get('[data-testid="login-button"]').click();
    
    // Should stay on login page and show error
    cy.url().should('include', '/login');
    cy.get('[data-testid="error-message"]').should('be.visible');
  });

  it('Should allow login with valid credentials', () => {
    // Using fixture data
    cy.fixture('users.json').then((users) => {
      const { email, password } = users.testUser;
      
      // Login through helper command
      cy.login(email, password);
      
      // Verify successful login
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="user-menu"]').should('be.visible');
    });
  });

  it('Should allow user to logout', () => {
    // Using fixture data
    cy.fixture('users.json').then((users) => {
      const { email, password } = users.testUser;
      
      // Login first
      cy.login(email, password);
      
      // Verify successful login
      cy.url().should('include', '/dashboard');
      
      // Logout
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="logout-button"]').click();
      
      // Verify redirect to login
      cy.url().should('include', '/login');
      
      // Verify user cannot access protected route
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });
  });

  it('Should redirect to requested page after login', () => {
    // Try to access a protected route
    cy.visit('/dashboard');
    
    // Should redirect to login
    cy.url().should('include', '/login');
    
    // URL should have return_to parameter
    cy.url().should('include', 'return_to=%2Fdashboard');
    
    // Login with valid credentials
    cy.fixture('users.json').then((users) => {
      const { email, password } = users.testUser;
      
      cy.get('[data-testid="email-input"]').type(email);
      cy.get('[data-testid="password-input"]').type(password);
      cy.get('[data-testid="login-button"]').click();
      
      // Should redirect to the originally requested URL
      cy.url().should('include', '/dashboard');
    });
  });
}); 
// ***********************************************
// Custom commands for Cypress tests
// ***********************************************

// Extending Cypress namespace with custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Login using the UI
       * @example cy.login('user@example.com', 'password')
       */
      login(email: string, password: string): Chainable<void>;
      
      /**
       * Login using API directly (faster than UI)
       * @example cy.apiLogin('user@example.com', 'password')
       */
      apiLogin(email: string, password: string): Chainable<void>;
      
      /**
       * Visit a page only after the application has loaded
       * @example cy.visitAndWait('/dashboard')
       */
      visitAndWait(url: string): Chainable<void>;
      
      /**
       * Verify that a component is visible and accessible
       * @example cy.verifyComponent('[data-testid="navbar"]')
       */
      verifyComponent(selector: string): Chainable<void>;
    }
  }
}

// Login using the UI
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-button"]').click();
  cy.url().should('include', '/dashboard');
  cy.get('[data-testid="user-menu"]').should('be.visible');
});

// Login using API (faster)
Cypress.Commands.add('apiLogin', (email, password) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('API_URL') || 'http://localhost:3001/api'}/auth/login`,
    body: { email, password },
  }).then((response) => {
    expect(response.status).to.eq(200);
    
    // Store the token in localStorage
    localStorage.setItem('auth_token', response.body.data.token);
    
    // Also store user data
    localStorage.setItem('user', JSON.stringify(response.body.data.user));
    
    // Visit the dashboard
    cy.visit('/dashboard');
  });
});

// Visit page and wait for application to be fully loaded
Cypress.Commands.add('visitAndWait', (url) => {
  cy.visit(url);
  cy.get('body').should('not.have.class', 'loading');
  // Wait for any API calls to complete
  cy.intercept('GET', '**/api/**').as('apiCall');
  cy.wait('@apiCall', { timeout: 10000 });
});

// Verify component is visible and accessible
Cypress.Commands.add('verifyComponent', (selector) => {
  cy.get(selector)
    .should('be.visible')
    .and('not.be.disabled')
    .and('have.attr', 'aria-hidden', 'false');
});

export {}; 
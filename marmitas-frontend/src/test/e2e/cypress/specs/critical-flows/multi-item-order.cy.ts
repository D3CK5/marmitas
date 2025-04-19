describe('Multi-Item Order Flow', () => {
  beforeEach(() => {
    // Login before each test
    cy.fixture('users.json').then((users) => {
      cy.apiLogin(users.testUser.email, users.testUser.password);
    });
  });

  it('Should allow ordering multiple marmitas with different options', () => {
    // Navigate to weekly menu page
    cy.visitAndWait('/weekly-menu');
    
    // Verify weekly menu is displayed
    cy.get('[data-testid="weekly-menu-title"]').should('be.visible');
    
    // Select the first available day
    cy.get('[data-testid="menu-day-selector"] [data-testid="day-option"]').first().click();
    
    // Select multiple different marmitas (3 items)
    cy.get('[data-testid="menu-item"]').eq(0).within(() => {
      // Select size option 
      cy.get('[data-testid="size-option"]').contains('Large').click();
      
      // Select protein option
      cy.get('[data-testid="protein-option"]').contains('Chicken').click();
      
      // Add to order
      cy.get('[data-testid="add-to-order-button"]').click();
    });
    
    cy.get('[data-testid="menu-item"]').eq(1).within(() => {
      // Select size option
      cy.get('[data-testid="size-option"]').contains('Medium').click();
      
      // Select protein option
      cy.get('[data-testid="protein-option"]').contains('Beef').click();
      
      // Add to order
      cy.get('[data-testid="add-to-order-button"]').click();
    });
    
    cy.get('[data-testid="menu-item"]').eq(2).within(() => {
      // Select size option
      cy.get('[data-testid="size-option"]').contains('Small').click();
      
      // Select protein option
      cy.get('[data-testid="protein-option"]').contains('Vegetarian').click();
      
      // Add to order
      cy.get('[data-testid="add-to-order-button"]').click();
    });
    
    // Verify order summary shows correct number of items
    cy.get('[data-testid="order-summary"]').within(() => {
      cy.get('[data-testid="item-count"]').should('contain', '3');
    });
    
    // Add special instructions
    cy.get('[data-testid="special-instructions"]').type('Please make sure all meals are well-sealed.');
    
    // Proceed to delivery options
    cy.get('[data-testid="proceed-to-delivery-button"]').click();
    
    // Select delivery option
    cy.get('[data-testid="delivery-option-delivery"]').click();
    
    // Fill delivery address if not already filled
    cy.get('[data-testid="address-input"]').type('123 Test Street');
    cy.get('[data-testid="city-input"]').type('Test City');
    cy.get('[data-testid="postal-code-input"]').type('12345');
    
    // Select delivery time
    cy.get('[data-testid="delivery-time-selector"]').click();
    cy.get('[data-testid="time-option"]').contains('12:00 PM - 2:00 PM').click();
    
    // Proceed to payment
    cy.get('[data-testid="proceed-to-payment-button"]').click();
    
    // Select payment method
    cy.get('[data-testid="payment-method-card"]').click();
    
    // Fill payment details
    cy.get('[data-testid="card-number-input"]').type('4242424242424242');
    cy.get('[data-testid="expiry-input"]').type('1230');
    cy.get('[data-testid="cvv-input"]').type('123');
    cy.get('[data-testid="card-name-input"]').type('Test User');
    
    // Place order
    cy.get('[data-testid="place-order-button"]').click();
    
    // Verify order confirmation
    cy.url().should('include', '/order-confirmation');
    cy.get('[data-testid="order-confirmation-message"]').should('be.visible');
    
    // Verify order details in confirmation
    cy.get('[data-testid="order-items"]').children().should('have.length', 3);
    cy.get('[data-testid="delivery-date"]').should('be.visible');
    cy.get('[data-testid="delivery-address"]').should('contain', '123 Test Street');
    cy.get('[data-testid="delivery-time"]').should('contain', '12:00 PM - 2:00 PM');
    
    // Verify special instructions were included
    cy.get('[data-testid="special-instructions-display"]').should('contain', 'Please make sure all meals are well-sealed.');
  });

  it('Should allow filtering menu by dietary preferences', () => {
    // Navigate to weekly menu
    cy.visitAndWait('/weekly-menu');
    
    // Open dietary preferences filter
    cy.get('[data-testid="filters-button"]').click();
    
    // Check dietary filter options
    cy.get('[data-testid="filter-group-dietary"]').within(() => {
      cy.get('[data-testid="filter-option-vegetarian"]').click();
    });
    
    // Apply filters
    cy.get('[data-testid="apply-filters-button"]').click();
    
    // Verify filtered results show only vegetarian options
    cy.get('[data-testid="menu-item"]').each(($el) => {
      cy.wrap($el).find('[data-testid="dietary-label-vegetarian"]').should('be.visible');
    });
    
    // Add a vegetarian item to order
    cy.get('[data-testid="menu-item"]').first().within(() => {
      cy.get('[data-testid="size-option"]').contains('Medium').click();
      cy.get('[data-testid="add-to-order-button"]').click();
    });
    
    // Remove filter
    cy.get('[data-testid="filters-button"]').click();
    cy.get('[data-testid="filter-group-dietary"]').within(() => {
      cy.get('[data-testid="filter-option-vegetarian"]').click(); // Uncheck
    });
    cy.get('[data-testid="apply-filters-button"]').click();
    
    // Verify all options are now shown
    cy.get('[data-testid="menu-item"]').should('have.length.greaterThan', 1);
    
    // Add a non-vegetarian item
    cy.get('[data-testid="menu-item"]').eq(1).within(() => {
      cy.get('[data-testid="size-option"]').contains('Medium').click();
      cy.get('[data-testid="protein-option"]').contains('Chicken').click();
      cy.get('[data-testid="add-to-order-button"]').click();
    });
    
    // Verify order summary has 2 items
    cy.get('[data-testid="order-summary"]').within(() => {
      cy.get('[data-testid="item-count"]').should('contain', '2');
    });
    
    // Complete checkout process
    cy.get('[data-testid="proceed-to-delivery-button"]').click();
    cy.get('[data-testid="delivery-option-pickup"]').click(); // Choose pickup instead
    cy.get('[data-testid="pickup-location"]').first().click();
    cy.get('[data-testid="pickup-time-selector"]').click();
    cy.get('[data-testid="time-option"]').first().click();
    cy.get('[data-testid="proceed-to-payment-button"]').click();
    cy.get('[data-testid="payment-method-card"]').click();
    cy.get('[data-testid="card-number-input"]').type('4242424242424242');
    cy.get('[data-testid="expiry-input"]').type('1230');
    cy.get('[data-testid="cvv-input"]').type('123');
    cy.get('[data-testid="place-order-button"]').click();
    
    // Verify order confirmation
    cy.url().should('include', '/order-confirmation');
    cy.get('[data-testid="pickup-details"]').should('be.visible'); // Should show pickup details
  });
}); 
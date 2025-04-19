describe('Order Creation Flow', () => {
  beforeEach(() => {
    // Login before each test
    cy.fixture('users.json').then((users) => {
      cy.apiLogin(users.testUser.email, users.testUser.password);
    });
  });

  it('Should allow user to create a new order', () => {
    // Navigate to products page
    cy.visitAndWait('/products');
    
    // Select a product
    cy.get('[data-testid="product-card"]').first().click();
    
    // Product detail page should be displayed
    cy.get('[data-testid="product-detail"]').should('be.visible');
    
    // Add to cart
    cy.get('[data-testid="add-to-cart-button"]').click();
    
    // Verify product was added to cart
    cy.get('[data-testid="cart-count"]').should('have.text', '1');
    
    // Go to cart
    cy.get('[data-testid="cart-icon"]').click();
    
    // Verify product is in cart
    cy.get('[data-testid="cart-item"]').should('have.length', 1);
    
    // Proceed to checkout
    cy.get('[data-testid="checkout-button"]').click();
    
    // Fill shipping information
    cy.get('[data-testid="address-input"]').type('123 Test Street');
    cy.get('[data-testid="city-input"]').type('Test City');
    cy.get('[data-testid="postal-code-input"]').type('12345');
    cy.get('[data-testid="phone-input"]').type('5551234567');
    
    // Continue to payment
    cy.get('[data-testid="continue-to-payment-button"]').click();
    
    // Select payment method
    cy.get('[data-testid="payment-method-card"]').click();
    
    // Fill payment details (if using test card)
    cy.get('[data-testid="card-number-input"]').type('4242424242424242');
    cy.get('[data-testid="expiry-input"]').type('1230');
    cy.get('[data-testid="cvv-input"]').type('123');
    
    // Place order
    cy.get('[data-testid="place-order-button"]').click();
    
    // Verify order confirmation
    cy.url().should('include', '/order-confirmation');
    cy.get('[data-testid="order-confirmation-message"]').should('be.visible');
    cy.get('[data-testid="order-number"]').should('be.visible');
    
    // Verify order appears in order history
    cy.visit('/account/orders');
    cy.get('[data-testid="order-item"]').should('have.length.at.least', 1);
  });

  it('Should allow user to modify cart before checkout', () => {
    // Navigate to products page
    cy.visitAndWait('/products');
    
    // Add multiple products to cart
    cy.get('[data-testid="product-card"]').eq(0).within(() => {
      cy.get('[data-testid="quick-add-button"]').click();
    });
    
    cy.get('[data-testid="product-card"]').eq(1).within(() => {
      cy.get('[data-testid="quick-add-button"]').click();
    });
    
    // Go to cart
    cy.get('[data-testid="cart-icon"]').click();
    
    // Verify products are in cart
    cy.get('[data-testid="cart-item"]').should('have.length', 2);
    
    // Increase quantity of first item
    cy.get('[data-testid="cart-item"]').eq(0).within(() => {
      cy.get('[data-testid="increase-quantity-button"]').click();
    });
    
    // Remove second item
    cy.get('[data-testid="cart-item"]').eq(1).within(() => {
      cy.get('[data-testid="remove-item-button"]').click();
    });
    
    // Verify updated cart
    cy.get('[data-testid="cart-item"]').should('have.length', 1);
    cy.get('[data-testid="item-quantity"]').should('contain', '2');
    
    // Verify total price updates correctly
    cy.get('[data-testid="cart-summary"]').within(() => {
      cy.get('[data-testid="subtotal"]').should('be.visible');
    });
  });

  it('Should handle out-of-stock products correctly', () => {
    // This test assumes there's at least one out-of-stock product available
    // Navigate to products page
    cy.visitAndWait('/products/out-of-stock');
    
    // Try to add out-of-stock product to cart
    cy.get('[data-testid="out-of-stock-product"]').first().within(() => {
      cy.get('[data-testid="add-to-cart-button"]')
        .should('be.disabled')
        .and('contain', 'Out of Stock');
    });
    
    // Verify user can't proceed with out-of-stock items
    cy.get('[data-testid="out-of-stock-message"]').should('be.visible');
  });
}); 
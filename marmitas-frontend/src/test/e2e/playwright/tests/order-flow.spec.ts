import { test, expect } from '@playwright/test';
import { AuthUtils } from '../utils/auth';
import { NavigationUtils } from '../utils/navigation';
import * as userData from '../../fixtures/users.json';

test.describe('Order Creation Flow', () => {
  // Authenticate before each test
  test.beforeEach(async ({ page }) => {
    const authUtils = new AuthUtils(page);
    await authUtils.apiLogin(userData.testUser.email, userData.testUser.password);
  });

  test('Complete order flow from product selection to confirmation', async ({ page }) => {
    const navigationUtils = new NavigationUtils(page);
    
    // Step 1: Navigate to products page
    await navigationUtils.navigateAndWait('/products');
    
    // Step 2: Select a product
    await page.click('[data-testid="product-card"]:first-child');
    
    // Verify product detail page loaded
    await expect(page.locator('[data-testid="product-detail"]')).toBeVisible();
    
    // Step 3: Add to cart
    await page.click('[data-testid="add-to-cart-button"]');
    
    // Verify cart updated
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');
    
    // Step 4: Go to cart
    await page.click('[data-testid="cart-icon"]');
    
    // Verify product in cart
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
    
    // Step 5: Proceed to checkout
    await page.click('[data-testid="checkout-button"]');
    
    // Step 6: Fill shipping information
    await page.fill('[data-testid="address-input"]', '123 Test Street');
    await page.fill('[data-testid="city-input"]', 'Test City');
    await page.fill('[data-testid="postal-code-input"]', '12345');
    await page.fill('[data-testid="phone-input"]', '5551234567');
    
    // Continue to payment
    await page.click('[data-testid="continue-to-payment-button"]');
    
    // Step 7: Payment information
    await page.click('[data-testid="payment-method-card"]');
    
    // Fill card details
    await page.fill('[data-testid="card-number-input"]', '4242424242424242');
    await page.fill('[data-testid="expiry-input"]', '1230');
    await page.fill('[data-testid="cvv-input"]', '123');
    
    // Step 8: Place order
    await page.click('[data-testid="place-order-button"]');
    
    // Step 9: Verify order confirmation
    await navigationUtils.waitForUrlPath('/order-confirmation');
    await expect(page.locator('[data-testid="order-confirmation-message"]')).toBeVisible();
    
    // Get order number for verification
    const orderNumber = await page.locator('[data-testid="order-number"]').textContent();
    expect(orderNumber).toBeTruthy();
    
    // Step 10: Verify order in history
    await page.goto('/account/orders');
    await expect(page.locator('[data-testid="order-item"]')).toHaveCount(1);
    
    // Verify correct order is displayed
    const orderHistoryText = await page.locator('[data-testid="order-item"]').textContent();
    expect(orderHistoryText).toContain(orderNumber);
  });

  test('Cart modifications update totals correctly', async ({ page }) => {
    const navigationUtils = new NavigationUtils(page);
    
    // Navigate to products page
    await navigationUtils.navigateAndWait('/products');
    
    // Add multiple products to cart using quick add
    await page.click('[data-testid="product-card"]:nth-child(1) [data-testid="quick-add-button"]');
    await page.click('[data-testid="product-card"]:nth-child(2) [data-testid="quick-add-button"]');
    
    // Get product prices for later verification
    const product1Price = await page.locator('[data-testid="product-card"]:nth-child(1) [data-testid="product-price"]').textContent();
    const product2Price = await page.locator('[data-testid="product-card"]:nth-child(2) [data-testid="product-price"]').textContent();
    
    // Extract numeric values from price text
    const price1 = parseFloat(product1Price.replace(/[^0-9.]/g, ''));
    const price2 = parseFloat(product2Price.replace(/[^0-9.]/g, ''));
    
    // Go to cart
    await page.click('[data-testid="cart-icon"]');
    
    // Verify cart has 2 items
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(2);
    
    // Get initial subtotal
    const initialSubtotalText = await page.locator('[data-testid="subtotal"]').textContent();
    const initialSubtotal = parseFloat(initialSubtotalText.replace(/[^0-9.]/g, ''));
    
    // Verify initial subtotal matches sum of products
    expect(Math.round(initialSubtotal * 100) / 100).toBeCloseTo(Math.round((price1 + price2) * 100) / 100);
    
    // Increase quantity of first item
    await page.click('[data-testid="cart-item"]:nth-child(1) [data-testid="increase-quantity-button"]');
    
    // Remove second item
    await page.click('[data-testid="cart-item"]:nth-child(2) [data-testid="remove-item-button"]');
    
    // Verify updated cart
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
    const quantity = await page.locator('[data-testid="item-quantity"]').textContent();
    expect(quantity).toContain('2');
    
    // Verify updated subtotal
    const updatedSubtotalText = await page.locator('[data-testid="subtotal"]').textContent();
    const updatedSubtotal = parseFloat(updatedSubtotalText.replace(/[^0-9.]/g, ''));
    
    // Should be equal to 2 * price of first product
    expect(Math.round(updatedSubtotal * 100) / 100).toBeCloseTo(Math.round((price1 * 2) * 100) / 100);
  });

  test('Error handling for payment failure', async ({ page }) => {
    const navigationUtils = new NavigationUtils(page);
    
    // Add product to cart and go to checkout
    await navigationUtils.navigateAndWait('/products');
    await page.click('[data-testid="product-card"]:first-child');
    await page.click('[data-testid="add-to-cart-button"]');
    await page.click('[data-testid="cart-icon"]');
    await page.click('[data-testid="checkout-button"]');
    
    // Fill shipping info
    await page.fill('[data-testid="address-input"]', '123 Test Street');
    await page.fill('[data-testid="city-input"]', 'Test City');
    await page.fill('[data-testid="postal-code-input"]', '12345');
    await page.fill('[data-testid="phone-input"]', '5551234567');
    await page.click('[data-testid="continue-to-payment-button"]');
    
    // Select payment method
    await page.click('[data-testid="payment-method-card"]');
    
    // Use a test card number that will trigger a payment failure
    // (This is a test card number specifically for testing declined payments)
    await page.fill('[data-testid="card-number-input"]', '4000000000000002');
    await page.fill('[data-testid="expiry-input"]', '1230');
    await page.fill('[data-testid="cvv-input"]', '123');
    
    // Attempt to place order
    await page.click('[data-testid="place-order-button"]');
    
    // Verify error message is displayed
    await expect(page.locator('[data-testid="payment-error-message"]')).toBeVisible();
    
    // Verify we're still on the payment page
    expect(page.url()).toContain('/checkout');
    
    // Verify user can try again with a different card
    await page.fill('[data-testid="card-number-input"]', '4242424242424242');
    await page.click('[data-testid="place-order-button"]');
    
    // Now the order should go through
    await navigationUtils.waitForUrlPath('/order-confirmation');
  });
}); 
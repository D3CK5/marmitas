import { test, expect } from '@playwright/test';
import { AuthUtils } from '../utils/auth';
import { NavigationUtils } from '../utils/navigation';
import * as userData from '../../fixtures/users.json';

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('User registration and login flow', async ({ page }) => {
    const authUtils = new AuthUtils(page);
    const navigationUtils = new NavigationUtils(page);
    
    // Generate unique email for registration
    const uniqueEmail = `test-${Date.now()}@example.com`;
    
    // Step 1: Register new user
    await page.goto('/register');
    
    await page.fill('[data-testid="name-input"]', 'Test User');
    await page.fill('[data-testid="email-input"]', uniqueEmail);
    await page.fill('[data-testid="password-input"]', 'SecureP@ssword123');
    await page.fill('[data-testid="confirm-password-input"]', 'SecureP@ssword123');
    
    await page.click('[data-testid="register-button"]');
    
    // Verify redirect to dashboard after successful registration
    await navigationUtils.waitForUrlPath('/dashboard');
    
    // Step 2: Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    
    // Verify redirect to login page
    await navigationUtils.waitForUrlPath('/login');
    
    // Step 3: Login with newly created account
    await page.fill('[data-testid="email-input"]', uniqueEmail);
    await page.fill('[data-testid="password-input"]', 'SecureP@ssword123');
    await page.click('[data-testid="login-button"]');
    
    // Verify successful login
    await navigationUtils.waitForUrlPath('/dashboard');
    await navigationUtils.verifyComponent('[data-testid="user-menu"]');
  });

  test('Invalid login shows appropriate error', async ({ page }) => {
    // Attempt login with invalid credentials
    await page.goto('/login');
    
    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'WrongPassword');
    await page.click('[data-testid="login-button"]');
    
    // Should remain on login page
    expect(page.url()).toContain('/login');
    
    // Error message should be visible
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    
    // And contain appropriate text
    const errorMessage = await page.locator('[data-testid="error-message"]').textContent();
    expect(errorMessage).toContain('Invalid email or password');
  });

  test('Protected routes redirect to login for unauthenticated users', async ({ page }) => {
    // Try to access various protected routes
    const protectedRoutes = ['/dashboard', '/profile', '/settings'];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      
      // Should redirect to login
      expect(page.url()).toContain('/login');
      
      // URL should have return_to parameter
      expect(page.url()).toContain(`return_to=${encodeURIComponent(route)}`);
    }
  });

  test('Login with valid credentials via API utility', async ({ page }) => {
    const authUtils = new AuthUtils(page);
    
    // Login via API (faster than UI)
    await authUtils.apiLogin(userData.testUser.email, userData.testUser.password);
    
    // Verify successful login
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    
    // Access profile page
    await page.goto('/profile');
    
    // Should show user email
    await expect(page.locator('[data-testid="user-email"]')).toContainText(userData.testUser.email);
  });
}); 
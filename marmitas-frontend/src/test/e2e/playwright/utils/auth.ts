import { Page } from '@playwright/test';

/**
 * Authentication utilities for Playwright tests
 */
export class AuthUtils {
  constructor(private page: Page) {}

  /**
   * Login using the UI
   */
  async login(email: string, password: string): Promise<void> {
    await this.page.goto('/login');
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');
    
    // Wait for navigation to complete
    await this.page.waitForURL('**/dashboard');
    
    // Verify user is logged in
    await this.page.waitForSelector('[data-testid="user-menu"]');
  }

  /**
   * Login directly via API (faster)
   */
  async apiLogin(email: string, password: string): Promise<void> {
    const apiUrl = process.env.API_URL || 'http://localhost:3001/api';
    
    const response = await this.page.request.post(`${apiUrl}/auth/login`, {
      data: { email, password },
    });
    
    const responseBody = await response.json();
    
    // Store auth token in localStorage
    await this.page.evaluate((token) => {
      localStorage.setItem('auth_token', token);
    }, responseBody.data.token);
    
    // Store user data
    await this.page.evaluate((user) => {
      localStorage.setItem('user', JSON.stringify(user));
    }, responseBody.data.user);
    
    // Navigate to dashboard
    await this.page.goto('/dashboard');
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    await this.page.click('[data-testid="user-menu"]');
    await this.page.click('[data-testid="logout-button"]');
    
    // Wait for navigation back to login page
    await this.page.waitForURL('**/login');
  }
} 
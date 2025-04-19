import { Page, expect } from '@playwright/test';

/**
 * Navigation utilities for Playwright tests
 */
export class NavigationUtils {
  constructor(private page: Page) {}

  /**
   * Navigate to a page and wait for it to be fully loaded
   */
  async navigateAndWait(url: string): Promise<void> {
    await this.page.goto(url);
    
    // Wait for page to be fully loaded (not have loading class)
    await expect(this.page.locator('body.loading')).not.toBeVisible({ timeout: 10000 });
    
    // Wait for any API calls to complete
    await this.page.waitForResponse(response => 
      response.url().includes('/api/') && response.status() === 200, 
      { timeout: 10000 }
    );
  }

  /**
   * Verify component exists and is accessible
   */
  async verifyComponent(selector: string): Promise<void> {
    const component = this.page.locator(selector);
    
    // Verify component is visible
    await expect(component).toBeVisible();
    
    // Verify component is not disabled
    await expect(component).not.toBeDisabled();
    
    // Verify component is not hidden from accessibility tree
    const ariaHidden = await component.getAttribute('aria-hidden');
    expect(ariaHidden).not.toBe('true');
  }

  /**
   * Get the current page URL
   */
  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  /**
   * Wait for URL to include specific path
   */
  async waitForUrlPath(path: string): Promise<void> {
    await this.page.waitForURL(`**${path}`);
  }
} 
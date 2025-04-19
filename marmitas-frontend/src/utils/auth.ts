import { logger } from './logger';

// Local storage key for auth token
const AUTH_TOKEN_KEY = 'auth_token';

/**
 * Get the authentication token from local storage
 * @returns The auth token or null if not found
 */
export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    logger.error('Error getting auth token from local storage', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    return null;
  }
}

/**
 * Set the authentication token in local storage
 * @param token The auth token to store
 */
export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (error) {
    logger.error('Error setting auth token in local storage', { 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
}

/**
 * Remove the authentication token from local storage
 */
export function removeAuthToken(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (error) {
    logger.error('Error removing auth token from local storage', { 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
}

/**
 * Check if user is authenticated (has a token)
 * @returns Whether the user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
} 
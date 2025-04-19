/**
 * Application configuration
 */
export interface AppConfig {
  API_URL: string;
  WEBSOCKET_URL: string;
  AUTH_URL: string;
  ENV: string;
  DEBUG: boolean;
  VERSION: string;
}

/**
 * Get application configuration from environment variables
 */
export function getConfig(): AppConfig {
  return {
    API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    WEBSOCKET_URL: import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:3001',
    AUTH_URL: import.meta.env.VITE_AUTH_URL || 'http://localhost:3000/auth',
    ENV: import.meta.env.MODE || 'development',
    DEBUG: import.meta.env.MODE !== 'production',
    VERSION: import.meta.env.VITE_APP_VERSION || '0.0.0',
  };
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return getConfig().ENV === 'development';
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return getConfig().ENV === 'production';
}

/**
 * Check if running in test mode
 */
export function isTest(): boolean {
  return getConfig().ENV === 'test';
}

/**
 * Get API URL
 */
export function getApiUrl(): string {
  return getConfig().API_URL;
}

/**
 * Get WebSocket URL
 */
export function getWebSocketUrl(): string {
  return getConfig().WEBSOCKET_URL;
} 
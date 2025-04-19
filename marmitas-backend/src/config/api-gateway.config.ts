import { Router } from 'express';
import { config } from './app.config.js';
import { logger } from '../utils/logger.utils.js';
import { apiSecurityGateway } from '../middleware/security.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  createRateLimiter,
  strictRateLimiter,
  veryStrictRateLimiter
} from '../middleware/rate-limit.middleware.js';

/**
 * API Gateway Configuration
 * 
 * This configures the API gateway, its routes and security policies
 */
export class ApiGateway {
  private router: Router;
  private routes: Map<string, { 
    authRequired: boolean, 
    rateLimitMax?: number,
    isHighlySensitive?: boolean
  }>;

  constructor() {
    this.router = Router();
    this.routes = new Map();
  }

  /**
   * Initialize the API Gateway with security middleware
   */
  public initialize(): Router {
    // Apply global API security
    this.router.use(apiSecurityGateway);

    logger.info('API Gateway initialized with security policies');
    return this.router;
  }

  /**
   * Register a route with the API Gateway
   * 
   * @param path Route path
   * @param handler Router handler for the route
   * @param options Route options including security settings
   */
  public registerRoute(
    path: string,
    handler: Router,
    options: {
      authRequired?: boolean;
      rateLimitMax?: number;
      isHighlySensitive?: boolean;
      description?: string;
    } = {}
  ): void {
    const routePath = path.startsWith('/') ? path : `/${path}`;
    const fullPath = `${config.app.apiPrefix}${routePath}`;
    
    // Store route configuration
    this.routes.set(fullPath, {
      authRequired: options.authRequired ?? false,
      rateLimitMax: options.rateLimitMax,
      isHighlySensitive: options.isHighlySensitive
    });

    // Apply authentication if required
    if (options.authRequired) {
      this.router.use(routePath, authenticate);
    }

    // Apply custom rate limit based on sensitivity
    if (options.isHighlySensitive) {
      // Very strict rate limiting for highly sensitive endpoints
      this.router.use(routePath, veryStrictRateLimiter);
    } else if (options.rateLimitMax) {
      // Custom rate limit if specified
      if (options.rateLimitMax < config.security.rateLimitMax) {
        // If lower than global, use strict limiter
        this.router.use(routePath, strictRateLimiter);
      } else {
        // Otherwise create custom limiter
        this.router.use(routePath, createRateLimiter);
      }
    }

    // Register the route
    this.router.use(routePath, handler);
    
    logger.info(`Registered API route: ${fullPath}`, {
      authRequired: options.authRequired,
      rateLimitMax: options.rateLimitMax,
      isHighlySensitive: options.isHighlySensitive,
      description: options.description
    });
  }

  /**
   * Get registered routes information
   */
  public getRoutesInfo(): Array<{
    path: string;
    authRequired: boolean;
    rateLimitMax?: number;
    isHighlySensitive?: boolean;
  }> {
    return Array.from(this.routes.entries()).map(([path, config]) => ({
      path,
      ...config
    }));
  }
}

// Create and export a singleton instance
export const apiGateway = new ApiGateway();
export default apiGateway; 
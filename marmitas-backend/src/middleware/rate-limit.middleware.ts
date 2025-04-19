import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config/app.config.js';
import { apiResponse } from '../utils/api.utils.js';
import { logger } from '../utils/logger.utils.js';

/**
 * Create rate limiting middleware with custom options
 * 
 * @param options Custom rate limit options
 * @returns Rate limiting middleware
 */
export const createRateLimiter = (options?: {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options?.windowMs || config.security.rateLimitWindow,
    max: options?.max || config.security.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options?.skipSuccessfulRequests || false,
    handler: (req: Request, res: Response) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        method: req.method,
        path: req.path,
        userAgent: req.headers['user-agent'],
        headers: req.headers,
      });
      
      apiResponse.error(
        res,
        options?.message || 'Too many requests. Please try again later.',
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    }
  });
};

/**
 * Default rate limiter with global configuration
 */
export const defaultRateLimiter = createRateLimiter();

/**
 * Strict rate limiter for sensitive operations (auth, password reset)
 * Uses 1/4 of the normal limit to protect against brute force
 */
export const strictRateLimiter = createRateLimiter({
  max: Math.floor(config.security.rateLimitMax / 4),
  message: 'Too many authentication attempts. Please try again later.',
  skipSuccessfulRequests: true // Only count failed attempts
});

/**
 * Very strict rate limiter for highly sensitive endpoints
 * Only allows a few attempts in a short window
 */
export const veryStrictRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // Only 3 attempts per minute
  message: 'Access temporarily blocked. Try again in a few minutes.',
  skipSuccessfulRequests: true
});

/**
 * Admin endpoints rate limiter
 * More permissive for dashboard operations
 */
export const adminRateLimiter = createRateLimiter({
  max: config.security.rateLimitMax * 2 // Double the normal limit
});

export default {
  defaultRateLimiter,
  strictRateLimiter,
  veryStrictRateLimiter,
  adminRateLimiter,
  createRateLimiter
}; 
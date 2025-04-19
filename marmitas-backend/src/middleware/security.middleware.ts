import { Request, Response, NextFunction } from 'express';
import { config } from '../config/app.config.js';
import { apiResponse } from '../utils/api.utils.js';
import { logger } from '../utils/logger.utils.js';
import { defaultRateLimiter } from './rate-limit.middleware.js';

/**
 * Apply security headers middleware
 * Adds various security headers to API responses
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Apply Content-Security-Policy headers
  const cspDirectives = Object.entries(config.security.contentSecurityPolicy.directives)
    .map(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        return `${key} ${value.join(' ')}`;
      } else if (Array.isArray(value) && value.length === 0) {
        return key;
      }
      return null;
    })
    .filter(Boolean)
    .join('; ');

  if (cspDirectives) {
    res.setHeader('Content-Security-Policy', cspDirectives);
  }

  // Apply HSTS header if HTTPS is enabled or forced
  if (config.app.httpsEnabled || config.app.forceHttps) {
    const hstsValue = [
      `max-age=${config.security.hstsMaxAge}`,
      config.security.hstsIncludeSubDomains ? 'includeSubDomains' : '',
      config.security.hstsPreload ? 'preload' : ''
    ].filter(Boolean).join('; ');
    
    res.setHeader('Strict-Transport-Security', hstsValue);
  }

  // Other security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

  next();
};

/**
 * Security audit logging middleware
 * Logs all API requests for security audit purposes
 */
export const securityAuditLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Store original end method
  const originalEnd = res.end;
  const startTime = Date.now();
  
  // Capture response data
  res.end = function(chunk?: any, encoding?: any, callback?: any): any {
    const responseTime = Date.now() - startTime;
    const userId = req.user ? req.user.id : 'anonymous';
    const userRole = req.user ? req.user.role : 'anonymous';
    
    // Log security relevant information
    logger.info('API Request', {
      timestamp: new Date().toISOString(),
      requestId: res.getHeader('X-Request-ID') || 'unknown',
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId,
      userRole,
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
      referrer: req.headers.referer || req.headers.referrer,
      // Don't log sensitive data
      query: Object.keys(req.query).reduce((obj, key) => {
        if (!['password', 'token', 'apiKey', 'secret'].includes(key)) {
          obj[key] = req.query[key];
        } else {
          obj[key] = '[REDACTED]';
        }
        return obj;
      }, {} as Record<string, any>)
    });
    
    // Call original end method
    return originalEnd.call(this, chunk, encoding, callback);
  };
  
  next();
};

/**
 * API request sanitization middleware
 * Sanitizes request parameters to prevent injection attacks
 */
export const requestSanitizer = (req: Request, res: Response, next: NextFunction): void => {
  // Function to sanitize a string value
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      // Basic sanitization: prevent basic HTML/script injection
      return value.replace(/[<>]/g, (char) => char === '<' ? '&lt;' : '&gt;');
    }
    return value;
  };
  
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      const value = req.query[key];
      if (typeof value === 'string') {
        req.query[key] = sanitizeValue(value);
      }
    });
  }
  
  // For body, we only sanitize if it's a plain object (not for file uploads, etc.)
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    const sanitizeObject = (obj: any): any => {
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        if (typeof value === 'string') {
          obj[key] = sanitizeValue(value);
        } else if (typeof value === 'object' && value !== null) {
          sanitizeObject(value);
        }
      });
      return obj;
    };
    
    req.body = sanitizeObject(req.body);
  }
  
  next();
};

/**
 * API security gateway middleware
 * Combines all security middleware in the correct order
 */
export const apiSecurityGateway = [
  // Default rate limiter applied globally
  // More specific rate limiters are applied per route in API Gateway
  defaultRateLimiter,
  
  // Security headers
  securityHeaders,
  
  // Request sanitization
  requestSanitizer,
  
  // Security audit logging
  securityAuditLogger
]; 
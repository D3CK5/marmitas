import { Request, Response, NextFunction } from 'express';
import { securityMonitoringService } from '../services/security-monitoring.service.js';
import { logger } from '../utils/logger.utils.js';
import { centralizedLogger } from '../utils/centralized-logging.utils.js';

/**
 * Request Security Monitoring Middleware
 * 
 * Analyzes incoming HTTP requests for security threats
 * and passes them to the security monitoring service
 */
export const requestSecurityMonitoring = (req: Request, _res: Response, next: NextFunction) => {
  try {
    // Extract relevant information for security analysis
    const requestData = {
      ip: req.ip || '0.0.0.0', // Fallback to avoid undefined
      method: req.method,
      url: req.originalUrl,
      headers: req.headers as Record<string, string>,
      query: req.query,
      body: req.body
    };
    
    // Analyze the request asynchronously (don't block request processing)
    setImmediate(() => {
      securityMonitoringService.analyzeRequest(requestData);
    });
    
    next();
  } catch (error) {
    logger.error('Error in security monitoring middleware', { error });
    next(); // Continue processing the request even if monitoring fails
  }
};

/**
 * Authentication Monitoring Middleware
 * 
 * Tracks authentication events for security monitoring
 * This should be called after authentication success or failure
 */
export const authenticationMonitoring = (
  req: Request, 
  type: 'success' | 'failure', 
  userId: string
) => {
  try {
    const event = {
      type,
      userId,
      ip: req.ip || '0.0.0.0', // Fallback to avoid undefined
      userAgent: req.headers['user-agent'] || 'unknown',
      timestamp: Date.now()
    };
    
    // Track the authentication event
    securityMonitoringService.trackAuthEvent(event);
    
    // Log to centralized logging
    centralizedLogger.logAuthEvent(
      type === 'success' ? 'login_success' : 'login_failure',
      userId,
      { ip: req.ip || '0.0.0.0', userAgent: req.headers['user-agent'] }
    );
  } catch (error) {
    logger.error('Error in authentication monitoring middleware', { error });
  }
};

/**
 * User Activity Monitoring Middleware
 * 
 * Tracks user activity for security monitoring and audit logging
 * This should be called after successful operations on sensitive resources
 */
export const userActivityMonitoring = (
  req: Request,
  action: string,
  resource: string,
  resourceId?: string
) => {
  try {
    // Only monitor activity for authenticated users
    if (!req.user?.id) {
      return;
    }
    
    const event = {
      userId: req.user.id,
      action,
      resource: resourceId ? `${resource}/${resourceId}` : resource,
      ip: req.ip || '0.0.0.0', // Fallback to avoid undefined
      timestamp: Date.now()
    };
    
    // Track the user activity
    securityMonitoringService.trackUserActivity(event);
  } catch (error) {
    logger.error('Error in user activity monitoring middleware', { error });
  }
};

// Export a combined security monitoring middleware
export const securityMonitoring = {
  requestMonitoring: requestSecurityMonitoring,
  authMonitoring: authenticationMonitoring,
  activityMonitoring: userActivityMonitoring
}; 
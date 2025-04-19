import { Request, Response, NextFunction } from 'express';
import { authorizationService, UserRole } from '../services/authorization.service.js';
import { logger } from '../utils/logger.utils.js';

/**
 * Extended request interface with auth information
 */
export interface AuthRequest extends Request {
  auth?: {
    userId: string;
    role: UserRole;
    email?: string;
  };
}

/**
 * Authorization middleware to check if users have permission to access resources
 * @param resource The resource being accessed
 * @param action The action being performed
 * @param options Additional options for authorization
 * @returns Express middleware function
 */
export const authorize = (
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete' | 'list' | 'manage',
  options: {
    ownerIdPath?: string; // Path to find the owner ID in request (e.g., 'params.userId')
    allowAnonymous?: boolean; // Allow anonymous access (default: false)
  } = {}
) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // If auth information isn't set, user is anonymous
      const userId = req.auth?.userId || null;
      const userRole = req.auth?.role || UserRole.ANONYMOUS;
      
      // If anonymous access is not allowed and user is anonymous, deny access
      if (!options.allowAnonymous && userRole === UserRole.ANONYMOUS) {
        logger.warn('Unauthorized access attempt by anonymous user', {
          resource,
          action,
          path: req.path,
          method: req.method
        });
        
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required to access this resource'
        });
      }
      
      // Get owner ID from request if path is provided
      let resourceOwnerId: string | undefined;
      if (options.ownerIdPath) {
        const parts = options.ownerIdPath.split('.');
        let value: any = req;
        
        for (const part of parts) {
          value = value?.[part];
          if (value === undefined) break;
        }
        
        resourceOwnerId = value?.toString();
      }
      
      // Check if user has permission
      const hasPermission = authorizationService.hasPermission(
        userId,
        userRole,
        resource,
        action,
        resourceOwnerId
      );
      
      if (!hasPermission) {
        logger.warn('Permission denied', {
          userId,
          userRole,
          resource,
          action,
          resourceOwnerId,
          path: req.path,
          method: req.method
        });
        
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to perform this action'
        });
      }
      
      // Log successful authorization
      logger.debug('Permission granted', {
        userId,
        userRole,
        resource,
        action,
        path: req.path
      });
      
      // Add authorization info to request
      req.auth = {
        ...req.auth,
        userId: userId || '', // Empty string for anonymous
        role: userRole
      };
      
      next();
    } catch (error) {
      logger.error('Authorization middleware error', { error, path: req.path });
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred while checking permissions'
      });
    }
  };
};

/**
 * Data filtering middleware to apply access control at the data level
 * Filters records in response based on user permissions
 * @param resource The resource being accessed
 * @param options Additional options for data filtering
 * @returns Express middleware function
 */
export const filterAccessibleData = (
  resource: string,
  options: {
    dataPath?: string; // Path to find the data in response (default: 'data')
    ownerIdField?: string; // Field that contains the owner ID (default: 'user_id')
    applyToSingleRecord?: boolean; // Whether to apply to single record responses (default: true)
  } = {}
) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Store original res.json function
    const originalJson = res.json;
    
    // Get options with defaults
    const dataPath = options.dataPath || 'data';
    const ownerIdField = options.ownerIdField || 'user_id';
    const applyToSingleRecord = options.applyToSingleRecord !== false;
    
    // Override res.json to filter data before sending
    res.json = function(body): Response {
      // If no auth info or no body, return original response
      if (!req.auth || !body) {
        return originalJson.call(this, body);
      }
      
      try {
        // Get user info
        const userId = req.auth.userId || null;
        const userRole = req.auth.role || UserRole.ANONYMOUS;
        
        // Skip filtering for admin users
        if (authorizationService.isAdmin(userRole)) {
          return originalJson.call(this, body);
        }
        
        // Navigate to the data using the provided path
        const parts = dataPath.split('.');
        let data: any = body;
        
        for (const part of parts) {
          data = data?.[part];
          if (data === undefined) break;
        }
        
        // If no data or not an array or object, return original response
        if (data === undefined) {
          return originalJson.call(this, body);
        }
        
        // Apply filtering based on data type
        if (Array.isArray(data)) {
          // Filter array of records
          const filteredData = authorizationService.filterAccessibleRecords(
            userId,
            userRole,
            resource,
            data,
            ownerIdField
          );
          
          // Update the data in the response body
          let current = body;
          for (let i = 0; i < parts.length - 1; i++) {
            current = current[parts[i]];
          }
          current[parts[parts.length - 1]] = filteredData;
          
          return originalJson.call(this, body);
        } else if (typeof data === 'object' && data !== null && applyToSingleRecord) {
          // Check permission for a single record
          const resourceOwnerId = data[ownerIdField]?.toString();
          
          const hasPermission = authorizationService.hasPermission(
            userId,
            userRole,
            resource,
            'read',
            resourceOwnerId
          );
          
          if (!hasPermission) {
            // Return 403 if user doesn't have permission to see this record
            this.status(403);
            return originalJson.call(this, {
              error: 'Forbidden',
              message: 'You do not have permission to access this resource'
            });
          }
        }
        
        // If we get here, return the original or modified response
        return originalJson.call(this, body);
      } catch (error) {
        logger.error('Error in data filtering middleware', { error, path: req.path });
        return originalJson.call(this, body);
      }
    };
    
    next();
  };
};

/**
 * Admin-only access middleware
 * A convenience middleware for routes that should only be accessible by admins
 * @returns Express middleware function
 */
export const adminOnly = () => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.auth?.role || UserRole.ANONYMOUS;
    
    if (!authorizationService.isAdmin(userRole)) {
      logger.warn('Admin-only access attempt denied', {
        userRole,
        userId: req.auth?.userId,
        path: req.path,
        method: req.method
      });
      
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Administrator access required'
      });
    }
    
    next();
  };
}; 
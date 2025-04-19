import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { apiResponse } from '../utils/api.utils.js';
import { jwtService } from '../services/jwt.service.js';

/**
 * Extend Express Request type to include user information
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

/**
 * Extract token from authorization header or query parameter
 */
const extractToken = (req: Request): string | null => {
  // Try header first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  
  // Try cookie next
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }
  
  // Try query parameter last (less secure)
  if (req.query && req.query.token) {
    return req.query.token as string;
  }
  
  return null;
};

/**
 * Middleware to authenticate requests using JWT token
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      apiResponse.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
      return;
    }
    
    // Verificação básica do formato do token
    if (!/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/.test(token)) {
      apiResponse.error(res, 'Invalid token format', 401, 'INVALID_TOKEN');
      return;
    }
    
    // Verify token
    const payload = jwtService.verifyAccessToken(token);
    
    if (!payload) {
      apiResponse.error(res, 'Invalid or expired token', 401, 'INVALID_TOKEN');
      return;
    }
    
    // Verificar se o payload contém as informações necessárias
    if (!payload.userId || !payload.email) {
      apiResponse.error(res, 'Token payload is missing required fields', 401, 'INVALID_TOKEN');
      return;
    }
    
    // Attach user to request
    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role
    };
    
    next();
  } catch (error) {
    // Log specific error for debugging
    if (error instanceof Error) {
      // Avoid leaking sensitive info in logs
      const errorMessage = error.message.includes('token') ? 
        'Authentication token error' : error.message;
        
      console.error('Authentication error:', errorMessage);
    }
    
    apiResponse.error(
      res, 
      'Authentication failed', 
      401, 
      'AUTH_ERROR'
    );
  }
};

/**
 * Middleware for legacy Supabase token verification - for backward compatibility
 */
export const authenticateLegacy = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      apiResponse.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verificação básica do formato do token
    if (!/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/.test(token)) {
      apiResponse.error(res, 'Invalid token format', 401, 'INVALID_TOKEN');
      return;
    }
    
    // Verify the token
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      apiResponse.error(res, 'Invalid or expired token', 401, 'INVALID_TOKEN');
      return;
    }
    
    // Verificar o e-mail do usuário
    if (!data.user.email) {
      apiResponse.error(res, 'User email not found', 401, 'INVALID_USER');
      return;
    }
    
    // Attach user to request
    req.user = {
      id: data.user.id,
      email: data.user.email,
      role: data.user.app_metadata.role || 'user'
    };
    
    next();
  } catch (error) {
    // Log específico para depuração
    if (error instanceof Error) {
      // Evitar vazar informações sensíveis nos logs
      const errorMessage = error.message.includes('token') ? 
        'Authentication token error' : error.message;
        
      console.error('Legacy authentication error:', errorMessage);
    }
    
    apiResponse.error(
      res, 
      'Authentication failed', 
      401, 
      'AUTH_ERROR'
    );
  }
};

/**
 * Middleware to check if user has required role
 */
export const authorize = (roles: string | string[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      apiResponse.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
      return;
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      apiResponse.error(
        res, 
        'Insufficient permissions', 
        403, 
        'FORBIDDEN'
      );
      return;
    }
    
    next();
  };
}; 
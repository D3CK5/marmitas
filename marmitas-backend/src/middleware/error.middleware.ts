import { Request, Response, NextFunction } from 'express';
import { apiResponse } from '../utils/api.utils.js';
import { logger } from '../utils/logger.utils.js';

// Armazenar informações sobre a frequência de erros para detecção de surtos
const errorTracking = {
  recentErrors: new Map<string, number[]>(),
  alertThreshold: 5, // Número de erros do mesmo tipo para disparar um alerta
  timeWindow: 60000, // Janela de tempo em ms (1 minuto)
  isAlertMode: false,
  lastAlertTime: 0
};

/**
 * Verifica se há um surto de erros do mesmo tipo
 */
const checkErrorSurge = (errorType: string): boolean => {
  const now = Date.now();
  
  // Inicializar o array de timestamps de erro se não existir
  if (!errorTracking.recentErrors.has(errorType)) {
    errorTracking.recentErrors.set(errorType, []);
  }
  
  // Obter o array de timestamps de erro
  const errorTimestamps = errorTracking.recentErrors.get(errorType)!;
  
  // Remover timestamps antigos (fora da janela de tempo)
  const validTimestamps = errorTimestamps.filter(
    timestamp => now - timestamp < errorTracking.timeWindow
  );
  
  // Adicionar o timestamp atual
  validTimestamps.push(now);
  
  // Atualizar o array de timestamps
  errorTracking.recentErrors.set(errorType, validTimestamps);
  
  // Verificar se o número de erros recentes ultrapassou o limite
  return validTimestamps.length >= errorTracking.alertThreshold;
};

/**
 * Error handler middleware
 * 
 * This middleware catches all unhandled errors in the application
 * and formats them as a standardized API response.
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Determinar o tipo de erro para rastreamento
  const errorType = err.name || 'UnknownError';
  
  // Verificar se há um surto de erros
  const isErrorSurge = checkErrorSurge(errorType);
  
  // Registrar o erro com severidade aumentada em caso de surto
  if (isErrorSurge) {
    if (!errorTracking.isAlertMode || Date.now() - errorTracking.lastAlertTime > 300000) { // 5 minutos
      logger.error('ALERTA: Surto de erros detectado!', {
        errorType,
        count: errorTracking.recentErrors.get(errorType)!.length,
        timeWindow: `${errorTracking.timeWindow / 1000} segundos`,
        path: req.path,
        method: req.method
      });
      
      // Atualizar status de alerta
      errorTracking.isAlertMode = true;
      errorTracking.lastAlertTime = Date.now();
    }
    
    logger.error('Erro recorrente detectado', {
      errorType,
      message: err.message,
      path: req.path,
      method: req.method,
      stack: err.stack
    });
  } else {
    // Log padrão de erro para debugging
    logger.error('Unhandled error', {
      errorType,
      message: err.message,
      path: req.path,
      method: req.method,
      userId: req.user?.id,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
  
  // Return a standardized error response
  apiResponse.error(
    res,
    err.message || 'An unexpected error occurred',
    500,
    'SERVER_ERROR',
    process.env.NODE_ENV === 'development' ? { stack: err.stack } : undefined
  );
};

/**
 * Not found handler middleware
 * 
 * This middleware catches all requests to non-existent routes
 * and returns a standardized 404 response.
 */
export const notFoundHandler = (
  req: Request,
  res: Response
): void => {
  // Log 404 errors
  logger.warn('Route not found', {
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });
  
  apiResponse.error(
    res,
    `Route not found: ${req.method} ${req.originalUrl}`,
    404,
    'NOT_FOUND'
  );
}; 
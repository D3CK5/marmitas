import { logger } from '../../utils/logger';

/**
 * Error classification for API requests
 */

/**
 * HTTP status codes that are considered transient/retriable
 */
export const RETRIABLE_STATUS_CODES = [
  408, // Request Timeout
  425, // Too Early
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
  507, // Insufficient Storage
  509, // Bandwidth Limit Exceeded
  521, // Web Server Is Down
  522, // Connection Timed Out
  523, // Origin Is Unreachable
  524, // A Timeout Occurred
];

/**
 * Error types that are considered network-related and retriable
 */
export const NETWORK_ERROR_TYPES = [
  'NetworkError',
  'TimeoutError',
  'AbortError',
  'FetchError',
];

/**
 * Check if an error is a network-related error
 * @param error The error to check
 * @returns True if the error is network-related
 */
export const isNetworkError = (error: Error): boolean => {
  // Check error name
  if (NETWORK_ERROR_TYPES.includes(error.name)) {
    return true;
  }
  
  // Check for fetch/network error messages
  const errorMessage = error.message.toLowerCase();
  return (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('abort') ||
    errorMessage.includes('failed to fetch') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('unreachable')
  );
};

/**
 * Check if an HTTP error status code is considered transient
 * @param status The HTTP status code
 * @returns True if the status code indicates a transient error
 */
export const isTransientStatusCode = (status: number): boolean => {
  return RETRIABLE_STATUS_CODES.includes(status);
};

/**
 * Check if an API response error should be retried
 * @param error The error to check
 * @returns True if the error is considered transient and should be retried
 */
export const isRetryableError = (error: Error): boolean => {
  // Handle network errors
  if (isNetworkError(error)) {
    logger.debug('Classified as network error, will retry', { error: error.message });
    return true;
  }
  
  // Handle HTTP errors with status code
  if (error && 'status' in error) {
    const status = (error as any).status;
    if (typeof status === 'number' && isTransientStatusCode(status)) {
      logger.debug('Classified as transient HTTP error, will retry', { 
        status, 
        error: error.message 
      });
      return true;
    }
  }
  
  // Handle axios errors
  if (error && error.name === 'AxiosError' && 'response' in error) {
    const response = (error as any).response;
    if (response && typeof response.status === 'number') {
      if (isTransientStatusCode(response.status)) {
        logger.debug('Classified as transient Axios error, will retry', { 
          status: response.status, 
          error: error.message 
        });
        return true;
      }
    }
  }
  
  // Handle rate limiting specifically (can come in different formats)
  const errorMessage = error.message.toLowerCase();
  if (
    errorMessage.includes('rate limit') ||
    errorMessage.includes('too many requests') ||
    errorMessage.includes('throttle')
  ) {
    logger.debug('Classified as rate limiting error, will retry', { error: error.message });
    return true;
  }
  
  // Not a retryable error
  logger.debug('Classified as non-retryable error', { error: error.message });
  return false;
}; 
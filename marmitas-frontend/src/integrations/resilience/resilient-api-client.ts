import { apiClient } from '../../lib/api-client';
import { logger } from '../../utils/logger';
import { RetryPolicy } from './policies/retry-policy';
import { RetryStrategy } from './retry';
import { isRetryableError } from './error-classification';

/**
 * Options for resilient API client
 */
export interface ResilientApiClientOptions {
  /**
   * Maximum number of retry attempts
   */
  maxRetries?: number;
  
  /**
   * Retry strategy to use
   */
  retryStrategy?: RetryStrategy;
  
  /**
   * Whether to log retry attempts
   */
  logRetries?: boolean;
}

/**
 * Default options for resilient API client
 */
const DEFAULT_OPTIONS: ResilientApiClientOptions = {
  maxRetries: 3,
  retryStrategy: new RetryStrategy.ExponentialBackoff(),
  logRetries: true,
};

/**
 * API client with built-in resilience patterns
 * Wraps the standard API client with retry functionality
 */
export const resilientApiClient = {
  /**
   * Perform a GET request with resilience patterns
   * @param endpoint API endpoint
   * @param options Resilience options
   * @returns Promise with the response data
   */
  async get<T>(endpoint: string, options?: ResilientApiClientOptions): Promise<T> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const retryPolicy = createRetryPolicy(opts);
    
    return retryPolicy.execute(async () => {
      return apiClient.get<T>(endpoint);
    });
  },
  
  /**
   * Perform a POST request with resilience patterns
   * @param endpoint API endpoint
   * @param data Request body
   * @param options Resilience options
   * @returns Promise with the response data
   */
  async post<T>(endpoint: string, data: unknown, options?: ResilientApiClientOptions): Promise<T> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const retryPolicy = createRetryPolicy(opts);
    
    return retryPolicy.execute(async () => {
      return apiClient.post<T>(endpoint, data);
    });
  },
  
  /**
   * Perform a PUT request with resilience patterns
   * @param endpoint API endpoint
   * @param data Request body
   * @param options Resilience options
   * @returns Promise with the response data
   */
  async put<T>(endpoint: string, data: unknown, options?: ResilientApiClientOptions): Promise<T> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const retryPolicy = createRetryPolicy(opts);
    
    return retryPolicy.execute(async () => {
      return apiClient.put<T>(endpoint, data);
    });
  },
  
  /**
   * Perform a PATCH request with resilience patterns
   * @param endpoint API endpoint
   * @param data Request body
   * @param options Resilience options
   * @returns Promise with the response data
   */
  async patch<T>(endpoint: string, data: unknown, options?: ResilientApiClientOptions): Promise<T> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const retryPolicy = createRetryPolicy(opts);
    
    return retryPolicy.execute(async () => {
      return apiClient.patch<T>(endpoint, data);
    });
  },
  
  /**
   * Perform a DELETE request with resilience patterns
   * @param endpoint API endpoint
   * @param options Resilience options
   * @returns Promise with the response data
   */
  async delete<T>(endpoint: string, options?: ResilientApiClientOptions): Promise<T> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const retryPolicy = createRetryPolicy(opts);
    
    return retryPolicy.execute(async () => {
      return apiClient.delete<T>(endpoint);
    });
  },
};

/**
 * Create a retry policy based on the provided options
 * @param options Resilience options
 * @returns Configured retry policy
 */
function createRetryPolicy(options: ResilientApiClientOptions): RetryPolicy {
  return new RetryPolicy({
    maxRetries: options.maxRetries,
    retryStrategy: options.retryStrategy,
    shouldRetry: isRetryableError,
    onRetry: options.logRetries ? logRetryAttempt : undefined,
  });
}

/**
 * Log a retry attempt
 * @param error The error that triggered the retry
 * @param retryCount The current retry count
 * @param delay The delay before the next retry
 */
function logRetryAttempt(error: Error, retryCount: number, delay: number): void {
  logger.warn(`API call failed, retrying (${retryCount})...`, {
    error: error.message,
    retryCount,
    delayMs: delay,
  });
} 
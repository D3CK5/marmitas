import { useState, useCallback } from 'react';
import { FallbackPolicy, FallbackHandler } from '../policies/fallback-policy';
import { PolicyContext } from '../policies/policy';
import { logger } from '../../../utils/logger';

/**
 * Options for the useFallback hook
 */
export interface UseFallbackOptions<T> {
  /**
   * The fallback handler function that provides the alternative response
   */
  fallbackHandler: FallbackHandler<T>;
  
  /**
   * Function to determine if an error should trigger the fallback
   * By default, all errors trigger the fallback
   */
  shouldHandle?: (error: Error) => boolean;
  
  /**
   * Called before falling back to the alternative response
   */
  onFallback?: (error: Error) => void;
  
  /**
   * Whether to log fallback operations
   * @default true
   */
  logOperations?: boolean;
}

/**
 * The return type of the useFallback hook
 */
export interface UseFallbackResult<T> {
  /**
   * Execute an operation with fallback protection
   * @param operation The operation to execute
   * @param context Optional context data to pass to the fallback handler
   * @returns A promise resolving to the operation result or fallback result
   */
  execute: <R extends T>(operation: () => Promise<R>, context?: PolicyContext) => Promise<R>;
  
  /**
   * Whether the last operation used a fallback value
   * This is reset to false on each execute call
   */
  usedFallback: boolean;
  
  /**
   * The error that triggered the fallback, if any
   * This is reset to null on each execute call
   */
  lastError: Error | null;
}

/**
 * React hook for using fallback policies in functional components
 * @param options Fallback policy configuration options
 * @returns A fallback execution context
 * 
 * @example
 * const { execute, usedFallback, lastError } = useFallback({
 *   fallbackHandler: DefaultResponseFallbacks.emptyArray()
 * });
 * 
 * // Use it to protect API calls
 * const fetchData = async () => {
 *   const result = await execute(() => api.fetchData());
 *   
 *   if (usedFallback) {
 *     showNotification(`Using cached data due to error: ${lastError?.message}`);
 *   }
 *   
 *   return result;
 * };
 */
export function useFallback<T>(options: UseFallbackOptions<T>): UseFallbackResult<T> {
  const { fallbackHandler, shouldHandle, onFallback, logOperations = true } = options;
  
  // Track whether fallback was used for the last operation
  const [usedFallback, setUsedFallback] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);
  
  // Create the fallback policy
  const [fallbackPolicy] = useState(() => new FallbackPolicy<T>({
    fallbackHandler,
    shouldHandle,
    onFallback: (error: Error) => {
      // Update state to indicate fallback was used
      setUsedFallback(true);
      setLastError(error);
      
      // Log the fallback if enabled
      if (logOperations) {
        logger.warn('Fallback activated', {
          errorType: error.name,
          errorMessage: error.message,
        });
      }
      
      // Call the user-provided callback if any
      if (onFallback) {
        onFallback(error);
      }
    },
  }));
  
  // Execute function that wraps operations with fallback policy
  const execute = useCallback(<R extends T>(
    operation: () => Promise<R>,
    context: PolicyContext = {}
  ): Promise<R> => {
    // Reset state for new operation
    setUsedFallback(false);
    setLastError(null);
    
    return fallbackPolicy.execute(operation, context);
  }, [fallbackPolicy]);
  
  return {
    execute,
    usedFallback,
    lastError,
  };
} 
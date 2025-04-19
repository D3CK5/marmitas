import { useState, useEffect, useCallback } from 'react';
import { useFallback, UseFallbackResult } from './use-fallback';
import { 
  createCachedResponseFallback, 
  CachedResponseFallbackOptions,
  withCaching,
  getGlobalCache,
  CacheStorage
} from '../fallback/cached-response-fallback';
import { PolicyContext } from '../policies/policy';
import { FallbackHandler } from '../policies/fallback-policy';

/**
 * Options for the useCachedFallback hook
 */
export interface UseCachedFallbackOptions<T> 
  extends Omit<CachedResponseFallbackOptions<T>, 'logFallback'> {
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
  
  /**
   * Whether to automatically cache successful responses for future fallbacks
   * @default true
   */
  autoCacheResponses?: boolean;
}

/**
 * The return type of the useCachedFallback hook
 * Extends UseFallbackResult with cache control methods
 */
export interface UseCachedFallbackResult<T> extends UseFallbackResult<T> {
  /**
   * Manually store a value in the cache
   * @param value The value to cache
   * @param context Optional context to resolve the cache key
   */
  cacheValue: (value: T, context?: PolicyContext) => void;
  
  /**
   * Clear the cached value
   * @param context Optional context to resolve the cache key
   */
  clearCache: (context?: PolicyContext) => void;
  
  /**
   * Check if there is a cached value available
   * @param context Optional context to resolve the cache key
   * @returns True if a cached value exists
   */
  hasCachedValue: (context?: PolicyContext) => boolean;
  
  /**
   * Get the cached value if available
   * @param context Optional context to resolve the cache key
   * @returns The cached value or undefined if not found
   */
  getCachedValue: (context?: PolicyContext) => T | undefined;
}

/**
 * React hook for using cached fallbacks in functional components
 * This is a specialized version of useFallback that uses createCachedResponseFallback
 * 
 * @param options Cached fallback configuration options
 * @returns A fallback execution context with cache control
 * 
 * @example
 * const { 
 *   execute, 
 *   usedFallback, 
 *   cacheValue, 
 *   hasCachedValue 
 * } = useCachedFallback({
 *   cacheKey: 'user-profile',
 *   cacheTtlMs: 5 * 60 * 1000 // 5 minutes
 * });
 * 
 * // It will auto-cache successful responses
 * const fetchProfile = async () => {
 *   const profile = await execute(() => api.getUserProfile());
 *   
 *   if (usedFallback) {
 *     showOfflineNotification();
 *   }
 *   
 *   return profile;
 * };
 */
export function useCachedFallback<T>(
  options: UseCachedFallbackOptions<T>
): UseCachedFallbackResult<T> {
  const {
    cacheKey,
    cacheStorage = getGlobalCache<T>(),
    cacheTtlMs,
    transformCachedValue,
    secondaryFallback,
    shouldHandle,
    onFallback,
    logOperations = true,
    autoCacheResponses = true
  } = options;
  
  // Create a cached response fallback handler
  const fallbackHandler = createCachedResponseFallback({
    cacheKey,
    cacheStorage,
    cacheTtlMs,
    transformCachedValue,
    secondaryFallback,
    logFallback: logOperations
  });
  
  // Use the general fallback hook with our configured handler
  const baseFallback = useFallback<T>({
    fallbackHandler,
    shouldHandle,
    onFallback,
    logOperations
  });
  
  // Helper to resolve the cache key from context
  const resolveKey = useCallback((context: PolicyContext = {}): string => {
    return typeof cacheKey === 'function' ? cacheKey(context) : cacheKey;
  }, [cacheKey]);
  
  // Cache management functions
  const cacheValue = useCallback((value: T, context: PolicyContext = {}): void => {
    const key = resolveKey(context);
    cacheStorage.set(key, value, cacheTtlMs);
  }, [cacheStorage, resolveKey, cacheTtlMs]);
  
  const clearCache = useCallback((context: PolicyContext = {}): void => {
    const key = resolveKey(context);
    cacheStorage.remove(key);
  }, [cacheStorage, resolveKey]);
  
  const hasCachedValue = useCallback((context: PolicyContext = {}): boolean => {
    const key = resolveKey(context);
    return cacheStorage.has(key);
  }, [cacheStorage, resolveKey]);
  
  const getCachedValue = useCallback((context: PolicyContext = {}): T | undefined => {
    const key = resolveKey(context);
    return cacheStorage.get(key);
  }, [cacheStorage, resolveKey]);
  
  // Override execute to add auto-caching if enabled
  const execute = useCallback(<R extends T>(
    operation: () => Promise<R>,
    context: PolicyContext = {}
  ): Promise<R> => {
    if (autoCacheResponses) {
      // Wrap the operation to cache successful results
      const cachedOperation = async (): Promise<R> => {
        const result = await operation();
        cacheValue(result, context);
        return result;
      };
      
      return baseFallback.execute(cachedOperation, context);
    } else {
      // Use the operation as-is without auto-caching
      return baseFallback.execute(operation, context);
    }
  }, [baseFallback, autoCacheResponses, cacheValue]);
  
  return {
    ...baseFallback,
    execute,
    cacheValue,
    clearCache,
    hasCachedValue,
    getCachedValue
  };
}

/**
 * Conveniences for common cached fallback patterns
 */
export const CachedFallbacks = {
  /**
   * Create a cached fallback with a secondary fallback to an empty array
   */
  withEmptyArrayFallback<T>(
    options: Omit<UseCachedFallbackOptions<T[]>, 'secondaryFallback'>
  ): UseCachedFallbackResult<T[]> {
    return useCachedFallback<T[]>({
      ...options,
      secondaryFallback: (error, context) => []
    });
  },
  
  /**
   * Create a cached fallback with a secondary fallback to null
   */
  withNullFallback<T>(
    options: Omit<UseCachedFallbackOptions<T | null>, 'secondaryFallback'>
  ): UseCachedFallbackResult<T | null> {
    return useCachedFallback<T | null>({
      ...options,
      secondaryFallback: (error, context) => null
    });
  },
  
  /**
   * Create a cached fallback with a secondary fallback to a standard error response
   */
  withErrorResponseFallback<T>(
    options: Omit<UseCachedFallbackOptions<{
      success: boolean;
      status: number;
      message: string;
      data: T | null;
    }>, 'secondaryFallback'>,
    defaultStatus: number = 500
  ): UseCachedFallbackResult<{
    success: boolean;
    status: number;
    message: string;
    data: T | null;
  }> {
    return useCachedFallback({
      ...options,
      secondaryFallback: (error, context) => ({
        success: false,
        status: defaultStatus,
        message: error.message || 'An error occurred',
        data: null
      })
    });
  }
}; 
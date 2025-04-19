import { FallbackHandler } from '../policies/fallback-policy';
import { PolicyContext } from '../policies/policy';
import { logger } from '../../../utils/logger';

/**
 * Interface for cache storage implementations
 */
export interface CacheStorage<T> {
  /**
   * Get a cached value by key
   * @param key The cache key
   * @returns The cached value or undefined if not found
   */
  get(key: string): T | undefined;
  
  /**
   * Set a value in the cache
   * @param key The cache key
   * @param value The value to cache
   * @param ttlMs Optional TTL in milliseconds
   */
  set(key: string, value: T, ttlMs?: number): void;
  
  /**
   * Check if a key exists in the cache
   * @param key The cache key
   * @returns True if the key exists in the cache
   */
  has(key: string): boolean;
  
  /**
   * Remove a value from the cache
   * @param key The cache key
   */
  remove(key: string): void;
}

/**
 * Simple in-memory cache implementation
 */
class InMemoryCache<T> implements CacheStorage<T> {
  private cache: Map<string, { value: T; expiry: number | null }> = new Map();
  
  /**
   * Get a cached value by key
   * @param key The cache key
   * @returns The cached value or undefined if not found or expired
   */
  get(key: string): T | undefined {
    const item = this.cache.get(key);
    
    if (!item) {
      return undefined;
    }
    
    // Check if item has expired
    if (item.expiry !== null && Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value;
  }
  
  /**
   * Set a value in the cache
   * @param key The cache key
   * @param value The value to cache
   * @param ttlMs Optional TTL in milliseconds
   */
  set(key: string, value: T, ttlMs?: number): void {
    const expiry = ttlMs ? Date.now() + ttlMs : null;
    this.cache.set(key, { value, expiry });
  }
  
  /**
   * Check if a key exists in the cache
   * @param key The cache key
   * @returns True if the key exists in the cache and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }
  
  /**
   * Remove a value from the cache
   * @param key The cache key
   */
  remove(key: string): void {
    this.cache.delete(key);
  }
}

/**
 * Options for cached response fallback
 */
export interface CachedResponseFallbackOptions<T> {
  /**
   * The cache key to use for storing and retrieving values
   * Can be a string or a function that generates a key
   */
  cacheKey: string | ((context: PolicyContext) => string);
  
  /**
   * The cache storage to use
   * If not provided, an in-memory cache will be used
   */
  cacheStorage?: CacheStorage<T>;
  
  /**
   * Time-to-live for cached items in milliseconds
   * If not provided, items will not expire
   */
  cacheTtlMs?: number;
  
  /**
   * Optional function to customize the cached value before returning it
   */
  transformCachedValue?: (cachedValue: T, error: Error, context: PolicyContext) => T;
  
  /**
   * A fallback to use if no cached value is available
   * If not provided, the original error will be thrown
   */
  secondaryFallback?: FallbackHandler<T>;
  
  /**
   * Whether to log when a cached value is returned
   * @default true
   */
  logFallback?: boolean;
}

/**
 * Global cache instances indexed by cache name
 */
const globalCaches: Record<string, CacheStorage<any>> = {};

/**
 * Get or create a global cache instance
 * @param cacheName The name of the cache
 * @returns The cache instance
 */
export function getGlobalCache<T>(cacheName: string = 'default'): CacheStorage<T> {
  if (!globalCaches[cacheName]) {
    globalCaches[cacheName] = new InMemoryCache<T>();
  }
  
  return globalCaches[cacheName];
}

/**
 * Creates a fallback handler that returns a previously cached successful response
 * @param options The options for configuring the cached response fallback
 * @returns A fallback handler function
 * 
 * @example
 * // Simple cached response fallback
 * const fallbackHandler = createCachedResponseFallback({
 *   cacheKey: 'user-data'
 * });
 * 
 * // Cached response with secondary fallback
 * const fallbackHandler = createCachedResponseFallback({
 *   cacheKey: context => `product-list-${context.categoryId}`,
 *   cacheTtlMs: 5 * 60 * 1000, // 5 minutes
 *   secondaryFallback: DefaultResponseFallbacks.emptyArray()
 * });
 */
export function createCachedResponseFallback<T>(
  options: CachedResponseFallbackOptions<T>
): FallbackHandler<T> {
  const {
    cacheKey,
    cacheStorage = getGlobalCache<T>(),
    cacheTtlMs,
    transformCachedValue,
    secondaryFallback,
    logFallback = true
  } = options;
  
  return async (error: Error, context: PolicyContext): Promise<T> => {
    const resolvedCacheKey = typeof cacheKey === 'function'
      ? cacheKey(context)
      : cacheKey;
    
    // Check if we have a cached value
    if (cacheStorage.has(resolvedCacheKey)) {
      // Get the cached value
      const cachedValue = cacheStorage.get(resolvedCacheKey) as T;
      
      if (logFallback) {
        logger.info('Using cached value for failed operation', {
          cacheKey: resolvedCacheKey,
          errorType: error.name,
          errorMessage: error.message,
        });
      }
      
      // Transform the cached value if needed
      if (transformCachedValue) {
        return transformCachedValue(cachedValue, error, context);
      }
      
      return cachedValue;
    }
    
    // If no cached value is available and we have a secondary fallback, use it
    if (secondaryFallback) {
      logger.debug('No cached value found, using secondary fallback', {
        cacheKey: resolvedCacheKey,
      });
      
      return secondaryFallback(error, context);
    }
    
    // No cached value and no secondary fallback, rethrow the original error
    logger.debug('No cached value or secondary fallback available', {
      cacheKey: resolvedCacheKey,
    });
    
    throw error;
  };
}

/**
 * Decorator function to automatically cache successful responses
 * This should be applied to the operation that will be protected by the fallback policy
 * 
 * @param options The options for configuring the cache
 * @returns A decorated function that caches its result
 * 
 * @example
 * const operation = withCaching(
 *   () => api.getUsers(),
 *   { cacheKey: 'users', cacheTtlMs: 60000 }
 * );
 * 
 * // Use with fallback policy
 * const fallbackPolicy = new FallbackPolicy({
 *   fallbackHandler: createCachedResponseFallback({ cacheKey: 'users' })
 * });
 * 
 * // The result will be cached on success and used as fallback on failure
 * const result = await fallbackPolicy.execute(operation);
 */
export function withCaching<T>(
  operation: () => Promise<T>,
  options: {
    cacheKey: string | ((context: PolicyContext) => string);
    cacheStorage?: CacheStorage<T>;
    cacheTtlMs?: number;
  }
): (context?: PolicyContext) => Promise<T> {
  const {
    cacheKey,
    cacheStorage = getGlobalCache<T>(),
    cacheTtlMs
  } = options;
  
  return async (context: PolicyContext = {}): Promise<T> => {
    const result = await operation();
    
    // Cache the successful result
    const resolvedCacheKey = typeof cacheKey === 'function'
      ? cacheKey(context)
      : cacheKey;
    
    cacheStorage.set(resolvedCacheKey, result, cacheTtlMs);
    
    return result;
  };
} 
import { useFallback, UseFallbackResult } from './use-fallback';
import { createDefaultResponseFallback, DefaultResponseFallbackOptions } from '../fallback/default-response-fallback';
import { PolicyContext } from '../policies/policy';

/**
 * Options for the useDefaultFallback hook
 */
export interface UseDefaultFallbackOptions<T> extends Omit<DefaultResponseFallbackOptions<T>, 'logFallback'> {
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
 * React hook for using default value fallbacks in functional components
 * This is a specialized version of useFallback that uses createDefaultResponseFallback
 * 
 * @param options Default fallback configuration options
 * @returns A fallback execution context
 * 
 * @example
 * const { execute, usedFallback } = useDefaultFallback({
 *   defaultValue: [],
 *   customizeDefaultValue: (value, error) => ({
 *     ...value,
 *     error: error.message
 *   })
 * });
 * 
 * // Use it to protect API calls
 * const fetchProducts = async () => {
 *   const products = await execute(() => api.getProducts());
 *   
 *   if (usedFallback) {
 *     showOfflineNotification();
 *   }
 *   
 *   return products;
 * };
 */
export function useDefaultFallback<T>(options: UseDefaultFallbackOptions<T>): UseFallbackResult<T> {
  const {
    defaultValue,
    customizeDefaultValue,
    shouldHandle,
    onFallback,
    logOperations = true
  } = options;
  
  // Create a default response fallback handler
  const fallbackHandler = createDefaultResponseFallback({
    defaultValue,
    customizeDefaultValue,
    logFallback: logOperations
  });
  
  // Use the general fallback hook with our configured handler
  return useFallback<T>({
    fallbackHandler,
    shouldHandle,
    onFallback,
    logOperations
  });
}

/**
 * Conveniences for common default fallback patterns
 */
export const DefaultFallbacks = {
  /**
   * Hook that returns an empty array on failure
   */
  emptyArray<T>(): UseFallbackResult<T[]> {
    return useDefaultFallback<T[]>({
      defaultValue: []
    });
  },
  
  /**
   * Hook that returns null on failure
   */
  nullValue<T>(): UseFallbackResult<T | null> {
    return useDefaultFallback<T | null>({
      defaultValue: null
    });
  },
  
  /**
   * Hook that returns a standard error response object
   */
  errorResponse<T>(defaultStatus: number = 500): UseFallbackResult<{
    success: false;
    status: number;
    message: string;
    data: T | null;
  }> {
    return useDefaultFallback({
      defaultValue: {
        success: false,
        status: defaultStatus,
        message: 'An error occurred',
        data: null as T | null
      },
      customizeDefaultValue: (defaultValue, error) => ({
        ...defaultValue,
        message: error.message || defaultValue.message,
      })
    });
  }
}; 
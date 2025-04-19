import { FallbackHandler } from '../policies/fallback-policy';
import { PolicyContext } from '../policies/policy';
import { logger } from '../../../utils/logger';

/**
 * Default response fallback options
 */
export interface DefaultResponseFallbackOptions<T> {
  /**
   * The default value to return
   */
  defaultValue: T;
  
  /**
   * Optional function to customize the default value based on the error
   */
  customizeDefaultValue?: (defaultValue: T, error: Error, context: PolicyContext) => T;
  
  /**
   * Whether to log when the default value is returned
   * @default true
   */
  logFallback?: boolean;
}

/**
 * Creates a fallback handler that returns a default value when operations fail
 * @param options The options for configuring the default response
 * @returns A fallback handler function
 * 
 * @example
 * // Simple default value
 * const fallbackHandler = createDefaultResponseFallback({
 *   defaultValue: [] // Return empty array on failure
 * });
 * 
 * // Custom default value based on error
 * const fallbackHandler = createDefaultResponseFallback({
 *   defaultValue: { status: 'error', data: null },
 *   customizeDefaultValue: (defaultValue, error) => ({
 *     ...defaultValue,
 *     errorMessage: error.message
 *   })
 * });
 */
export function createDefaultResponseFallback<T>(
  options: DefaultResponseFallbackOptions<T>
): FallbackHandler<T> {
  const { defaultValue, customizeDefaultValue, logFallback = true } = options;
  
  return (error: Error, context: PolicyContext): T => {
    if (logFallback) {
      logger.info('Returning default value for failed operation', {
        errorType: error.name,
        errorMessage: error.message,
        defaultValueType: typeof defaultValue,
      });
    }
    
    // Customize the default value if a function is provided
    if (customizeDefaultValue) {
      return customizeDefaultValue(defaultValue, error, context);
    }
    
    // Return the default value
    return defaultValue;
  };
}

/**
 * Convenience factory functions for common default values
 */
export const DefaultResponseFallbacks = {
  /**
   * Create a fallback handler that returns an empty array
   * @returns A fallback handler function that returns an empty array
   */
  emptyArray<T>(): FallbackHandler<T[]> {
    return createDefaultResponseFallback<T[]>({
      defaultValue: [],
    });
  },
  
  /**
   * Create a fallback handler that returns null
   * @returns A fallback handler function that returns null
   */
  nullValue<T>(): FallbackHandler<T | null> {
    return createDefaultResponseFallback<T | null>({
      defaultValue: null,
    });
  },
  
  /**
   * Create a fallback handler that returns a default object
   * @param defaultObj The default object to return
   * @returns A fallback handler function that returns the default object
   */
  defaultObject<T extends object>(defaultObj: T): FallbackHandler<T> {
    return createDefaultResponseFallback<T>({
      defaultValue: defaultObj,
    });
  },
  
  /**
   * Create a fallback handler that returns a default error response object
   * with details from the original error
   * @param defaultStatus The default status to use
   * @returns A fallback handler function that returns an error response object
   */
  errorResponse<T>(defaultStatus: number = 500): FallbackHandler<{
    success: false;
    status: number;
    message: string;
    data: T | null;
  }> {
    return createDefaultResponseFallback({
      defaultValue: {
        success: false,
        status: defaultStatus,
        message: 'An error occurred',
        data: null as T | null,
      },
      customizeDefaultValue: (defaultValue, error) => ({
        ...defaultValue,
        message: error.message || defaultValue.message,
      }),
    });
  },
}; 
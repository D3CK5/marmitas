import { Policy, PolicyContext } from './policy';
import { logger } from '../../../utils/logger';

/**
 * Fallback handler function type
 * Takes the original error as input and returns an alternative response
 */
export type FallbackHandler<T> = (error: Error, context: PolicyContext) => Promise<T> | T;

/**
 * Fallback policy configuration options
 */
export interface FallbackPolicyOptions<T> {
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
}

/**
 * Fallback policy implementation
 * Provides an alternative response when an operation fails
 */
export class FallbackPolicy<T> implements Policy {
  readonly name: string = 'FallbackPolicy';
  private options: FallbackPolicyOptions<T>;
  
  /**
   * Create a new fallback policy
   * @param options Fallback policy options
   */
  constructor(options: FallbackPolicyOptions<T>) {
    this.options = options;
  }
  
  /**
   * Execute an operation with fallback protection
   * @param operation The operation to execute
   * @returns Promise resolving to the operation result or fallback result
   */
  async execute<R extends T>(operation: () => Promise<R>, context: PolicyContext = {}): Promise<R> {
    try {
      // Try the operation first
      return await operation();
    } catch (error) {
      // Check if we should handle this error
      if (!this.shouldHandle(error as Error)) {
        throw error;
      }
      
      // Handle the fallback
      return this.handleFallback(error as Error, context) as R;
    }
  }
  
  /**
   * Handle the fallback process
   * @param error The error that triggered the fallback
   * @param context The policy execution context
   * @returns The fallback result
   */
  private async handleFallback(error: Error, context: PolicyContext): Promise<T> {
    // Update context to indicate we're using a fallback
    context.isFallback = true;
    
    // Log the fallback
    logger.warn('Executing fallback due to error', {
      errorType: error.name,
      errorMessage: error.message,
    });
    
    // Notify of fallback if callback provided
    if (this.options.onFallback) {
      this.options.onFallback(error);
    }
    
    // Execute the fallback handler
    try {
      const fallbackResult = await Promise.resolve(this.options.fallbackHandler(error, context));
      
      logger.debug('Fallback executed successfully', {
        resultType: typeof fallbackResult,
      });
      
      return fallbackResult;
    } catch (fallbackError) {
      // Log error in fallback handler
      logger.error('Error in fallback handler', {
        originalError: error.message,
        fallbackError: (fallbackError as Error).message,
      });
      
      // Re-throw the original error if the fallback fails
      throw error;
    }
  }
  
  /**
   * Determine if an error should trigger the fallback
   * @param error The error to check
   * @returns True if the error should trigger the fallback
   */
  private shouldHandle(error: Error): boolean {
    if (this.options.shouldHandle) {
      return this.options.shouldHandle(error);
    }
    
    // By default, all errors trigger the fallback
    return true;
  }
} 
import { Policy, PolicyContext } from './policy';
import { logger } from '../../../utils/logger';
import { RetryStrategy } from '../retry';
import { isRetryableError } from '../error-classification';

/**
 * Retry policy configuration options
 */
export interface RetryPolicyOptions {
  /**
   * Maximum number of retry attempts
   */
  maxRetries: number;
  
  /**
   * Strategy for calculating delay between retries
   */
  retryStrategy: RetryStrategy;
  
  /**
   * Optional function to determine if an error should be retried
   * If not provided, the default isRetryableError function will be used
   */
  shouldRetry?: (error: Error) => boolean;
  
  /**
   * Optional callback function that will be called before each retry attempt
   */
  onRetry?: (error: Error, retryCount: number, delay: number) => void;
}

/**
 * Default retry policy options
 */
const DEFAULT_OPTIONS: RetryPolicyOptions = {
  maxRetries: 3,
  retryStrategy: new RetryStrategy.ExponentialBackoff(),
};

/**
 * Retry policy implementation
 * Automatically retries failed operations based on configured strategy
 */
export class RetryPolicy implements Policy {
  readonly name: string = 'RetryPolicy';
  private options: RetryPolicyOptions;
  
  /**
   * Create a new retry policy
   * @param options Retry policy options
   */
  constructor(options?: Partial<RetryPolicyOptions>) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
  }
  
  /**
   * Execute an operation with retry policy
   * @param operation The operation to execute
   * @returns Promise resolving to the operation result
   */
  async execute<T>(operation: () => Promise<T>, context: PolicyContext = {}): Promise<T> {
    let retryCount = 0;
    
    // Set initial context
    context.retryCount = retryCount;
    context.isRetry = false;
    
    while (true) {
      try {
        return await operation();
      } catch (error) {
        // Determine if we should retry
        const shouldRetry = this.shouldRetry(error as Error);
        
        // Check if we've reached the maximum retry count
        if (!shouldRetry || retryCount >= this.options.maxRetries) {
          throw error;
        }
        
        // Calculate delay for this retry attempt
        retryCount++;
        const delay = this.options.retryStrategy.getDelay(retryCount);
        
        // Update context
        context.retryCount = retryCount;
        context.isRetry = true;
        
        // Log the retry attempt
        logger.warn(`Retrying operation after failure (attempt ${retryCount}/${this.options.maxRetries})`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          retryCount,
          delay,
        });
        
        // Call onRetry callback if provided
        if (this.options.onRetry) {
          this.options.onRetry(error as Error, retryCount, delay);
        }
        
        // Wait for the calculated delay
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  /**
   * Determine if an error should be retried
   * @param error The error to check
   * @returns True if the error should be retried, false otherwise
   */
  private shouldRetry(error: Error): boolean {
    if (this.options.shouldRetry) {
      return this.options.shouldRetry(error);
    }
    
    return isRetryableError(error);
  }
} 
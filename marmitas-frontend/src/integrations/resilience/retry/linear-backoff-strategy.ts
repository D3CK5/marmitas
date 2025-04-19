import { RetryStrategy } from './retry-strategy';

/**
 * Options for linear backoff strategy
 */
export interface LinearBackoffOptions {
  /**
   * Initial delay in milliseconds
   */
  initialDelayMs: number;
  
  /**
   * Maximum delay in milliseconds
   */
  maxDelayMs: number;
  
  /**
   * Increment in milliseconds per attempt
   */
  incrementMs: number;
}

/**
 * Default linear backoff options
 */
const DEFAULT_OPTIONS: LinearBackoffOptions = {
  initialDelayMs: 100,   // Start with 100ms
  maxDelayMs: 10000,     // Cap at 10 seconds
  incrementMs: 200,      // Add 200ms each time
};

/**
 * Linear backoff retry strategy implementation
 * Increases delay linearly with each retry attempt.
 * Delay = initialDelay + (increment * (attemptNumber - 1))
 */
export class LinearBackoffStrategy implements RetryStrategy {
  private options: LinearBackoffOptions;
  
  /**
   * Create a new linear backoff strategy
   * @param options Strategy options
   */
  constructor(options?: Partial<LinearBackoffOptions>) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
  }
  
  /**
   * Get the delay for a retry attempt
   * @param attemptNumber The current retry attempt number (1-based)
   * @returns Delay in milliseconds
   */
  getDelay(attemptNumber: number): number {
    // Calculate linear delay: initialDelay + (increment * (attemptNumber - 1))
    const delay = this.options.initialDelayMs + (this.options.incrementMs * (attemptNumber - 1));
    
    // Cap the delay at the maximum value
    return Math.min(delay, this.options.maxDelayMs);
  }
} 
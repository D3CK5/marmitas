import { RetryStrategy } from './retry-strategy';

/**
 * Options for exponential backoff strategy
 */
export interface ExponentialBackoffOptions {
  /**
   * Initial delay in milliseconds
   */
  initialDelayMs: number;
  
  /**
   * Maximum delay in milliseconds
   */
  maxDelayMs: number;
  
  /**
   * Backoff factor (multiplier for each attempt)
   */
  factor: number;
}

/**
 * Default exponential backoff options
 */
const DEFAULT_OPTIONS: ExponentialBackoffOptions = {
  initialDelayMs: 100,   // Start with 100ms
  maxDelayMs: 30000,     // Cap at 30 seconds
  factor: 2,             // Double each time
};

/**
 * Exponential backoff retry strategy implementation
 * Increases delay exponentially with each retry attempt.
 * Delay = initialDelay * (factor ^ (attemptNumber - 1))
 */
export class ExponentialBackoffStrategy implements RetryStrategy {
  private options: ExponentialBackoffOptions;
  
  /**
   * Create a new exponential backoff strategy
   * @param options Strategy options
   */
  constructor(options?: Partial<ExponentialBackoffOptions>) {
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
    // Calculate exponential delay: initialDelay * (factor ^ (attemptNumber - 1))
    const delay = this.options.initialDelayMs * Math.pow(this.options.factor, attemptNumber - 1);
    
    // Cap the delay at the maximum value
    return Math.min(delay, this.options.maxDelayMs);
  }
} 
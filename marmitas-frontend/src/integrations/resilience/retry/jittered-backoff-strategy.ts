import { RetryStrategy } from './retry-strategy';

/**
 * Options for jittered backoff strategy
 */
export interface JitteredBackoffOptions {
  /**
   * Base delay in milliseconds
   */
  baseDelayMs: number;
  
  /**
   * Maximum delay in milliseconds
   */
  maxDelayMs: number;
  
  /**
   * Jitter factor (0-1) determining how much randomness to apply
   */
  jitterFactor: number;
}

/**
 * Default jittered backoff options
 */
const DEFAULT_OPTIONS: JitteredBackoffOptions = {
  baseDelayMs: 100,    // Base delay of 100ms
  maxDelayMs: 10000,   // Cap at 10 seconds
  jitterFactor: 0.5,   // 50% jitter
};

/**
 * Jittered backoff retry strategy implementation
 * Uses exponential backoff with randomized jitter to prevent thundering herd problem.
 * Delay = random(baseDelay * (2 ^ (attemptNumber - 1)), jitterFactor)
 */
export class JitteredBackoffStrategy implements RetryStrategy {
  private options: JitteredBackoffOptions;
  
  /**
   * Create a new jittered backoff strategy
   * @param options Strategy options
   */
  constructor(options?: Partial<JitteredBackoffOptions>) {
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
    // Calculate base exponential delay
    const baseDelay = this.options.baseDelayMs * Math.pow(2, attemptNumber - 1);
    
    // Apply jitter to create randomness
    // Formula: baseDelay + (random between -jitterFactor*baseDelay and +jitterFactor*baseDelay)
    const jitterAmount = baseDelay * this.options.jitterFactor;
    const jitter = Math.random() * 2 * jitterAmount - jitterAmount;
    const delay = baseDelay + jitter;
    
    // Cap the delay at the maximum value
    return Math.min(Math.max(0, delay), this.options.maxDelayMs);
  }
} 
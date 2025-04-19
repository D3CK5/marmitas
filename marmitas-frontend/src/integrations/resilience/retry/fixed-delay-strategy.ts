import { RetryStrategy } from './retry-strategy';

/**
 * Options for fixed delay strategy
 */
export interface FixedDelayOptions {
  /**
   * Fixed delay in milliseconds
   */
  delayMs: number;
}

/**
 * Default fixed delay options
 */
const DEFAULT_OPTIONS: FixedDelayOptions = {
  delayMs: 1000,  // 1 second delay between retries
};

/**
 * Fixed delay retry strategy implementation
 * Uses the same delay for all retry attempts
 */
export class FixedDelayStrategy implements RetryStrategy {
  private options: FixedDelayOptions;
  
  /**
   * Create a new fixed delay strategy
   * @param options Strategy options
   */
  constructor(options?: Partial<FixedDelayOptions>) {
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
  getDelay(_attemptNumber: number): number {
    // Return the same fixed delay regardless of attempt number
    return this.options.delayMs;
  }
} 
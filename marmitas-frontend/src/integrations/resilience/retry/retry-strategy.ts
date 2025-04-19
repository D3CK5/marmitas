/**
 * Retry strategy interface
 * Defines how to calculate delay between retry attempts
 */
export interface RetryStrategy {
  /**
   * Get the delay for a retry attempt in milliseconds
   * @param attemptNumber The current retry attempt number (1-based)
   * @returns Delay in milliseconds
   */
  getDelay(attemptNumber: number): number;
}

/**
 * Namespace for retry strategies
 * Will be populated with strategy implementations in index.ts
 */
export namespace RetryStrategy {
  export let ExponentialBackoff: new (options?: any) => RetryStrategy;
  export let LinearBackoff: new (options?: any) => RetryStrategy;
  export let FixedDelay: new (options?: any) => RetryStrategy;
  export let JitteredBackoff: new (options?: any) => RetryStrategy;
} 
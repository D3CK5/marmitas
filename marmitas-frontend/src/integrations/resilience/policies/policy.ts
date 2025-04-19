/**
 * Base resilience policy interface
 * All specific policies (retry, circuit breaker, etc.) should implement this interface
 */
export interface Policy {
  /**
   * Policy name for identification
   */
  name: string;
  
  /**
   * Execute an operation with this policy
   * @param operation The operation to execute
   * @returns Promise resolving to the operation result
   */
  execute<T>(operation: () => Promise<T>): Promise<T>;
}

/**
 * Context for policy execution
 * Policies can use this to pass information between policy layers
 */
export interface PolicyContext {
  /**
   * Retry count for the current operation
   */
  retryCount?: number;
  
  /**
   * Whether the operation is being retried
   */
  isRetry?: boolean;
  
  /**
   * Whether the circuit is open (for circuit breaker)
   */
  isCircuitOpen?: boolean;
  
  /**
   * Whether the operation is using a fallback
   */
  isFallback?: boolean;
  
  /**
   * Whether the operation is using cached data
   */
  isFromCache?: boolean;
  
  /**
   * Operation start time
   */
  startTime?: number;
  
  /**
   * Total execution time (for metrics)
   */
  executionTime?: number;
  
  /**
   * Custom context data
   */
  [key: string]: any;
} 
import { Policy, PolicyContext } from './policy';
import { logger } from '../../../utils/logger';
import { CircuitState } from './circuit-breaker-policy';

/**
 * Advanced circuit breaker configuration options
 */
export interface AdvancedCircuitBreakerOptions {
  /**
   * Failure threshold as a percentage (0-1)
   * Example: 0.5 means open circuit when 50% of requests fail
   */
  failureThresholdPercentage: number;
  
  /**
   * Minimum number of requests before the failure threshold applies
   * This prevents opening the circuit with too few samples
   */
  minimumRequestThreshold: number;
  
  /**
   * Duration in milliseconds over which failures are measured
   * Only failures within this time window count towards the threshold
   */
  samplingDurationMs: number;
  
  /**
   * Duration in milliseconds to keep the circuit open before moving to half-open state
   */
  resetTimeoutMs: number;
  
  /**
   * Function to determine if an error should count towards the failure threshold
   */
  shouldHandleError?: (error: Error) => boolean;
  
  /**
   * Called when the circuit transitions to open state
   */
  onOpen?: (error: Error) => void;
  
  /**
   * Called when the circuit transitions to half-open state
   */
  onHalfOpen?: () => void;
  
  /**
   * Called when the circuit transitions to closed state
   */
  onClose?: () => void;
}

/**
 * Default advanced circuit breaker options
 */
const DEFAULT_OPTIONS: AdvancedCircuitBreakerOptions = {
  failureThresholdPercentage: 0.5,  // Open circuit when 50% of requests fail
  minimumRequestThreshold: 5,       // At least 5 requests in the window
  samplingDurationMs: 60000,        // 1 minute sampling window
  resetTimeoutMs: 30000,           // 30 seconds before half-open
};

/**
 * Request result tracking for windowed measurements
 */
interface RequestResult {
  timestamp: number;
  success: boolean;
}

/**
 * Advanced circuit breaker policy implementation with statistical analysis
 * For services with heavy traffic where a consecutive failure threshold isn't suitable
 */
export class AdvancedCircuitBreakerPolicy implements Policy {
  readonly name: string = 'AdvancedCircuitBreakerPolicy';
  private options: AdvancedCircuitBreakerOptions;
  
  // Circuit state management
  private state: CircuitState = CircuitState.CLOSED;
  private requestResults: RequestResult[] = [];
  private lastFailureTime: number = 0;
  private resetTimeoutId: number | null = null;
  
  /**
   * Create a new advanced circuit breaker policy
   * @param options Advanced circuit breaker options
   */
  constructor(options?: Partial<AdvancedCircuitBreakerOptions>) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
  }
  
  /**
   * Execute an operation with circuit breaker protection
   * @param operation The operation to execute
   * @returns Promise resolving to the operation result
   */
  async execute<T>(operation: () => Promise<T>, context: PolicyContext = {}): Promise<T> {
    // Clean up old request results
    this.cleanupExpiredResults();
    
    // Update context
    context.isCircuitOpen = this.state === CircuitState.OPEN;
    
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      // Check if it's time to transition to half-open
      if (this.shouldTransitionToHalfOpen()) {
        this.transitionToHalfOpen();
      } else {
        // Throw circuit open exception
        const error = new Error('Circuit breaker is open');
        error.name = 'CircuitBreakerOpenError';
        throw error;
      }
    }
    
    // If half-open or closed, try the operation
    try {
      const result = await operation();
      
      // Record successful request
      this.recordResult(true);
      
      // If successful and in half-open state, close the circuit
      if (this.state === CircuitState.HALF_OPEN) {
        this.transitionToClosed();
      }
      
      return result;
    } catch (error) {
      // Determine if error should count towards failure threshold
      if (this.shouldHandleError(error as Error)) {
        this.handleFailure(error as Error);
        
        // Record failed request
        this.recordResult(false);
        
        // In half-open state, any failure trips the circuit again
        if (this.state === CircuitState.HALF_OPEN) {
          this.transitionToOpen(error as Error);
        } 
        // In closed state, check threshold
        else if (this.state === CircuitState.CLOSED) {
          if (this.shouldTripCircuit()) {
            this.transitionToOpen(error as Error);
          }
        }
      }
      
      // Rethrow the error
      throw error;
    }
  }
  
  /**
   * Get the current state of the circuit
   */
  getState(): CircuitState {
    return this.state;
  }
  
  /**
   * Get the current failure percentage in the sampling window
   */
  getFailurePercentage(): number {
    // Clean up expired results first
    this.cleanupExpiredResults();
    
    if (this.requestResults.length === 0) {
      return 0;
    }
    
    const failureCount = this.requestResults.filter(r => !r.success).length;
    return failureCount / this.requestResults.length;
  }
  
  /**
   * Get the number of requests in the current sampling window
   */
  getRequestCount(): number {
    // Clean up expired results first
    this.cleanupExpiredResults();
    
    return this.requestResults.length;
  }
  
  /**
   * Record the result of a request
   * @param success Whether the request was successful
   */
  private recordResult(success: boolean): void {
    this.requestResults.push({
      timestamp: Date.now(),
      success,
    });
  }
  
  /**
   * Clean up request results outside the sampling window
   */
  private cleanupExpiredResults(): void {
    const cutoffTime = Date.now() - this.options.samplingDurationMs;
    this.requestResults = this.requestResults.filter(result => result.timestamp >= cutoffTime);
  }
  
  /**
   * Check if we should trip the circuit based on failure threshold
   */
  private shouldTripCircuit(): boolean {
    // Check minimum request threshold
    if (this.requestResults.length < this.options.minimumRequestThreshold) {
      return false;
    }
    
    // Calculate failure percentage
    const failureCount = this.requestResults.filter(r => !r.success).length;
    const failurePercentage = failureCount / this.requestResults.length;
    
    // Compare to threshold
    return failurePercentage >= this.options.failureThresholdPercentage;
  }
  
  /**
   * Check if we should transition from open to half-open state
   */
  private shouldTransitionToHalfOpen(): boolean {
    const elapsedTime = Date.now() - this.lastFailureTime;
    return elapsedTime >= this.options.resetTimeoutMs;
  }
  
  /**
   * Transition the circuit to open state
   */
  private transitionToOpen(error: Error): void {
    logger.warn('Advanced circuit breaker transitioning to OPEN state', {
      failurePercentage: this.getFailurePercentage().toFixed(2),
      requestCount: this.requestResults.length,
      resetTimeoutMs: this.options.resetTimeoutMs,
      error: error.message,
    });
    
    this.state = CircuitState.OPEN;
    this.lastFailureTime = Date.now();
    
    // Schedule transition to half-open
    if (this.resetTimeoutId !== null) {
      window.clearTimeout(this.resetTimeoutId);
    }
    
    this.resetTimeoutId = window.setTimeout(() => {
      this.transitionToHalfOpen();
    }, this.options.resetTimeoutMs);
    
    // Call the onOpen callback if provided
    if (this.options.onOpen) {
      this.options.onOpen(error);
    }
  }
  
  /**
   * Transition the circuit to half-open state
   */
  private transitionToHalfOpen(): void {
    logger.info('Advanced circuit breaker transitioning to HALF-OPEN state');
    this.state = CircuitState.HALF_OPEN;
    
    // Call the onHalfOpen callback if provided
    if (this.options.onHalfOpen) {
      this.options.onHalfOpen();
    }
  }
  
  /**
   * Transition the circuit to closed state
   */
  private transitionToClosed(): void {
    logger.info('Advanced circuit breaker transitioning to CLOSED state');
    this.state = CircuitState.CLOSED;
    
    // Clear the request history since we're resetting
    this.requestResults = [];
    
    // Clear any scheduled transitions
    if (this.resetTimeoutId !== null) {
      window.clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }
    
    // Call the onClose callback if provided
    if (this.options.onClose) {
      this.options.onClose();
    }
  }
  
  /**
   * Handle a failure (record metrics, etc.)
   */
  private handleFailure(error: Error): void {
    // Log the failure
    logger.error('Advanced circuit breaker detected failure', {
      circuitState: this.state,
      failurePercentage: this.getFailurePercentage().toFixed(2),
      requestCount: this.requestResults.length,
      error: error.message,
    });
  }
  
  /**
   * Determine if an error should count towards the failure threshold
   */
  private shouldHandleError(error: Error): boolean {
    if (this.options.shouldHandleError) {
      return this.options.shouldHandleError(error);
    }
    
    // By default, all errors count towards the threshold
    return true;
  }
} 
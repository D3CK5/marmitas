import { Policy, PolicyContext } from './policy';
import { logger } from '../../../utils/logger';

/**
 * Circuit breaker states
 */
export enum CircuitState {
  /**
   * Circuit is closed, allowing requests to pass through
   */
  CLOSED = 'closed',
  
  /**
   * Circuit is open, failing fast without making actual requests
   */
  OPEN = 'open',
  
  /**
   * Circuit is half-open, allowing a single request to test if the service has recovered
   */
  HALF_OPEN = 'half-open'
}

/**
 * Circuit breaker configuration options
 */
export interface CircuitBreakerOptions {
  /**
   * Number of consecutive failures before opening the circuit
   */
  failureThreshold: number;
  
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
 * Default circuit breaker options
 */
const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,         // Open circuit after 5 consecutive failures
  resetTimeoutMs: 30000,       // Try again after 30 seconds
};

/**
 * Circuit breaker policy implementation
 * Prevents calling a failing service repeatedly by failing fast
 */
export class CircuitBreakerPolicy implements Policy {
  readonly name: string = 'CircuitBreakerPolicy';
  private options: CircuitBreakerOptions;
  
  // Circuit state management
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private resetTimeoutId: number | null = null;
  
  /**
   * Create a new circuit breaker policy
   * @param options Circuit breaker options
   */
  constructor(options?: Partial<CircuitBreakerOptions>) {
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
      
      // If successful and in half-open state, close the circuit
      if (this.state === CircuitState.HALF_OPEN) {
        this.transitionToClosed();
      }
      
      // Reset failure count in closed state on success
      if (this.state === CircuitState.CLOSED) {
        this.failureCount = 0;
      }
      
      return result;
    } catch (error) {
      // Determine if error should count towards failure threshold
      if (this.shouldHandleError(error as Error)) {
        this.handleFailure(error as Error);
        
        // In half-open state, any failure trips the circuit again
        if (this.state === CircuitState.HALF_OPEN) {
          this.transitionToOpen(error as Error);
        } 
        // In closed state, increment failure count and check threshold
        else if (this.state === CircuitState.CLOSED) {
          this.failureCount++;
          this.lastFailureTime = Date.now();
          
          // Check if we need to open the circuit
          if (this.failureCount >= this.options.failureThreshold) {
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
   * Get the current failure count
   */
  getFailureCount(): number {
    return this.failureCount;
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
    logger.warn('Circuit breaker transitioning to OPEN state', {
      failureCount: this.failureCount,
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
    logger.info('Circuit breaker transitioning to HALF-OPEN state');
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
    logger.info('Circuit breaker transitioning to CLOSED state');
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = 0;
    
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
    logger.error('Circuit breaker detected failure', {
      circuitState: this.state,
      failureCount: this.failureCount,
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
  
  /**
   * Reset the circuit breaker to closed state manually
   */
  reset(): void {
    this.transitionToClosed();
  }
} 
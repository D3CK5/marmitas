import { useState, useCallback, useMemo } from 'react';
import { CircuitBreakerPolicy, CircuitState } from '../policies/circuit-breaker-policy';
import { RetryPolicy } from '../policies/retry-policy';
import { FallbackPolicy, FallbackHandler } from '../policies/fallback-policy';
import { PolicyContext } from '../policies/policy';
import { DefaultResponseFallbacks } from '../fallback/default-response-fallback';
import { RetryStrategy } from '../retry';
import { logger } from '../../../utils/logger';

/**
 * Options for resilient operations
 */
export interface UseResilientOperationOptions<T> {
  /**
   * Options for the circuit breaker
   */
  circuitBreaker?: {
    /**
     * Whether to enable the circuit breaker
     * @default true
     */
    enabled?: boolean;
    
    /**
     * A unique identifier for this circuit
     * @default "default-circuit"
     */
    name?: string;
    
    /**
     * Number of consecutive failures before opening the circuit
     * @default 5
     */
    failureThreshold?: number;
    
    /**
     * Duration in milliseconds to keep the circuit open before moving to half-open state
     * @default 30000 (30 seconds)
     */
    resetTimeoutMs?: number;
    
    /**
     * Callback when circuit opens
     */
    onOpen?: (error: Error) => void;
    
    /**
     * Callback when circuit transitions to half-open state
     */
    onHalfOpen?: () => void;
    
    /**
     * Callback when circuit closes
     */
    onClose?: () => void;
  };
  
  /**
   * Options for retry policy
   */
  retry?: {
    /**
     * Whether to enable retries
     * @default true
     */
    enabled?: boolean;
    
    /**
     * Maximum number of retry attempts
     * @default 3
     */
    maxRetries?: number;
    
    /**
     * The retry strategy to use
     * @default ExponentialBackoff
     */
    retryStrategy?: RetryStrategy;
    
    /**
     * Called before each retry attempt
     */
    onRetry?: (error: Error, retryCount: number) => void;
  };
  
  /**
   * Options for fallback policy
   */
  fallback?: {
    /**
     * Whether to enable fallback
     * @default true
     */
    enabled?: boolean;
    
    /**
     * The fallback handler to use
     * If not provided, no fallback will be used (errors will propagate)
     */
    fallbackHandler?: FallbackHandler<T>;
    
    /**
     * Called before falling back to the alternative response
     */
    onFallback?: (error: Error) => void;
  };
  
  /**
   * Whether to log policy events
   * @default true
   */
  logging?: boolean;
}

/**
 * The result of useResilientOperation
 */
export interface UseResilientOperationResult<T> {
  /**
   * Execute an operation with all configured resilience policies
   */
  execute: <R extends T>(operation: () => Promise<R>, context?: PolicyContext) => Promise<R>;
  
  /**
   * Reset the circuit breaker (if enabled)
   */
  resetCircuit: () => void;
  
  /**
   * Current state of the circuit breaker (if enabled)
   */
  circuitState: CircuitState | null;
  
  /**
   * Whether the circuit is currently open
   */
  isCircuitOpen: boolean;
  
  /**
   * Whether the last operation used a fallback
   */
  usedFallback: boolean;
  
  /**
   * The last error that occurred, if any
   */
  lastError: Error | null;
}

/**
 * Hook that combines circuit breaker, retry, and fallback patterns for resilient operations
 * @param options Configuration options for resilience policies
 * @returns An execution context for performing resilient operations
 * 
 * @example
 * const { execute, isCircuitOpen, resetCircuit } = useResilientOperation({
 *   circuitBreaker: { 
 *     name: 'product-service',
 *     failureThreshold: 3 
 *   },
 *   retry: { 
 *     maxRetries: 2 
 *   },
 *   fallback: {
 *     fallbackHandler: DefaultResponseFallbacks.emptyArray()
 *   }
 * });
 * 
 * // Use it to protect API calls with multiple resilience patterns
 * const fetchProducts = async () => {
 *   try {
 *     return await execute(() => api.getProducts());
 *   } catch (err) {
 *     // This will only happen if all resilience patterns fail
 *     showCriticalError();
 *     return [];
 *   }
 * };
 */
export function useResilientOperation<T>(
  options: UseResilientOperationOptions<T> = {}
): UseResilientOperationResult<T> {
  const {
    circuitBreaker: cbOptions = {},
    retry: retryOptions = {},
    fallback: fallbackOptions = {},
    logging = true
  } = options;
  
  // Circuit breaker state
  const [circuitState, setCircuitState] = useState<CircuitState | null>(
    cbOptions.enabled !== false ? CircuitState.CLOSED : null
  );
  
  // Fallback state
  const [usedFallback, setUsedFallback] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);
  
  // Create the circuit breaker policy if enabled
  const circuitBreakerPolicy = useMemo(() => {
    if (cbOptions.enabled === false) return null;
    
    return new CircuitBreakerPolicy({
      failureThreshold: cbOptions.failureThreshold ?? 5,
      resetTimeoutMs: cbOptions.resetTimeoutMs ?? 30000,
      onOpen: (error: Error) => {
        setCircuitState(CircuitState.OPEN);
        if (logging) {
          logger.warn(`Circuit ${cbOptions.name || 'default'} opened`, {
            error: error.message
          });
        }
        if (cbOptions.onOpen) cbOptions.onOpen(error);
      },
      onHalfOpen: () => {
        setCircuitState(CircuitState.HALF_OPEN);
        if (logging) {
          logger.info(`Circuit ${cbOptions.name || 'default'} half-open`);
        }
        if (cbOptions.onHalfOpen) cbOptions.onHalfOpen();
      },
      onClose: () => {
        setCircuitState(CircuitState.CLOSED);
        if (logging) {
          logger.info(`Circuit ${cbOptions.name || 'default'} closed`);
        }
        if (cbOptions.onClose) cbOptions.onClose();
      }
    });
  }, [
    cbOptions.enabled,
    cbOptions.failureThreshold,
    cbOptions.resetTimeoutMs,
    cbOptions.name,
    cbOptions.onOpen,
    cbOptions.onHalfOpen,
    cbOptions.onClose,
    logging
  ]);
  
  // Create the retry policy if enabled
  const retryPolicy = useMemo(() => {
    if (retryOptions.enabled === false) return null;
    
    return new RetryPolicy({
      maxRetries: retryOptions.maxRetries ?? 3,
      retryStrategy: retryOptions.retryStrategy ?? new RetryStrategy.ExponentialBackoff(),
      onRetry: (error: Error, retryCount: number) => {
        if (logging) {
          logger.info(`Retry attempt ${retryCount}`, {
            error: error.message
          });
        }
        if (retryOptions.onRetry) retryOptions.onRetry(error, retryCount);
      }
    });
  }, [
    retryOptions.enabled,
    retryOptions.maxRetries,
    retryOptions.retryStrategy,
    retryOptions.onRetry,
    logging
  ]);
  
  // Create the fallback policy if enabled and a handler is provided
  const fallbackPolicy = useMemo(() => {
    if (fallbackOptions.enabled === false || !fallbackOptions.fallbackHandler) {
      return null;
    }
    
    return new FallbackPolicy<T>({
      fallbackHandler: fallbackOptions.fallbackHandler,
      onFallback: (error: Error) => {
        setUsedFallback(true);
        setLastError(error);
        
        if (logging) {
          logger.warn('Using fallback response', {
            error: error.message
          });
        }
        
        if (fallbackOptions.onFallback) {
          fallbackOptions.onFallback(error);
        }
      }
    });
  }, [
    fallbackOptions.enabled,
    fallbackOptions.fallbackHandler,
    fallbackOptions.onFallback,
    logging
  ]);
  
  // Execute function that applies policies in appropriate order
  const execute = useCallback(<R extends T>(
    operation: () => Promise<R>,
    context: PolicyContext = {}
  ): Promise<R> => {
    // Reset state for new operation
    setUsedFallback(false);
    setLastError(null);
    
    // Apply policies in appropriate order
    // Fallback (outermost) -> Retry -> Circuit Breaker (innermost)
    let wrappedOperation = operation;
    
    // Apply circuit breaker (innermost)
    if (circuitBreakerPolicy) {
      const innerOperation = wrappedOperation;
      wrappedOperation = () => circuitBreakerPolicy.execute(innerOperation, context);
    }
    
    // Apply retry (middle)
    if (retryPolicy) {
      const middleOperation = wrappedOperation;
      wrappedOperation = () => retryPolicy.execute(middleOperation, context);
    }
    
    // Apply fallback (outermost)
    if (fallbackPolicy) {
      return fallbackPolicy.execute(wrappedOperation, context);
    }
    
    // If no fallback, just execute with whatever policies are applied
    return wrappedOperation();
  }, [circuitBreakerPolicy, retryPolicy, fallbackPolicy]);
  
  // Function to manually reset the circuit
  const resetCircuit = useCallback(() => {
    if (circuitBreakerPolicy) {
      circuitBreakerPolicy.reset();
      setCircuitState(CircuitState.CLOSED);
      
      if (logging) {
        logger.info(`Circuit ${cbOptions.name || 'default'} manually reset`);
      }
    }
  }, [circuitBreakerPolicy, cbOptions.name, logging]);
  
  return {
    execute,
    resetCircuit,
    circuitState,
    isCircuitOpen: circuitState === CircuitState.OPEN,
    usedFallback,
    lastError
  };
} 
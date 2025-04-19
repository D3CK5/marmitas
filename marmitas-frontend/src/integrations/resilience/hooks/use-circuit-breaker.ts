import { useState, useEffect, useCallback } from 'react';
import { CircuitState } from '../policies/circuit-breaker-policy';
import { CircuitBreakerPolicy } from '../policies/circuit-breaker-policy';
import { circuitStateMonitor, CircuitInfo } from '../circuit-state-monitor';

/**
 * Options for the useCircuitBreaker hook
 */
export interface UseCircuitBreakerOptions {
  /**
   * Unique identifier for this circuit breaker instance
   */
  name: string;
  
  /**
   * Number of consecutive failures required to trip the circuit
   * @default 5
   */
  failureThreshold?: number;
  
  /**
   * Time in milliseconds to wait before attempting to reset the circuit
   * @default 30000 (30 seconds)
   */
  resetTimeout?: number;
  
  /**
   * Optional metadata to associate with this circuit
   */
  metadata?: Record<string, any>;
  
  /**
   * Called when circuit opens due to failures
   */
  onOpen?: (error: Error) => void;
  
  /**
   * Called when circuit moves to half-open state
   */
  onHalfOpen?: () => void;
  
  /**
   * Called when circuit closes (becomes healthy again)
   */
  onClose?: () => void;
}

/**
 * The return type of the useCircuitBreaker hook
 */
export interface UseCircuitBreakerResult {
  /**
   * Current state of the circuit
   */
  state: CircuitState;
  
  /**
   * Execute an operation with circuit breaker protection
   * @param operation The operation to execute
   * @returns A promise resolving to the operation result, or rejecting if the circuit is open
   */
  execute: <T>(operation: () => Promise<T>) => Promise<T>;
  
  /**
   * Manually reset the circuit to closed state
   */
  reset: () => void;
  
  /**
   * Full circuit information
   */
  circuitInfo: CircuitInfo | undefined;
  
  /**
   * Whether the circuit is currently in open state (failing)
   */
  isOpen: boolean;
  
  /**
   * Whether the circuit is currently in half-open state (testing)
   */
  isHalfOpen: boolean;
  
  /**
   * Whether the circuit is currently in closed state (healthy)
   */
  isClosed: boolean;
}

/**
 * React hook for using circuit breakers in functional components
 * @param options Circuit breaker configuration options
 * @returns A circuit breaker execution context
 * 
 * @example
 * const { execute, state, isOpen } = useCircuitBreaker({
 *   name: 'api-service',
 *   failureThreshold: 3,
 *   resetTimeout: 5000
 * });
 * 
 * // Use it to protect API calls
 * const fetchData = async () => {
 *   try {
 *     const result = await execute(() => api.fetchData());
 *     return result;
 *   } catch (err) {
 *     // Handle error or circuit open state
 *   }
 * };
 */
export function useCircuitBreaker(options: UseCircuitBreakerOptions): UseCircuitBreakerResult {
  const {
    name,
    failureThreshold = 5,
    resetTimeout = 30000,
    metadata,
    onOpen,
    onHalfOpen,
    onClose,
  } = options;
  
  // Initialize circuit breaker policy
  const [circuitBreaker] = useState(
    () => new CircuitBreakerPolicy({
      failureThreshold,
      resetTimeout,
      onOpen,
      onHalfOpen,
      onClose,
    })
  );
  
  // Track current state
  const [state, setState] = useState<CircuitState>(circuitBreaker.getState());
  const [circuitInfo, setCircuitInfo] = useState<CircuitInfo | undefined>(
    circuitStateMonitor.getCircuitInfo(name)
  );
  
  // Register the circuit breaker with the monitor on mount
  useEffect(() => {
    // Register the circuit with the monitor
    circuitStateMonitor.registerCircuit(name, circuitBreaker.getState(), metadata);
    
    // Subscribe to state changes
    const unsubscribe = circuitStateMonitor.onStateChange((info) => {
      if (info.name === name) {
        setState(info.state);
        setCircuitInfo(info);
      }
    });
    
    // Update monitor hooks to make sure we capture state changes
    circuitBreaker.options = {
      ...circuitBreaker.options,
      onOpen: (error: Error) => {
        circuitStateMonitor.updateCircuitState(name, CircuitState.OPEN, {
          lastError: error.message,
          errorTime: Date.now(),
        });
        if (onOpen) onOpen(error);
      },
      onHalfOpen: () => {
        circuitStateMonitor.updateCircuitState(name, CircuitState.HALF_OPEN);
        if (onHalfOpen) onHalfOpen();
      },
      onClose: () => {
        circuitStateMonitor.updateCircuitState(name, CircuitState.CLOSED);
        if (onClose) onClose();
      },
    };
    
    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [name, circuitBreaker, metadata, onOpen, onHalfOpen, onClose]);
  
  // Execute function that wraps operations with circuit breaker
  const execute = useCallback(<T>(operation: () => Promise<T>): Promise<T> => {
    return circuitBreaker.execute(operation);
  }, [circuitBreaker]);
  
  // Manually reset the circuit
  const reset = useCallback(() => {
    circuitStateMonitor.resetCircuit(name);
    circuitBreaker.reset();
  }, [name, circuitBreaker]);
  
  // Derived state helpers
  const isOpen = state === CircuitState.OPEN;
  const isHalfOpen = state === CircuitState.HALF_OPEN;
  const isClosed = state === CircuitState.CLOSED;
  
  return {
    state,
    execute,
    reset,
    circuitInfo,
    isOpen,
    isHalfOpen,
    isClosed,
  };
} 
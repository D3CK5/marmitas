import { logger } from '../../utils/logger';
import { CircuitState } from './policies/circuit-breaker-policy';

/**
 * Information about a monitored circuit
 */
export interface CircuitInfo {
  /**
   * Unique name of the circuit
   */
  name: string;
  
  /**
   * Current state of the circuit
   */
  state: CircuitState;
  
  /**
   * Timestamp when the state last changed
   */
  lastStateChangeTime: number;
  
  /**
   * Additional circuit-specific metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Handler for circuit state change events
 */
export type CircuitStateChangeHandler = (circuitInfo: CircuitInfo) => void;

/**
 * Singleton service to monitor circuit breaker states across the application
 */
class CircuitStateMonitorService {
  private circuits: Map<string, CircuitInfo> = new Map();
  private stateChangeHandlers: CircuitStateChangeHandler[] = [];
  
  /**
   * Register a circuit for monitoring
   * @param name Unique name of the circuit
   * @param initialState Initial circuit state
   * @param metadata Additional circuit-specific metadata
   */
  registerCircuit(name: string, initialState: CircuitState = CircuitState.CLOSED, metadata?: Record<string, any>): void {
    if (this.circuits.has(name)) {
      logger.warn(`Circuit with name "${name}" is already registered`);
      return;
    }
    
    const circuitInfo: CircuitInfo = {
      name,
      state: initialState,
      lastStateChangeTime: Date.now(),
      metadata,
    };
    
    this.circuits.set(name, circuitInfo);
    logger.debug(`Circuit "${name}" registered with state ${initialState}`);
  }
  
  /**
   * Update the state of a monitored circuit
   * @param name Name of the circuit to update
   * @param newState New circuit state
   * @param metadata Optional updated metadata
   */
  updateCircuitState(name: string, newState: CircuitState, metadata?: Record<string, any>): void {
    const circuit = this.circuits.get(name);
    if (!circuit) {
      logger.warn(`Attempted to update unregistered circuit "${name}"`);
      return;
    }
    
    // Only update if state actually changed
    if (circuit.state !== newState) {
      const oldState = circuit.state;
      
      // Update circuit info
      circuit.state = newState;
      circuit.lastStateChangeTime = Date.now();
      if (metadata) {
        circuit.metadata = { ...circuit.metadata, ...metadata };
      }
      
      // Log the state change
      logger.info(`Circuit "${name}" changed state from ${oldState} to ${newState}`, {
        circuit: name,
        oldState,
        newState,
        metadata: circuit.metadata,
      });
      
      // Trigger state change handlers
      this.notifyStateChangeHandlers(circuit);
    }
  }
  
  /**
   * Get information about a specific circuit
   * @param name Name of the circuit
   * @returns Circuit information or undefined if not found
   */
  getCircuitInfo(name: string): CircuitInfo | undefined {
    return this.circuits.get(name);
  }
  
  /**
   * Get information about all monitored circuits
   * @returns Array of circuit information
   */
  getAllCircuits(): CircuitInfo[] {
    return Array.from(this.circuits.values());
  }
  
  /**
   * Get all circuits currently in open state
   * @returns Array of open circuit information
   */
  getOpenCircuits(): CircuitInfo[] {
    return this.getAllCircuits().filter(c => c.state === CircuitState.OPEN);
  }
  
  /**
   * Subscribe to circuit state change events
   * @param handler Handler function to call when circuit states change
   * @returns Function to unsubscribe the handler
   */
  onStateChange(handler: CircuitStateChangeHandler): () => void {
    this.stateChangeHandlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      this.stateChangeHandlers = this.stateChangeHandlers.filter(h => h !== handler);
    };
  }
  
  /**
   * Reset a circuit to closed state
   * This can be used for manual intervention to close a circuit
   * @param name Name of the circuit to reset
   */
  resetCircuit(name: string): void {
    const circuit = this.circuits.get(name);
    if (!circuit) {
      logger.warn(`Attempted to reset unregistered circuit "${name}"`);
      return;
    }
    
    // Update to closed state
    this.updateCircuitState(name, CircuitState.CLOSED);
    logger.info(`Circuit "${name}" manually reset to CLOSED state`);
  }
  
  /**
   * Notify all state change handlers
   * @param circuitInfo Information about the circuit that changed
   */
  private notifyStateChangeHandlers(circuitInfo: CircuitInfo): void {
    this.stateChangeHandlers.forEach(handler => {
      try {
        handler(circuitInfo);
      } catch (error) {
        logger.error('Error in circuit state change handler', {
          error: error instanceof Error ? error.message : String(error),
          circuit: circuitInfo.name,
        });
      }
    });
  }
}

/**
 * Global singleton instance of the circuit state monitor
 */
export const circuitStateMonitor = new CircuitStateMonitorService();

/**
 * Create a monitor wrapper for a circuit breaker policy
 * This adds automatic state monitoring to any circuit breaker
 * @param circuitBreakerPolicy The policy to monitor
 * @param name Unique name for this circuit
 * @param metadata Additional metadata to track with this circuit
 */
export function monitorCircuitBreaker(
  circuitBreakerPolicy: any,
  name: string,
  metadata?: Record<string, any>
): void {
  // Register the circuit
  circuitStateMonitor.registerCircuit(name, circuitBreakerPolicy.getState(), metadata);
  
  // Hook into state transition callbacks
  const originalOptions = circuitBreakerPolicy.options || {};
  
  // Preserve original callbacks
  const originalOnOpen = originalOptions.onOpen;
  const originalOnHalfOpen = originalOptions.onHalfOpen;
  const originalOnClose = originalOptions.onClose;
  
  // Replace with monitoring callbacks
  circuitBreakerPolicy.options = {
    ...originalOptions,
    onOpen: (error: Error) => {
      circuitStateMonitor.updateCircuitState(name, CircuitState.OPEN, {
        lastError: error.message,
        errorTime: Date.now(),
      });
      if (originalOnOpen) originalOnOpen(error);
    },
    onHalfOpen: () => {
      circuitStateMonitor.updateCircuitState(name, CircuitState.HALF_OPEN);
      if (originalOnHalfOpen) originalOnHalfOpen();
    },
    onClose: () => {
      circuitStateMonitor.updateCircuitState(name, CircuitState.CLOSED);
      if (originalOnClose) originalOnClose();
    },
  };
} 
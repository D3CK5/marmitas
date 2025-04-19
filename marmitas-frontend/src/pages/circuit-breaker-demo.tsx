import React, { useEffect } from 'react';
import { CircuitBreakerStatusPanel } from '../components/circuit-breaker/CircuitBreakerStatusPanel';
import { circuitStateMonitor, CircuitState } from '../integrations/resilience/circuit-state-monitor';
import styles from './circuit-breaker-demo.module.css';

const CircuitBreakerDemoPage: React.FC = () => {
  // Add some example circuits for demonstration purposes
  useEffect(() => {
    // Reset any existing circuits when demo loads
    const existingCircuits = circuitStateMonitor.getAllCircuits();
    existingCircuits.forEach(circuit => {
      circuitStateMonitor.resetCircuit(circuit.name);
    });
    
    // Register demo circuits if they don't exist
    if (!circuitStateMonitor.getCircuit('api.users')) {
      circuitStateMonitor.registerCircuit('api.users', CircuitState.CLOSED);
    }
    
    if (!circuitStateMonitor.getCircuit('api.orders')) {
      circuitStateMonitor.registerCircuit('api.orders', CircuitState.HALF_OPEN, {
        lastError: 'Connection timeout after 5000ms',
        errorTime: Date.now() - 120000, // 2 minutes ago
        failureCount: 3,
        retryAttempt: 1
      });
    }
    
    if (!circuitStateMonitor.getCircuit('payment.gateway')) {
      circuitStateMonitor.registerCircuit('payment.gateway', CircuitState.OPEN, {
        lastError: 'Service Unavailable (503)',
        errorTime: Date.now() - 300000, // 5 minutes ago
        consecutiveFailures: 5,
        willRetryAt: Date.now() + 60000 // In 1 minute
      });
    }
  }, []);

  const triggerFailure = (circuitName: string) => {
    const circuit = circuitStateMonitor.getCircuit(circuitName);
    if (circuit && circuit.state !== CircuitState.OPEN) {
      circuitStateMonitor.updateCircuitState(
        circuitName, 
        CircuitState.OPEN, 
        {
          lastError: 'Manually triggered failure',
          errorTime: Date.now(),
          failureCount: (circuit.metadata?.failureCount || 0) + 1
        }
      );
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Circuit Breaker Demo</h1>
      
      <div className={styles.demoActions}>
        <h2>Demo Actions</h2>
        <div className={styles.buttonGroup}>
          <button 
            className={styles.demoButton} 
            onClick={() => triggerFailure('api.users')}
          >
            Fail Users API
          </button>
          <button 
            className={styles.demoButton} 
            onClick={() => circuitStateMonitor.resetCircuit('api.orders')}
          >
            Reset Orders API
          </button>
          <button 
            className={styles.demoButton} 
            onClick={() => circuitStateMonitor.updateCircuitState('payment.gateway', CircuitState.HALF_OPEN, {
              retryAttempt: 1,
              lastRetryTime: Date.now()
            })}
          >
            Retry Payment Gateway
          </button>
        </div>
      </div>
      
      <div className={styles.statusPanelContainer}>
        <CircuitBreakerStatusPanel 
          title="System Circuit Breakers" 
          refreshInterval={3000}
        />
      </div>
      
      <div className={styles.infoBox}>
        <h3>About Circuit Breakers</h3>
        <p>
          Circuit breakers help prevent cascading failures in distributed systems. 
          They monitor for failures and automatically "break the circuit" to prevent 
          repeated calls to failing services.
        </p>
        <p>
          <strong>Closed:</strong> Normal operation, requests pass through.<br />
          <strong>Open:</strong> Failing state, requests immediately fail without calling the service.<br />
          <strong>Half-Open:</strong> Testing state, allowing limited traffic to check if the service has recovered.
        </p>
      </div>
    </div>
  );
};

export default CircuitBreakerDemoPage; 
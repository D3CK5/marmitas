import React, { useState, useEffect } from 'react';
import { CircuitInfo, circuitStateMonitor, CircuitState } from '../../integrations/resilience/circuit-state-monitor';
import styles from './CircuitBreakerStatusPanel.module.css';

interface CircuitBreakerStatusPanelProps {
  /**
   * Title displayed at the top of the panel
   * @default "Circuit Breaker Status"
   */
  title?: string;

  /**
   * When true, automatically refreshes the circuit status periodically
   * @default true
   */
  autoRefresh?: boolean;

  /**
   * Interval in milliseconds between auto-refreshes
   * @default 5000 (5 seconds)
   */
  refreshInterval?: number;

  /**
   * Optional CSS class name to apply to the container
   */
  className?: string;

  /**
   * Whether to allow manual reset of circuits from the UI
   * @default true
   */
  allowReset?: boolean;
}

/**
 * Displays the status of all circuit breakers in the application
 */
export const CircuitBreakerStatusPanel: React.FC<CircuitBreakerStatusPanelProps> = ({
  title = 'Circuit Breaker Status',
  autoRefresh = true,
  refreshInterval = 5000,
  className = '',
  allowReset = true,
}) => {
  const [circuits, setCircuits] = useState<CircuitInfo[]>([]);
  const [expandedCircuit, setExpandedCircuit] = useState<string | null>(null);

  // Load initial circuits and subscribe to changes
  useEffect(() => {
    // Initial load
    setCircuits(circuitStateMonitor.getAllCircuits());

    // Subscribe to state changes
    const unsubscribe = circuitStateMonitor.onStateChange(() => {
      setCircuits(circuitStateMonitor.getAllCircuits());
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Set up auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      setCircuits(circuitStateMonitor.getAllCircuits());
    }, refreshInterval);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval]);

  // Reset a circuit
  const handleResetCircuit = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    circuitStateMonitor.resetCircuit(name);
  };

  // Toggle expanded state of a circuit
  const toggleExpand = (name: string) => {
    setExpandedCircuit(expandedCircuit === name ? null : name);
  };

  // Helper to format timestamps
  const formatTime = (timestamp: number): string => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  // No circuits to display
  if (circuits.length === 0) {
    return (
      <div className={`${styles.container} ${className}`}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.emptyState}>
          No circuit breakers have been registered.
        </div>
      </div>
    );
  }

  // Get color based on circuit state
  const getStateColor = (state: CircuitState): string => {
    switch (state) {
      case CircuitState.OPEN:
        return styles.stateOpen;
      case CircuitState.HALF_OPEN:
        return styles.stateHalfOpen;
      case CircuitState.CLOSED:
        return styles.stateClosed;
      default:
        return '';
    }
  };

  // Get human-readable state label
  const getStateLabel = (state: CircuitState): string => {
    switch (state) {
      case CircuitState.OPEN:
        return 'Open (Failing)';
      case CircuitState.HALF_OPEN:
        return 'Half-Open (Testing)';
      case CircuitState.CLOSED:
        return 'Closed (Healthy)';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <h2 className={styles.title}>{title}</h2>
      
      <div className={styles.circuitList}>
        {circuits.map(circuit => (
          <div 
            key={circuit.name}
            className={`${styles.circuitCard} ${expandedCircuit === circuit.name ? styles.expanded : ''}`}
            onClick={() => toggleExpand(circuit.name)}
          >
            <div className={styles.circuitHeader}>
              <div className={styles.circuitName}>{circuit.name}</div>
              <div className={`${styles.circuitState} ${getStateColor(circuit.state)}`}>
                {getStateLabel(circuit.state)}
              </div>
              {allowReset && circuit.state !== CircuitState.CLOSED && (
                <button 
                  className={styles.resetButton}
                  onClick={(e) => handleResetCircuit(circuit.name, e)}
                >
                  Reset
                </button>
              )}
            </div>
            
            {expandedCircuit === circuit.name && (
              <div className={styles.circuitDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Last State Change:</span>
                  <span className={styles.detailValue}>{formatTime(circuit.lastStateChange)}</span>
                </div>
                
                {circuit.metadata?.lastError && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Last Error:</span>
                    <span className={styles.detailValue}>{circuit.metadata.lastError}</span>
                  </div>
                )}
                
                {circuit.metadata?.errorTime && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Error Time:</span>
                    <span className={styles.detailValue}>{formatTime(circuit.metadata.errorTime)}</span>
                  </div>
                )}
                
                {/* Display any additional metadata */}
                {circuit.metadata && Object.entries(circuit.metadata)
                  .filter(([key]) => !['lastError', 'errorTime'].includes(key))
                  .map(([key, value]) => (
                    <div key={key} className={styles.detailRow}>
                      <span className={styles.detailLabel}>{key}:</span>
                      <span className={styles.detailValue}>
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}; 
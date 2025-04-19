import { logger } from '../utils/logger.utils.js';
import { websocketService } from './websocket.service.js';
import { config } from '../config/app.config.js';

/**
 * WebSocket Connection Management Service
 * Handles WebSocket connection lifecycle and monitoring
 */
class WebSocketConnectionService {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private metrics = {
    totalConnections: 0,
    authenticatedConnections: 0,
    messagesProcessed: 0,
    connectionErrors: 0,
    peakConnections: 0,
    reconnects: 0
  };
  
  /**
   * Initialize the WebSocket connection management service
   */
  initialize(): void {
    // Start the connection monitoring
    this.startConnectionMonitoring();
    
    logger.info('WebSocket connection management service initialized');
  }
  
  /**
   * Start the connection monitoring
   */
  private startConnectionMonitoring(): void {
    const monitoringInterval = config.websocket?.monitoringInterval || 60000; // 1 minute default
    
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
      this.logMetrics();
      
      // Check if we need to implement connection limiting
      this.enforceConnectionLimits();
    }, monitoringInterval);
  }
  
  /**
   * Update the connection metrics
   */
  private updateMetrics(): void {
    const currentConnections = websocketService.getConnectionCount();
    const authenticatedConnections = websocketService.getAuthenticatedConnectionCount();
    
    this.metrics.totalConnections = currentConnections;
    this.metrics.authenticatedConnections = authenticatedConnections;
    
    // Update peak connections if needed
    if (currentConnections > this.metrics.peakConnections) {
      this.metrics.peakConnections = currentConnections;
    }
  }
  
  /**
   * Log the current metrics
   */
  private logMetrics(): void {
    logger.info('WebSocket connection metrics', {
      totalConnections: this.metrics.totalConnections,
      authenticatedConnections: this.metrics.authenticatedConnections,
      peakConnections: this.metrics.peakConnections,
      messagesProcessed: this.metrics.messagesProcessed,
      connectionErrors: this.metrics.connectionErrors,
      reconnects: this.metrics.reconnects
    });
  }
  
  /**
   * Enforce connection limits if configured
   */
  private enforceConnectionLimits(): void {
    const maxConnections = config.websocket?.maxConnections;
    if (!maxConnections || this.metrics.totalConnections <= maxConnections) {
      return;
    }
    
    logger.warn('WebSocket connection limit reached', { 
      currentConnections: this.metrics.totalConnections,
      maxConnections
    });
    
    // Implementation of connection limiting would go here
    // For now, we're just logging the warning
  }
  
  /**
   * Increment the message processed count
   */
  incrementMessagesProcessed(): void {
    this.metrics.messagesProcessed++;
  }
  
  /**
   * Increment the connection errors count
   */
  incrementConnectionErrors(): void {
    this.metrics.connectionErrors++;
  }
  
  /**
   * Increment the reconnects count
   */
  incrementReconnects(): void {
    this.metrics.reconnects++;
  }
  
  /**
   * Get the current metrics
   */
  getMetrics(): any {
    return { ...this.metrics };
  }
  
  /**
   * Stop the connection monitoring
   */
  shutdown(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    logger.info('WebSocket connection management service shutdown');
  }
}

// Export singleton instance
export const websocketConnectionService = new WebSocketConnectionService(); 
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.utils.js';
import { config } from '../config/app.config.js';

// Types for WebSocket connections
export interface WebSocketConnection {
  id: string;
  socket: WebSocket;
  userId?: string;
  isAuthenticated: boolean;
  subscriptions: Set<string>;
  lastActivity: number;
}

/**
 * WebSocket Service
 * Manages WebSocket connections and message distribution
 */
class WebSocketService {
  private wss: WebSocketServer | null = null;
  private connections: Map<string, WebSocketConnection> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  
  /**
   * Initialize the WebSocket server
   * @param server HTTP or HTTPS server to attach to
   */
  initialize(server: HttpServer | HttpsServer): void {
    // Create WebSocket server attached to our HTTP/HTTPS server
    this.wss = new WebSocketServer({
      server,
      path: config.websocket?.path || '/ws',
    });
    
    logger.info('WebSocket server initialized', {
      path: config.websocket?.path || '/ws',
      maxPayload: config.websocket?.maxPayload || '100kb'
    });
    
    // Set up connection handling
    this.setupConnectionHandling();
    
    // Start heartbeat mechanism
    this.startHeartbeat();
  }
  
  /**
   * Configure WebSocket connection handling
   */
  private setupConnectionHandling(): void {
    if (!this.wss) {
      return;
    }
    
    this.wss.on('connection', (socket: WebSocket, request) => {
      // Create a unique ID for this connection
      const connectionId = uuidv4();
      
      // Store the connection
      this.connections.set(connectionId, {
        id: connectionId,
        socket,
        isAuthenticated: false,
        subscriptions: new Set(),
        lastActivity: Date.now()
      });
      
      logger.debug('New WebSocket connection established', { 
        connectionId,
        ip: request.socket.remoteAddress
      });
      
      // Set up message handling for this connection
      this.setupMessageHandling(connectionId, socket);
      
      // Handle disconnection
      socket.on('close', () => {
        logger.debug('WebSocket connection closed', { connectionId });
        this.connections.delete(connectionId);
      });
      
      // Handle connection errors
      socket.on('error', (error) => {
        logger.error('WebSocket connection error', { 
          connectionId,
          error: error.message
        });
      });
      
      // Send welcome message with connection ID
      this.sendToConnection(connectionId, {
        type: 'connection',
        message: 'Connection established',
        connectionId
      });
    });
  }
  
  /**
   * Set up message handling for a connection
   * @param connectionId The connection's unique ID
   * @param socket The WebSocket instance
   */
  private setupMessageHandling(connectionId: string, socket: WebSocket): void {
    socket.on('message', (data: WebSocket.Data) => {
      try {
        // Update last activity timestamp
        const connection = this.connections.get(connectionId);
        if (connection) {
          connection.lastActivity = Date.now();
        }
        
        // Parse the message
        let message;
        try {
          message = JSON.parse(data.toString());
        } catch (error) {
          this.sendToConnection(connectionId, {
            type: 'error',
            message: 'Invalid JSON message'
          });
          return;
        }
        
        // Process the message based on its type
        switch (message.type) {
          case 'ping':
            this.handlePing(connectionId);
            break;
          
          case 'authenticate':
            this.handleAuthentication(connectionId, message);
            break;
          
          case 'subscribe':
            this.handleSubscription(connectionId, message);
            break;
          
          case 'unsubscribe':
            this.handleUnsubscription(connectionId, message);
            break;
          
          default:
            this.sendToConnection(connectionId, {
              type: 'error',
              message: 'Unknown message type'
            });
        }
      } catch (error) {
        logger.error('Error processing WebSocket message', {
          connectionId,
          error: error instanceof Error ? error.message : String(error)
        });
        
        this.sendToConnection(connectionId, {
          type: 'error',
          message: 'Server error processing message'
        });
      }
    });
  }
  
  /**
   * Handle ping messages to keep the connection alive
   * @param connectionId The connection's unique ID
   */
  private handlePing(connectionId: string): void {
    this.sendToConnection(connectionId, {
      type: 'pong',
      timestamp: Date.now()
    });
  }
  
  /**
   * Start heartbeat mechanism to detect stale connections
   */
  private startHeartbeat(): void {
    const heartbeatInterval = config.websocket?.heartbeatInterval || 30000; // 30 seconds default
    
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const staleThreshold = now - (config.websocket?.staleConnectionTimeout || 120000); // 2 minutes default
      
      this.connections.forEach((connection, connectionId) => {
        // Check if connection is stale
        if (connection.lastActivity < staleThreshold) {
          logger.debug('Closing stale WebSocket connection', { connectionId });
          
          // Close the connection
          connection.socket.terminate();
          this.connections.delete(connectionId);
        } else {
          // Send heartbeat to active connections
          this.sendToConnection(connectionId, {
            type: 'heartbeat',
            timestamp: now
          });
        }
      });
    }, heartbeatInterval);
  }
  
  /**
   * Stop the WebSocket server and clean up resources
   */
  shutdown(): void {
    // Clear heartbeat interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    // Close all connections
    this.connections.forEach((connection) => {
      try {
        connection.socket.terminate();
      } catch (error) {
        // Ignore errors during shutdown
      }
    });
    
    // Clear connections map
    this.connections.clear();
    
    // Close the server
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    
    logger.info('WebSocket server shutdown complete');
  }
  
  /**
   * Send a message to a specific connection
   * @param connectionId The connection's unique ID
   * @param message The message to send
   */
  sendToConnection(connectionId: string, message: any): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return false;
    }
    
    try {
      connection.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      logger.error('Error sending WebSocket message', {
        connectionId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }
  
  /**
   * Broadcast a message to multiple connections
   * @param connectionIds Array of connection IDs to send to
   * @param message The message to send
   * @returns Number of successful sends
   */
  broadcastToConnections(connectionIds: string[], message: any): number {
    let successCount = 0;
    
    connectionIds.forEach(connectionId => {
      if (this.sendToConnection(connectionId, message)) {
        successCount++;
      }
    });
    
    return successCount;
  }
  
  /**
   * Get a connection by ID
   * @param connectionId The connection's unique ID
   */
  getConnection(connectionId: string): WebSocketConnection | undefined {
    return this.connections.get(connectionId);
  }
  
  /**
   * Handle authentication messages
   * This will be overridden by the websocket-auth.service
   * @param connectionId The connection's unique ID
   * @param message The authentication message
   */
  handleAuthentication(connectionId: string, message: any): void {
    // This is a placeholder that will be overridden
    this.sendToConnection(connectionId, {
      type: 'auth_response',
      success: false,
      message: 'Authentication not yet implemented'
    });
  }
  
  /**
   * Handle subscription messages
   * This will be overridden by the websocket-subscription.service
   * @param connectionId The connection's unique ID
   * @param message The subscription message
   */
  handleSubscription(connectionId: string, message: any): void {
    // This is a placeholder that will be overridden
    this.sendToConnection(connectionId, {
      type: 'subscription_response',
      success: false,
      message: 'Subscription management not yet implemented'
    });
  }
  
  /**
   * Handle unsubscription messages
   * This will be overridden by the websocket-subscription.service
   * @param connectionId The connection's unique ID
   * @param message The unsubscription message
   */
  handleUnsubscription(connectionId: string, message: any): void {
    // This is a placeholder that will be overridden
    this.sendToConnection(connectionId, {
      type: 'unsubscription_response',
      success: false,
      message: 'Subscription management not yet implemented'
    });
  }
  
  /**
   * Get the total number of active connections
   */
  getConnectionCount(): number {
    return this.connections.size;
  }
  
  /**
   * Get the total number of authenticated connections
   */
  getAuthenticatedConnectionCount(): number {
    let count = 0;
    this.connections.forEach((connection) => {
      if (connection.isAuthenticated) {
        count++;
      }
    });
    return count;
  }
  
  /**
   * Get all connection IDs
   */
  getAllConnectionIds(): string[] {
    return Array.from(this.connections.keys());
  }
  
  /**
   * Get all authenticated connection IDs
   */
  getAuthenticatedConnectionIds(): string[] {
    const authConnections: string[] = [];
    this.connections.forEach((connection, connectionId) => {
      if (connection.isAuthenticated) {
        authConnections.push(connectionId);
      }
    });
    return authConnections;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService(); 
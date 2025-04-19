import { getConfig } from '../../utils/config';
import { logger } from '../../utils/logger';

/**
 * WebSocket connection states
 */
export enum WebSocketConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  FAILED = 'failed'
}

/**
 * WebSocket message types
 */
export enum WebSocketMessageType {
  PING = 'ping',
  PONG = 'pong',
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  EVENT = 'event',
  AUTH = 'auth',
  ERROR = 'error'
}

/**
 * WebSocket message interface
 */
export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
  id?: string;
  timestamp?: number;
}

/**
 * WebSocket event listener type
 */
export type WebSocketEventListener = (event: WebSocketMessage) => void;

/**
 * WebSocket connection state change listener type
 */
export type WebSocketStateListener = (state: WebSocketConnectionState) => void;

/**
 * WebSocket client options
 */
export interface WebSocketClientOptions {
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  pingInterval?: number;
  authToken?: string;
}

/**
 * WebSocket client for communicating with the backend
 */
export class WebSocketClient {
  private socket: WebSocket | null = null;
  private state: WebSocketConnectionState = WebSocketConnectionState.DISCONNECTED;
  private eventListeners: Map<string, Set<WebSocketEventListener>> = new Map();
  private stateListeners: Set<WebSocketStateListener> = new Set();
  private reconnectAttempts: number = 0;
  private reconnectTimer: number | null = null;
  private pingTimer: number | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private authToken: string | null = null;
  
  private options: Required<WebSocketClientOptions> = {
    reconnectInterval: 1000, // Start with 1 second, will increase with backoff
    maxReconnectAttempts: 10,
    pingInterval: 30000, // 30 seconds
    authToken: null
  };
  
  /**
   * Initialize the WebSocket client with options
   * @param options Client options
   */
  initialize(options?: WebSocketClientOptions): void {
    this.options = { ...this.options, ...options };
    this.authToken = this.options.authToken;
    
    logger.info('WebSocket client initialized', { 
      reconnectInterval: this.options.reconnectInterval,
      maxReconnectAttempts: this.options.maxReconnectAttempts,
      pingInterval: this.options.pingInterval
    });
  }
  
  /**
   * Connect to the WebSocket server
   */
  connect(): void {
    if (this.socket && (this.state === WebSocketConnectionState.CONNECTED || 
                        this.state === WebSocketConnectionState.CONNECTING)) {
      logger.debug('WebSocket already connected or connecting');
      return;
    }
    
    this.updateState(WebSocketConnectionState.CONNECTING);
    
    try {
      const wsUrl = getConfig().WEBSOCKET_URL;
      if (!wsUrl) {
        throw new Error('WebSocket URL not configured');
      }
      
      this.socket = new WebSocket(wsUrl);
      
      // Set up event handlers
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      
      logger.debug('WebSocket connecting to', { url: wsUrl });
    } catch (error) {
      logger.error('Error connecting to WebSocket', { 
        error: error instanceof Error ? error.message : String(error)
      });
      this.updateState(WebSocketConnectionState.FAILED);
      this.scheduleReconnect();
    }
  }
  
  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    this.clearTimers();
    
    if (this.socket) {
      try {
        this.socket.close();
      } catch (error) {
        // Ignore errors during disconnect
      }
      
      this.socket = null;
      this.updateState(WebSocketConnectionState.DISCONNECTED);
      logger.debug('WebSocket disconnected');
    }
  }
  
  /**
   * Send a message to the WebSocket server
   * @param type Message type
   * @param payload Message payload
   * @param id Optional message ID
   * @returns True if message was sent, false if queued
   */
  send(type: WebSocketMessageType, payload: any, id?: string): boolean {
    const message: WebSocketMessage = {
      type,
      payload,
      id: id || crypto.randomUUID(),
      timestamp: Date.now()
    };
    
    // If not connected, queue the message
    if (!this.isConnected()) {
      this.queueMessage(message);
      return false;
    }
    
    try {
      this.socket.send(JSON.stringify(message));
      logger.debug('WebSocket message sent', { type, id: message.id });
      return true;
    } catch (error) {
      logger.error('Error sending WebSocket message', {
        error: error instanceof Error ? error.message : String(error),
        type,
        id: message.id
      });
      this.queueMessage(message);
      return false;
    }
  }
  
  /**
   * Add an event listener for a specific message type
   * @param type Message type to listen for
   * @param listener The event listener function
   */
  addEventListener(type: WebSocketMessageType, listener: WebSocketEventListener): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    
    this.eventListeners.get(type).add(listener);
  }
  
  /**
   * Remove an event listener
   * @param type Message type
   * @param listener The listener to remove
   * @returns True if listener was removed
   */
  removeEventListener(type: WebSocketMessageType, listener: WebSocketEventListener): boolean {
    const listeners = this.eventListeners.get(type);
    if (!listeners) {
      return false;
    }
    
    return listeners.delete(listener);
  }
  
  /**
   * Add a connection state change listener
   * @param listener The state change listener
   */
  addStateListener(listener: WebSocketStateListener): void {
    this.stateListeners.add(listener);
  }
  
  /**
   * Remove a connection state change listener
   * @param listener The listener to remove
   * @returns True if listener was removed
   */
  removeStateListener(listener: WebSocketStateListener): boolean {
    return this.stateListeners.delete(listener);
  }
  
  /**
   * Get the current connection state
   */
  getState(): WebSocketConnectionState {
    return this.state;
  }
  
  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.state === WebSocketConnectionState.CONNECTED && 
           this.socket?.readyState === WebSocket.OPEN;
  }
  
  /**
   * Update the authentication token
   * @param token The new authentication token
   */
  updateAuthToken(token: string): void {
    this.authToken = token;
    
    // If connected, send the updated token
    if (this.isConnected()) {
      this.send(WebSocketMessageType.AUTH, { token });
    }
  }
  
  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    logger.info('WebSocket connection established');
    this.updateState(WebSocketConnectionState.CONNECTED);
    this.reconnectAttempts = 0;
    
    // Send authentication if we have a token
    if (this.authToken) {
      this.send(WebSocketMessageType.AUTH, { token: this.authToken });
    }
    
    // Process any queued messages
    this.processMessageQueue();
    
    // Start ping interval
    this.startPingTimer();
  }
  
  /**
   * Handle WebSocket close event
   * @param event Close event
   */
  private handleClose(event: CloseEvent): void {
    logger.debug('WebSocket connection closed', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean
    });
    
    this.clearTimers();
    
    if (this.state !== WebSocketConnectionState.DISCONNECTED) {
      this.updateState(WebSocketConnectionState.DISCONNECTED);
      this.scheduleReconnect();
    }
  }
  
  /**
   * Handle WebSocket error event
   * @param event Error event
   */
  private handleError(event: Event): void {
    logger.error('WebSocket error', { event });
    
    // WebSocket will also fire onclose after error
    this.updateState(WebSocketConnectionState.FAILED);
  }
  
  /**
   * Handle WebSocket message event
   * @param event Message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      logger.debug('WebSocket message received', { 
        type: message.type, 
        id: message.id 
      });
      
      // Handle pings with automatic pong response
      if (message.type === WebSocketMessageType.PING) {
        this.send(WebSocketMessageType.PONG, { timestamp: Date.now() });
        return;
      }
      
      // Notify listeners for this message type
      const listeners = this.eventListeners.get(message.type);
      if (listeners) {
        listeners.forEach(listener => {
          try {
            listener(message);
          } catch (error) {
            logger.error('Error in WebSocket event listener', {
              error: error instanceof Error ? error.message : String(error),
              type: message.type
            });
          }
        });
      }
    } catch (error) {
      logger.error('Error parsing WebSocket message', {
        error: error instanceof Error ? error.message : String(error),
        data: event.data
      });
    }
  }
  
  /**
   * Schedule reconnection attempt with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      logger.warn('Maximum reconnection attempts reached');
      this.updateState(WebSocketConnectionState.FAILED);
      return;
    }
    
    // Calculate backoff delay: 2^attempts * base interval, capped at 30 seconds
    const delay = Math.min(
      Math.pow(2, this.reconnectAttempts) * this.options.reconnectInterval,
      30000
    );
    
    this.reconnectAttempts++;
    this.updateState(WebSocketConnectionState.RECONNECTING);
    
    logger.debug('Scheduling WebSocket reconnect', {
      attempt: this.reconnectAttempts,
      delay,
      maxAttempts: this.options.maxReconnectAttempts
    });
    
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
  
  /**
   * Start ping timer to keep connection alive
   */
  private startPingTimer(): void {
    this.clearPingTimer();
    
    this.pingTimer = window.setInterval(() => {
      if (this.isConnected()) {
        this.send(WebSocketMessageType.PING, { timestamp: Date.now() });
      }
    }, this.options.pingInterval);
  }
  
  /**
   * Clear ping timer
   */
  private clearPingTimer(): void {
    if (this.pingTimer !== null) {
      window.clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }
  
  /**
   * Clear all timers
   */
  private clearTimers(): void {
    this.clearPingTimer();
    
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
  
  /**
   * Update connection state and notify listeners
   * @param state New connection state
   */
  private updateState(state: WebSocketConnectionState): void {
    if (this.state === state) {
      return;
    }
    
    this.state = state;
    
    // Notify state listeners
    this.stateListeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        logger.error('Error in WebSocket state listener', {
          error: error instanceof Error ? error.message : String(error),
          state
        });
      }
    });
  }
  
  /**
   * Queue a message to send when connected
   * @param message Message to queue
   */
  private queueMessage(message: WebSocketMessage): void {
    // Add to queue, limited to 100 messages to prevent memory issues
    if (this.messageQueue.length < 100) {
      this.messageQueue.push(message);
      logger.debug('WebSocket message queued', { 
        type: message.type, 
        id: message.id,
        queueSize: this.messageQueue.length
      });
    } else {
      logger.warn('WebSocket message queue full, dropping message', {
        type: message.type,
        id: message.id
      });
    }
  }
  
  /**
   * Process queued messages
   */
  private processMessageQueue(): void {
    if (this.messageQueue.length === 0) {
      return;
    }
    
    logger.debug('Processing WebSocket message queue', { 
      queueSize: this.messageQueue.length 
    });
    
    // Create a copy of the queue and clear it
    const queue = [...this.messageQueue];
    this.messageQueue = [];
    
    // Try to send each message
    for (const message of queue) {
      try {
        if (this.isConnected()) {
          this.socket.send(JSON.stringify(message));
          logger.debug('Queued WebSocket message sent', { 
            type: message.type, 
            id: message.id 
          });
        } else {
          // If disconnected while processing, put it back in the queue
          this.queueMessage(message);
        }
      } catch (error) {
        logger.error('Error sending queued WebSocket message', {
          error: error instanceof Error ? error.message : String(error),
          type: message.type,
          id: message.id
        });
        this.queueMessage(message);
      }
    }
  }
}

// Export a singleton instance
export const websocketClient = new WebSocketClient(); 
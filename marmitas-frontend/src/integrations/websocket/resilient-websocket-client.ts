import { logger } from '../../utils/logger';
import { RetryStrategy } from '../resilience/retry';
import { EventEmitter } from './event-emitter';

/**
 * WebSocket connection states
 */
export enum WebSocketConnectionState {
  CONNECTING = 'connecting',
  OPEN = 'open',
  CLOSING = 'closing',
  CLOSED = 'closed',
  RECONNECTING = 'reconnecting',
  FAILED = 'failed',
}

/**
 * WebSocket event types
 */
export enum WebSocketEventType {
  OPEN = 'open',
  MESSAGE = 'message',
  ERROR = 'error',
  CLOSE = 'close',
  STATE_CHANGE = 'stateChange',
  RECONNECT_ATTEMPT = 'reconnectAttempt',
  RECONNECTED = 'reconnected',
  MAX_RECONNECT_ATTEMPTS_EXCEEDED = 'maxReconnectAttemptsExceeded',
}

/**
 * WebSocket events
 */
export type WebSocketEvent = {
  type: WebSocketEventType;
  timestamp: number;
  payload?: any;
};

/**
 * Configuration options for resilient WebSocket
 */
export interface ResilientWebSocketOptions {
  /**
   * URL of the WebSocket server
   */
  url: string;

  /**
   * WebSocket protocols to use
   */
  protocols?: string | string[];

  /**
   * Whether to automatically connect when created
   * @default true
   */
  autoConnect?: boolean;

  /**
   * Whether to automatically reconnect on connection loss
   * @default true
   */
  autoReconnect?: boolean;

  /**
   * Maximum number of reconnection attempts
   * @default Infinity
   */
  maxReconnectAttempts?: number;

  /**
   * Initial reconnection delay in milliseconds
   * @default 1000
   */
  initialReconnectDelay?: number;

  /**
   * Maximum reconnection delay in milliseconds
   * @default 30000
   */
  maxReconnectDelay?: number;

  /**
   * Reconnection strategy to use
   * @default ExponentialBackoff
   */
  reconnectStrategy?: RetryStrategy;

  /**
   * Heartbeat interval in milliseconds. If provided, enables heartbeat
   * @default undefined (no heartbeat)
   */
  heartbeatIntervalMs?: number;

  /**
   * Heartbeat timeout in milliseconds
   * @default 10000
   */
  heartbeatTimeoutMs?: number;

  /**
   * Headers to include in the WebSocket connection request
   */
  headers?: Record<string, string>;
}

/**
 * Default options for resilient WebSocket
 */
const DEFAULT_OPTIONS: ResilientWebSocketOptions = {
  url: '',
  autoConnect: true,
  autoReconnect: true,
  maxReconnectAttempts: Infinity,
  initialReconnectDelay: 1000,
  maxReconnectDelay: 30000,
  reconnectStrategy: new RetryStrategy.ExponentialBackoff(),
  heartbeatTimeoutMs: 10000,
};

/**
 * A resilient WebSocket client implementation with automatic reconnection,
 * heartbeat/ping support, and event handling.
 */
export class ResilientWebSocketClient extends EventEmitter<WebSocketEventType, WebSocketEvent> {
  private options: ResilientWebSocketOptions;
  private ws: WebSocket | null = null;
  private state: WebSocketConnectionState = WebSocketConnectionState.CLOSED;
  private reconnectAttempts = 0;
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private heartbeatTimeoutTimer: number | null = null;
  private manualClose = false;
  private lastMessageTime = 0;

  /**
   * Create a new resilient WebSocket client
   * @param options Configuration options
   */
  constructor(options: ResilientWebSocketOptions) {
    super();
    this.options = { ...DEFAULT_OPTIONS, ...options };

    if (this.options.autoConnect) {
      this.connect();
    }
  }

  /**
   * Connect to the WebSocket server
   */
  public connect(): void {
    if (this.ws && (this.state === WebSocketConnectionState.CONNECTING || this.state === WebSocketConnectionState.OPEN)) {
      logger.debug('WebSocket already connected or connecting');
      return;
    }

    this.manualClose = false;
    this.setState(WebSocketConnectionState.CONNECTING);

    try {
      this.ws = new WebSocket(this.options.url, this.options.protocols);
      this.attachEventListeners();
    } catch (error) {
      logger.error('Failed to create WebSocket', {
        url: this.options.url,
        error: error instanceof Error ? error.message : String(error),
      });
      this.setState(WebSocketConnectionState.FAILED);
      this.handleConnectionFailure();
    }
  }

  /**
   * Close the WebSocket connection
   * @param code Close code
   * @param reason Reason for closing
   */
  public close(code?: number, reason?: string): void {
    this.manualClose = true;
    this.clearTimers();

    if (this.ws && this.state !== WebSocketConnectionState.CLOSED && this.state !== WebSocketConnectionState.CLOSING) {
      this.setState(WebSocketConnectionState.CLOSING);
      try {
        this.ws.close(code, reason);
      } catch (error) {
        logger.error('Error closing WebSocket', {
          error: error instanceof Error ? error.message : String(error),
        });
        this.setState(WebSocketConnectionState.CLOSED);
      }
    } else {
      this.setState(WebSocketConnectionState.CLOSED);
    }
  }

  /**
   * Send data over the WebSocket connection
   * @param data Data to send
   * @returns True if data was sent, false otherwise
   */
  public send(data: string | ArrayBufferLike | Blob | ArrayBufferView): boolean {
    if (!this.ws || this.state !== WebSocketConnectionState.OPEN) {
      logger.warn('Cannot send message, WebSocket is not open', { state: this.state });
      return false;
    }

    try {
      this.ws.send(data);
      return true;
    } catch (error) {
      logger.error('Error sending WebSocket message', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Get the current connection state
   */
  public getState(): WebSocketConnectionState {
    return this.state;
  }

  /**
   * Check if the connection is open
   */
  public isOpen(): boolean {
    return this.state === WebSocketConnectionState.OPEN;
  }

  /**
   * Check if the connection is closed
   */
  public isClosed(): boolean {
    return this.state === WebSocketConnectionState.CLOSED || this.state === WebSocketConnectionState.FAILED;
  }

  /**
   * Send a ping/heartbeat message
   * @param data Optional data to include in the ping
   */
  public ping(data?: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    if (this.ws && this.state === WebSocketConnectionState.OPEN) {
      if (data) {
        this.send(data);
      } else {
        // Send an empty ping
        this.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      }
    }
  }

  /**
   * Reset the reconnection counter
   */
  public resetReconnectAttempts(): void {
    this.reconnectAttempts = 0;
  }

  /**
   * Update the WebSocket options
   * @param options New options to merge with existing ones
   */
  public updateOptions(options: Partial<ResilientWebSocketOptions>): void {
    const wasHeartbeatEnabled = !!this.options.heartbeatIntervalMs;
    const oldUrl = this.options.url;

    this.options = { ...this.options, ...options };
    
    // Restart heartbeat if interval changed
    if (this.options.heartbeatIntervalMs !== undefined && 
        (this.options.heartbeatIntervalMs !== this.options.heartbeatIntervalMs || !wasHeartbeatEnabled)) {
      this.resetHeartbeat();
    }

    // Reconnect if URL changed
    if (options.url && options.url !== oldUrl && this.state === WebSocketConnectionState.OPEN) {
      logger.debug('WebSocket URL changed, reconnecting', { 
        oldUrl, 
        newUrl: options.url 
      });
      this.close();
      this.connect();
    }
  }

  /**
   * Set the connection state and emit a state change event
   */
  private setState(state: WebSocketConnectionState): void {
    const oldState = this.state;
    this.state = state;

    if (oldState !== state) {
      logger.debug(`WebSocket state changed from ${oldState} to ${state}`);
      this.emit(WebSocketEventType.STATE_CHANGE, {
        type: WebSocketEventType.STATE_CHANGE,
        timestamp: Date.now(),
        payload: { oldState, newState: state },
      });
    }
  }

  /**
   * Attach event listeners to the WebSocket
   */
  private attachEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = this.handleOpen.bind(this);
    this.ws.onmessage = this.handleMessage.bind(this);
    this.ws.onerror = this.handleError.bind(this);
    this.ws.onclose = this.handleClose.bind(this);
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(event: Event): void {
    this.setState(WebSocketConnectionState.OPEN);
    this.resetReconnectAttempts();
    this.startHeartbeat();

    this.emit(WebSocketEventType.OPEN, {
      type: WebSocketEventType.OPEN,
      timestamp: Date.now(),
      payload: event,
    });

    if (this.reconnectAttempts > 0) {
      this.emit(WebSocketEventType.RECONNECTED, {
        type: WebSocketEventType.RECONNECTED,
        timestamp: Date.now(),
        payload: { reconnectAttempts: this.reconnectAttempts },
      });
    }
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    this.lastMessageTime = Date.now();
    
    // Reset heartbeat timeout since we received data
    if (this.heartbeatTimeoutTimer !== null) {
      window.clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }

    // If message is a pong, don't emit the message event
    let data = event.data;
    try {
      if (typeof data === 'string') {
        const parsed = JSON.parse(data);
        if (parsed && parsed.type === 'pong') {
          logger.debug('Received pong message');
          return;
        }
      }
    } catch (e) {
      // Not JSON or not a pong message, continue processing
    }

    this.emit(WebSocketEventType.MESSAGE, {
      type: WebSocketEventType.MESSAGE,
      timestamp: this.lastMessageTime,
      payload: event,
    });
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    logger.error('WebSocket error', { event });

    this.emit(WebSocketEventType.ERROR, {
      type: WebSocketEventType.ERROR,
      timestamp: Date.now(),
      payload: event,
    });
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    this.setState(WebSocketConnectionState.CLOSED);
    this.clearTimers();

    this.emit(WebSocketEventType.CLOSE, {
      type: WebSocketEventType.CLOSE,
      timestamp: Date.now(),
      payload: event,
    });

    // Don't reconnect if the close was manual
    if (!this.manualClose && this.options.autoReconnect) {
      this.handleConnectionFailure();
    }
  }

  /**
   * Handle connection failure and attempt reconnection
   */
  private handleConnectionFailure(): void {
    if (!this.options.autoReconnect || this.manualClose) {
      return;
    }

    // Check if we've reached the maximum reconnection attempts
    if (this.options.maxReconnectAttempts !== Infinity && 
        this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      logger.warn('Maximum WebSocket reconnection attempts exceeded', {
        attempts: this.reconnectAttempts,
        max: this.options.maxReconnectAttempts,
      });

      this.setState(WebSocketConnectionState.FAILED);
      this.emit(WebSocketEventType.MAX_RECONNECT_ATTEMPTS_EXCEEDED, {
        type: WebSocketEventType.MAX_RECONNECT_ATTEMPTS_EXCEEDED,
        timestamp: Date.now(),
        payload: { attempts: this.reconnectAttempts },
      });
      return;
    }

    this.reconnectAttempts++;
    this.setState(WebSocketConnectionState.RECONNECTING);

    // Calculate reconnection delay using the strategy
    let delay: number;
    if (this.options.reconnectStrategy) {
      delay = this.options.reconnectStrategy.getDelay(this.reconnectAttempts);
      delay = Math.min(delay, this.options.maxReconnectDelay || DEFAULT_OPTIONS.maxReconnectDelay);
    } else {
      delay = this.options.initialReconnectDelay || DEFAULT_OPTIONS.initialReconnectDelay;
    }

    logger.info('Attempting WebSocket reconnection', {
      attempt: this.reconnectAttempts,
      delay,
      maxAttempts: this.options.maxReconnectAttempts,
    });

    this.emit(WebSocketEventType.RECONNECT_ATTEMPT, {
      type: WebSocketEventType.RECONNECT_ATTEMPT,
      timestamp: Date.now(),
      payload: { attempt: this.reconnectAttempts, delay },
    });

    // Schedule reconnection
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  /**
   * Start the heartbeat mechanism
   */
  private startHeartbeat(): void {
    this.clearHeartbeatTimers();

    if (this.options.heartbeatIntervalMs && this.options.heartbeatIntervalMs > 0) {
      this.heartbeatTimer = window.setInterval(() => {
        this.sendHeartbeat();
      }, this.options.heartbeatIntervalMs);
    }
  }

  /**
   * Send a heartbeat message and start a timeout timer for response
   */
  private sendHeartbeat(): void {
    if (this.state !== WebSocketConnectionState.OPEN) {
      return;
    }

    // Send ping
    this.ping();

    // Start timeout timer to detect unresponsive connection
    this.heartbeatTimeoutTimer = window.setTimeout(() => {
      logger.warn('WebSocket heartbeat timeout, connection might be dead');
      this.handleHeartbeatTimeout();
    }, this.options.heartbeatTimeoutMs);
  }

  /**
   * Handle heartbeat timeout by closing and reconnecting
   */
  private handleHeartbeatTimeout(): void {
    logger.warn('WebSocket heartbeat timeout, reconnecting');

    // Clear the heartbeat timeout timer
    if (this.heartbeatTimeoutTimer !== null) {
      window.clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }

    // Force close and reconnect
    if (this.ws) {
      // Prevent the normal close handler from running
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }

    this.setState(WebSocketConnectionState.CLOSED);
    this.handleConnectionFailure();
  }

  /**
   * Reset heartbeat timers
   */
  private resetHeartbeat(): void {
    this.clearHeartbeatTimers();
    if (this.state === WebSocketConnectionState.OPEN) {
      this.startHeartbeat();
    }
  }

  /**
   * Clear heartbeat timers
   */
  private clearHeartbeatTimers(): void {
    if (this.heartbeatTimer !== null) {
      window.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.heartbeatTimeoutTimer !== null) {
      window.clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    this.clearHeartbeatTimers();

    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
} 
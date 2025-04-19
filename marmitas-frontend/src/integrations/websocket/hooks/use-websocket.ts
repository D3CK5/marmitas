import { useCallback, useEffect, useRef, useState } from 'react';
import { 
  ResilientWebSocketClient, 
  ResilientWebSocketOptions,
  WebSocketConnectionState, 
  WebSocketEventType 
} from '../resilient-websocket-client';

export interface UseWebSocketOptions extends Partial<ResilientWebSocketOptions> {
  /**
   * The WebSocket URL to connect to
   */
  url: string;
  
  /**
   * Whether to automatically connect when the component mounts
   * @default true
   */
  autoConnect?: boolean;
  
  /**
   * Whether to automatically reconnect when the connection is lost
   * @default true
   */
  autoReconnect?: boolean;
}

export interface UseWebSocketResult {
  /**
   * The current connection state
   */
  connectionState: WebSocketConnectionState;
  
  /**
   * The last error that occurred, if any
   */
  error: Error | null;
  
  /**
   * Connect to the WebSocket server
   */
  connect: () => void;
  
  /**
   * Disconnect from the WebSocket server
   */
  disconnect: () => void;
  
  /**
   * Send data to the WebSocket server
   * @param data The data to send
   */
  send: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => void;
  
  /**
   * Get the underlying ResilientWebSocketClient instance
   */
  client: ResilientWebSocketClient | null;
}

/**
 * React hook for using a resilient WebSocket connection
 * 
 * @param options The WebSocket options
 * @returns UseWebSocketResult
 */
export function useWebSocket(options: UseWebSocketOptions): UseWebSocketResult {
  const { url, autoConnect = true, ...clientOptions } = options;
  
  const clientRef = useRef<ResilientWebSocketClient | null>(null);
  const [connectionState, setConnectionState] = useState<WebSocketConnectionState>(
    WebSocketConnectionState.CLOSED
  );
  const [error, setError] = useState<Error | null>(null);

  // Initialize the client
  useEffect(() => {
    const client = new ResilientWebSocketClient({
      url,
      autoConnect: false, // We'll handle connection manually
      ...clientOptions,
    });

    // Set up event listeners
    const stateChangeUnsubscribe = client.on(WebSocketEventType.STATE_CHANGE, (event) => {
      setConnectionState(event.state);
    });

    const errorUnsubscribe = client.on(WebSocketEventType.ERROR, (event) => {
      setError(event.error);
    });

    // Store the client
    clientRef.current = client;

    // Connect if autoConnect is true
    if (autoConnect) {
      client.connect();
    }

    // Cleanup function
    return () => {
      stateChangeUnsubscribe();
      errorUnsubscribe();
      client.close();
      clientRef.current = null;
    };
  }, [url, JSON.stringify(clientOptions), autoConnect]);

  const connect = useCallback(() => {
    clientRef.current?.connect();
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.close();
  }, []);

  const send = useCallback((data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
    clientRef.current?.send(data);
  }, []);

  return {
    connectionState,
    error,
    connect,
    disconnect,
    send,
    client: clientRef.current,
  };
} 
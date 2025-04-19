import { useEffect, useRef } from 'react';
import { UseWebSocketResult } from './use-websocket';
import { WebSocketEventType } from '../resilient-websocket-client';

/**
 * React hook for subscribing to WebSocket events
 * 
 * @param websocket The WebSocket instance returned from useWebSocket
 * @param eventType The event type to subscribe to
 * @param handler The event handler
 */
export function useWebSocketEvent<T>(
  websocket: UseWebSocketResult,
  eventType: WebSocketEventType,
  handler: (event: T) => void
): void {
  const handlerRef = useRef(handler);
  
  // Update the handler ref when the handler changes
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);
  
  useEffect(() => {
    if (!websocket.client) {
      return;
    }
    
    // Create a wrapper that always calls the current handler
    const handlerWrapper = (event: T) => {
      handlerRef.current(event);
    };
    
    // Subscribe to the event
    const unsubscribe = websocket.client.on(eventType, handlerWrapper);
    
    // Unsubscribe when the component unmounts or the client changes
    return () => {
      unsubscribe();
    };
  }, [websocket.client, eventType]);
}

/**
 * React hook for subscribing to WebSocket message events
 * 
 * @param websocket The WebSocket instance returned from useWebSocket
 * @param handler The event handler
 */
export function useWebSocketMessage(
  websocket: UseWebSocketResult,
  handler: (data: string | ArrayBuffer) => void
): void {
  useWebSocketEvent(
    websocket, 
    WebSocketEventType.MESSAGE, 
    (event: { data: string | ArrayBuffer }) => handler(event.data)
  );
}

/**
 * React hook for subscribing to WebSocket connection events
 * 
 * @param websocket The WebSocket instance returned from useWebSocket
 * @param handler The event handler
 */
export function useWebSocketConnect(
  websocket: UseWebSocketResult,
  handler: () => void
): void {
  useWebSocketEvent(
    websocket,
    WebSocketEventType.CONNECT,
    handler
  );
}

/**
 * React hook for subscribing to WebSocket disconnection events
 * 
 * @param websocket The WebSocket instance returned from useWebSocket
 * @param handler The event handler
 */
export function useWebSocketDisconnect(
  websocket: UseWebSocketResult,
  handler: (event: { code: number; reason: string }) => void
): void {
  useWebSocketEvent(
    websocket,
    WebSocketEventType.DISCONNECT,
    handler
  );
}

/**
 * React hook for subscribing to WebSocket error events
 * 
 * @param websocket The WebSocket instance returned from useWebSocket
 * @param handler The event handler
 */
export function useWebSocketError(
  websocket: UseWebSocketResult,
  handler: (event: { error: Error }) => void
): void {
  useWebSocketEvent(
    websocket,
    WebSocketEventType.ERROR,
    handler
  );
} 
import { useEffect, useState, useRef, useCallback } from 'react';
import { websocketClient, WebSocketConnectionState } from './websocket-client';
import { 
  websocketSubscription, 
  SubscriptionOptions, 
  SubscriptionEvent, 
  SubscriptionEventType,
  SubscriptionState
} from './websocket-subscription';
import { logger } from '../../utils/logger';

/**
 * Hook to manage WebSocket connection
 * @returns WebSocket connection state and control functions
 */
export function useWebSocketConnection(): {
  connectionState: WebSocketConnectionState;
  connect: () => void;
  disconnect: () => void;
  isConnected: boolean;
} {
  const [connectionState, setConnectionState] = useState<WebSocketConnectionState>(
    websocketClient.getState()
  );
  
  useEffect(() => {
    // Add state listener
    const handleStateChange = (state: WebSocketConnectionState) => {
      setConnectionState(state);
    };
    
    websocketClient.addStateListener(handleStateChange);
    
    // Initial connection if not already connected
    if (connectionState === WebSocketConnectionState.DISCONNECTED) {
      websocketClient.connect();
    }
    
    // Clean up on unmount
    return () => {
      websocketClient.removeStateListener(handleStateChange);
    };
  }, [connectionState]);
  
  const connect = useCallback(() => {
    websocketClient.connect();
  }, []);
  
  const disconnect = useCallback(() => {
    websocketClient.disconnect();
  }, []);
  
  const isConnected = connectionState === WebSocketConnectionState.CONNECTED;
  
  return { connectionState, connect, disconnect, isConnected };
}

/**
 * Hook to subscribe to WebSocket events
 * @param options Subscription options
 * @returns Subscription state and latest event
 */
export function useWebSocketSubscription<T = any>(options: SubscriptionOptions): {
  subscriptionState: SubscriptionState;
  lastEvent: SubscriptionEvent | null;
  eventData: T | null;
  isLoading: boolean;
  error: Error | null;
} {
  const [subscriptionState, setSubscriptionState] = useState<SubscriptionState>(SubscriptionState.INACTIVE);
  const [lastEvent, setLastEvent] = useState<SubscriptionEvent | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const subscriptionIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Reset state when options change
    setSubscriptionState(SubscriptionState.PENDING);
    setLastEvent(null);
    setError(null);
    
    // Handler for subscription events
    const handleEvent = (event: SubscriptionEvent) => {
      setLastEvent(event);
      setSubscriptionState(SubscriptionState.ACTIVE);
    };
    
    try {
      // Create subscription
      const subscriptionId = websocketSubscription.subscribe(options, handleEvent);
      subscriptionIdRef.current = subscriptionId;
      setSubscriptionState(SubscriptionState.ACTIVE);
      
      logger.debug('Created subscription in hook', {
        subscriptionId,
        entityType: options.entityType,
        entityId: options.entityId
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setSubscriptionState(SubscriptionState.ERROR);
      
      logger.error('Error creating subscription in hook', {
        error: err instanceof Error ? err.message : String(err),
        entityType: options.entityType,
        entityId: options.entityId
      });
    }
    
    // Clean up on unmount or when options change
    return () => {
      if (subscriptionIdRef.current) {
        websocketSubscription.unsubscribe(subscriptionIdRef.current);
        subscriptionIdRef.current = null;
      }
    };
  }, [options.entityType, options.entityId, JSON.stringify(options.eventTypes), JSON.stringify(options.filters)]);
  
  // Extract data from the last event
  const eventData = lastEvent?.data as T || null;
  const isLoading = subscriptionState === SubscriptionState.PENDING;
  
  return { subscriptionState, lastEvent, eventData, isLoading, error };
}

/**
 * Hook to subscribe to real-time entity updates
 * @param entityType Entity type to subscribe to
 * @param entityId Optional entity ID
 * @param initialData Optional initial data
 * @returns Real-time entity data and loading state
 */
export function useEntitySubscription<T = any>(
  entityType: string,
  entityId?: string,
  initialData?: T
): {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  lastEvent: SubscriptionEvent | null;
} {
  const [data, setData] = useState<T | null>(initialData || null);
  
  // Subscribe to entity events
  const { subscriptionState, lastEvent, eventData, isLoading, error } = 
    useWebSocketSubscription<T>({
      entityType,
      entityId,
      eventTypes: [SubscriptionEventType.CREATED, SubscriptionEventType.UPDATED]
    });
  
  // Update data when events are received
  useEffect(() => {
    if (lastEvent && eventData) {
      setData(eventData);
    }
  }, [lastEvent, eventData]);
  
  return { data, isLoading, error, lastEvent };
}

/**
 * Hook to subscribe to real-time entity collection updates
 * @param entityType Entity type to subscribe to
 * @param initialItems Optional initial items
 * @param keyField Field to use as key (default: 'id')
 * @returns Real-time collection data and loading state
 */
export function useCollectionSubscription<T = any>(
  entityType: string,
  initialItems: T[] = [],
  keyField: keyof T = 'id' as keyof T
): {
  items: T[];
  isLoading: boolean;
  error: Error | null;
  lastEvent: SubscriptionEvent | null;
} {
  const [items, setItems] = useState<T[]>(initialItems);
  
  // Subscribe to entity events
  const { subscriptionState, lastEvent, eventData, isLoading, error } = 
    useWebSocketSubscription<T>({
      entityType,
      eventTypes: [
        SubscriptionEventType.CREATED, 
        SubscriptionEventType.UPDATED, 
        SubscriptionEventType.DELETED
      ]
    });
  
  // Update collection when events are received
  useEffect(() => {
    if (!lastEvent || !eventData) return;
    
    const eventType = lastEvent.eventType;
    const entityId = lastEvent.entityId;
    
    switch (eventType) {
      case SubscriptionEventType.CREATED:
        // Add new item
        setItems(prevItems => [...prevItems, eventData]);
        break;
        
      case SubscriptionEventType.UPDATED:
        // Update existing item
        setItems(prevItems => 
          prevItems.map(item => 
            (item[keyField] === eventData[keyField]) ? eventData : item
          )
        );
        break;
        
      case SubscriptionEventType.DELETED:
        // Remove deleted item
        setItems(prevItems => 
          prevItems.filter(item => item[keyField] !== eventData[keyField])
        );
        break;
    }
  }, [lastEvent, eventData, keyField]);
  
  return { items, isLoading, error, lastEvent };
}

/**
 * Hook to use the WebSocket connection status
 * @returns WebSocket connection status
 */
export function useWebSocketStatus(): {
  isConnected: boolean;
  connectionState: WebSocketConnectionState;
  reconnect: () => void;
} {
  const { connectionState, connect, isConnected } = useWebSocketConnection();
  
  const reconnect = useCallback(() => {
    websocketClient.disconnect();
    setTimeout(() => {
      connect();
    }, 100);
  }, [connect]);
  
  return { isConnected, connectionState, reconnect };
} 
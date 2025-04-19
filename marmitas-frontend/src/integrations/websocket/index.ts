import { websocketClient, WebSocketConnectionState, WebSocketMessageType } from './websocket-client';
import { 
  websocketSubscription, 
  SubscriptionOptions, 
  SubscriptionEvent, 
  SubscriptionEventType,
  SubscriptionState
} from './websocket-subscription';
import {
  useWebSocketConnection,
  useWebSocketStatus,
  useWebSocketSubscription,
  useEntitySubscription,
  useCollectionSubscription
} from './websocket-hooks';
import { logger } from '../../utils/logger';
import { getAuthToken } from '../../utils/auth';

/**
 * Initialize the WebSocket integration
 * @param options Optional initialization options
 */
export function initializeWebSockets(options?: {
  autoConnect?: boolean;
  authToken?: string;
}) {
  // Get auth token from auth utility or options
  const authToken = options?.authToken || getAuthToken();
  
  // Initialize WebSocket client
  websocketClient.initialize({
    authToken,
    reconnectInterval: 1000,
    maxReconnectAttempts: 10,
    pingInterval: 30000
  });
  
  // Initialize subscription service
  websocketSubscription.initialize();
  
  logger.info('WebSocket integration initialized');
  
  // Connect if auto-connect is enabled (default: true)
  if (options?.autoConnect !== false) {
    websocketClient.connect();
  }
}

// Export all WebSocket components
export {
  // Client
  websocketClient,
  WebSocketConnectionState,
  WebSocketMessageType,
  
  // Subscription
  websocketSubscription,
  SubscriptionOptions,
  SubscriptionEvent,
  SubscriptionEventType,
  SubscriptionState,
  
  // Hooks
  useWebSocketConnection,
  useWebSocketStatus,
  useWebSocketSubscription,
  useEntitySubscription,
  useCollectionSubscription
}; 
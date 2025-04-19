# WebSocket Integration

This module provides WebSocket client integration for real-time updates in the Marmitas frontend application.

## Components

1. **WebSocket Client** - Core WebSocket connection handling and messaging
2. **Subscription API** - Manages entity-based subscriptions
3. **React Hooks** - Integration with React components for state management
4. **Automatic Reconnection** - Handles network issues with exponential backoff

## Setup

Initialize the WebSocket integration in your application entry point:

```tsx
// In your App.tsx or index.tsx
import { initializeWebSockets } from './integrations/websocket';

// Initialize with default options
initializeWebSockets();

// Or with custom options
initializeWebSockets({
  autoConnect: true,
  authToken: 'your-auth-token' // Optional, will use auth utility by default
});
```

## Usage Examples

### Connection Status

```tsx
import { useWebSocketStatus } from './integrations/websocket';

function ConnectionStatus() {
  const { isConnected, connectionState, reconnect } = useWebSocketStatus();
  
  return (
    <div>
      <div>Connection Status: {connectionState}</div>
      {!isConnected && (
        <button onClick={reconnect}>Reconnect</button>
      )}
    </div>
  );
}
```

### Entity Subscription

```tsx
import { useEntitySubscription } from './integrations/websocket';

// For a single entity (e.g., order details)
function OrderDetails({ orderId }) {
  const { data, isLoading, error } = useEntitySubscription('orders', orderId);
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No data</div>;
  
  return (
    <div>
      <h2>Order #{data.id}</h2>
      <p>Status: {data.status}</p>
      <p>Total: ${data.total}</p>
      {/* More order details */}
    </div>
  );
}
```

### Collection Subscription

```tsx
import { useCollectionSubscription } from './integrations/websocket';

// For a collection of entities (e.g., orders list)
function OrdersList() {
  const { items, isLoading, error } = useCollectionSubscription('orders');
  
  if (isLoading && items.length === 0) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h2>Orders</h2>
      {items.length === 0 ? (
        <p>No orders</p>
      ) : (
        <ul>
          {items.map(order => (
            <li key={order.id}>
              Order #{order.id} - {order.status} - ${order.total}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Custom Subscription

```tsx
import { useWebSocketSubscription, SubscriptionEventType } from './integrations/websocket';

// For custom subscription options
function CustomSubscription() {
  const { lastEvent, eventData, isLoading, error } = useWebSocketSubscription({
    entityType: 'orders',
    eventTypes: [SubscriptionEventType.CREATED, SubscriptionEventType.UPDATED],
    filters: { status: 'pending' }
  });
  
  // Handle events as they arrive
  return (
    <div>
      <h2>Latest Event</h2>
      {lastEvent ? (
        <div>
          <p>Entity: {lastEvent.entityType}</p>
          <p>Event: {lastEvent.eventType}</p>
          <p>Timestamp: {new Date(lastEvent.timestamp).toLocaleString()}</p>
          <pre>{JSON.stringify(eventData, null, 2)}</pre>
        </div>
      ) : (
        <p>No events received yet</p>
      )}
    </div>
  );
}
```

### Direct API Usage

```tsx
import { 
  websocketClient, 
  websocketSubscription,
  WebSocketMessageType,
  SubscriptionEventType
} from './integrations/websocket';

// Manual subscription
const subscriptionId = websocketSubscription.subscribe(
  {
    entityType: 'orders',
    entityId: '123',
    eventTypes: [SubscriptionEventType.UPDATED]
  },
  (event) => {
    console.log('Received event:', event);
    // Handle event
  }
);

// Later, unsubscribe
websocketSubscription.unsubscribe(subscriptionId);

// Send custom message
websocketClient.send(WebSocketMessageType.PING, { timestamp: Date.now() });

// Get subscription stats
const stats = websocketSubscription.getStats();
console.log('Active subscriptions:', stats);
```

## Additional Notes

- Subscriptions are automatically managed by the hooks and cleaned up when components unmount
- Connection issues are handled automatically with exponential backoff
- Messages are queued when disconnected and sent when reconnected
- Auth token is automatically sent when connection is established 
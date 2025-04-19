import WebSocket from 'ws';
import { config } from '../../src/config/app.config.js';
import { v4 as uuidv4 } from 'uuid';

describe('WebSocket Subscription System', () => {
  const baseUrl = `ws://localhost:${config.app.port}${config.websocket?.path || '/ws'}`;
  let ws1: WebSocket;
  let ws2: WebSocket;
  
  beforeEach((done) => {
    // Create new WebSocket connections for each test
    let connectionsReady = 0;
    
    const connectionReady = () => {
      connectionsReady++;
      if (connectionsReady === 2) {
        done();
      }
    };
    
    ws1 = new WebSocket(baseUrl);
    ws1.on('open', connectionReady);
    ws1.on('error', done);
    
    ws2 = new WebSocket(baseUrl);
    ws2.on('open', connectionReady);
    ws2.on('error', done);
  });
  
  afterEach((done) => {
    // Close the WebSocket connections after each test
    let connectionsClosed = 0;
    
    const connectionClosed = () => {
      connectionsClosed++;
      if (connectionsClosed === 2) {
        done();
      }
    };
    
    if (ws1.readyState === WebSocket.OPEN) {
      ws1.on('close', connectionClosed);
      ws1.close();
    } else {
      connectionClosed();
    }
    
    if (ws2.readyState === WebSocket.OPEN) {
      ws2.on('close', connectionClosed);
      ws2.close();
    } else {
      connectionClosed();
    }
  });
  
  /**
   * Helper function to send a message and get a response
   */
  const sendAndReceive = (ws: WebSocket, message: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      // Generate a unique message ID for this request
      const messageId = uuidv4();
      const messageWithId = { ...message, messageId };
      
      // Set up a one-time message handler for the response
      const messageHandler = (data: WebSocket.Data) => {
        try {
          const response = JSON.parse(data.toString());
          
          // If the response has the same message ID, resolve the promise
          if (response.messageId === messageId) {
            ws.removeEventListener('message', messageHandler);
            resolve(response);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      // Listen for messages
      ws.addEventListener('message', messageHandler);
      
      // Send the message
      ws.send(JSON.stringify(messageWithId));
      
      // Set a timeout to reject the promise if no response is received
      setTimeout(() => {
        ws.removeEventListener('message', messageHandler);
        reject(new Error('WebSocket response timeout'));
      }, 5000);
    });
  };
  
  /**
   * Helper function to wait for the initial connection message
   */
  const waitForConnectionId = (ws: WebSocket): Promise<string> => {
    return new Promise((resolve, reject) => {
      const messageHandler = (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'connection') {
            ws.removeEventListener('message', messageHandler);
            resolve(message.connectionId);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      ws.addEventListener('message', messageHandler);
      
      // Set a timeout to reject the promise if no connection message is received
      setTimeout(() => {
        ws.removeEventListener('message', messageHandler);
        reject(new Error('Connection message timeout'));
      }, 5000);
    });
  };
  
  /**
   * Helper function to collect events for a specific time period
   */
  const collectEvents = (ws: WebSocket, timeoutMs: number = 1000): Promise<any[]> => {
    return new Promise((resolve) => {
      const events: any[] = [];
      
      const messageHandler = (data: WebSocket.Data) => {
        try {
          const event = JSON.parse(data.toString());
          if (event.type === 'event') {
            events.push(event);
          }
        } catch (error) {
          // Ignore parsing errors
        }
      };
      
      ws.addEventListener('message', messageHandler);
      
      // Resolve after the timeout with all collected events
      setTimeout(() => {
        ws.removeEventListener('message', messageHandler);
        resolve(events);
      }, timeoutMs);
    });
  };
  
  it('should allow subscribing to an entity type', async () => {
    // Wait for connections to be established
    await Promise.all([waitForConnectionId(ws1), waitForConnectionId(ws2)]);
    
    // Subscribe to products entity
    const response = await sendAndReceive(ws1, {
      type: 'subscribe',
      entityType: 'products'
    });
    
    expect(response.type).toBe('subscription_response');
    expect(response.success).toBe(true);
    expect(response.subscription.entityType).toBe('products');
  });
  
  it('should allow subscribing to a specific entity', async () => {
    // Wait for connections to be established
    await Promise.all([waitForConnectionId(ws1), waitForConnectionId(ws2)]);
    
    // Subscribe to a specific product
    const productId = 'test-product-123';
    const response = await sendAndReceive(ws1, {
      type: 'subscribe',
      entityType: 'products',
      entityId: productId
    });
    
    expect(response.type).toBe('subscription_response');
    expect(response.success).toBe(true);
    expect(response.subscription.entityType).toBe('products');
    expect(response.subscription.entityId).toBe(productId);
  });
  
  it('should reject subscriptions to invalid entity types', async () => {
    // Wait for connections to be established
    await Promise.all([waitForConnectionId(ws1), waitForConnectionId(ws2)]);
    
    // Try to subscribe to an invalid entity type
    const response = await sendAndReceive(ws1, {
      type: 'subscribe',
      entityType: 'invalid-entity-type'
    });
    
    expect(response.type).toBe('subscription_response');
    expect(response.success).toBe(false);
    expect(response.message).toContain('Invalid entity type');
    expect(response.supportedTypes).toBeDefined();
  });
  
  it('should allow unsubscribing from an entity type', async () => {
    // Wait for connections to be established
    await Promise.all([waitForConnectionId(ws1), waitForConnectionId(ws2)]);
    
    // First subscribe
    await sendAndReceive(ws1, {
      type: 'subscribe',
      entityType: 'products'
    });
    
    // Then unsubscribe
    const response = await sendAndReceive(ws1, {
      type: 'unsubscribe',
      entityType: 'products'
    });
    
    expect(response.type).toBe('unsubscription_response');
    expect(response.success).toBe(true);
    expect(response.subscription.entityType).toBe('products');
  });
  
  it('should allow unsubscribing from all subscriptions', async () => {
    // Wait for connections to be established
    await Promise.all([waitForConnectionId(ws1), waitForConnectionId(ws2)]);
    
    // Subscribe to multiple entity types
    await sendAndReceive(ws1, {
      type: 'subscribe',
      entityType: 'products'
    });
    
    await sendAndReceive(ws1, {
      type: 'subscribe',
      entityType: 'orders'
    });
    
    // Unsubscribe from all
    const response = await sendAndReceive(ws1, {
      type: 'unsubscribe',
      all: true
    });
    
    expect(response.type).toBe('unsubscription_response');
    expect(response.success).toBe(true);
    expect(response.message).toContain('all');
  });
}); 
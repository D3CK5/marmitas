import WebSocket from 'ws';
import { config } from '../../src/config/app.config.js';
import { v4 as uuidv4 } from 'uuid';

describe('WebSocket Server', () => {
  const baseUrl = `ws://localhost:${config.app.port}${config.websocket?.path || '/ws'}`;
  let ws: WebSocket;
  let connectTimeout: NodeJS.Timeout;
  const maxRetries = 3;
  
  beforeEach((done) => {
    let retries = 0;
    
    const connectWithRetry = () => {
      // Clear any existing timeout
      if (connectTimeout) {
        clearTimeout(connectTimeout);
      }
      
      // Create a new WebSocket connection for each test
      ws = new WebSocket(baseUrl);
      
      // Set connection timeout
      connectTimeout = setTimeout(() => {
        if (retries < maxRetries) {
          retries++;
          console.log(`Connection attempt timed out, retrying (${retries}/${maxRetries})...`);
          ws.close();
          connectWithRetry();
        } else {
          done(new Error(`Failed to connect to WebSocket server after ${maxRetries} attempts`));
        }
      }, 3000);
      
      // Wait for the connection to be established
      ws.on('open', () => {
        clearTimeout(connectTimeout);
        done();
      });
      
      // Handle connection errors
      ws.on('error', (error) => {
        clearTimeout(connectTimeout);
        if (retries < maxRetries) {
          retries++;
          console.log(`WebSocket connection error: ${error.message}, retrying (${retries}/${maxRetries})...`);
          connectWithRetry();
        } else {
          console.error('WebSocket connection error:', error);
          done(error);
        }
      });
    };
    
    connectWithRetry();
  });
  
  afterEach((done) => {
    // Close the WebSocket connection after each test
    if (ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
    done();
  });
  
  /**
   * Helper function to send a message and get a response
   */
  const sendAndReceive = (message: any, timeoutMs = 5000): Promise<any> => {
    return new Promise((resolve, reject) => {
      // Check connection state
      if (ws.readyState !== WebSocket.OPEN) {
        return reject(new Error(`WebSocket connection not open, current state: ${ws.readyState}`));
      }
      
      // Generate a unique message ID for this request
      const messageId = uuidv4();
      const messageWithId = { ...message, messageId };
      
      // Track whether we've received a response
      let responseReceived = false;
      
      // Set up a one-time message handler for the response
      const messageHandler = (data: WebSocket.Data) => {
        try {
          const response = JSON.parse(data.toString());
          
          // If the response has the same message ID, resolve the promise
          if (response.messageId === messageId) {
            responseReceived = true;
            ws.removeEventListener('message', messageHandler);
            resolve(response);
          }
        } catch (error) {
          // Only reject if this is for our message
          if ((error as Error).message.includes(messageId)) {
            responseReceived = true;
            ws.removeEventListener('message', messageHandler);
            reject(error);
          }
        }
      };
      
      // Listen for messages
      ws.addEventListener('message', messageHandler);
      
      // Send the message
      try {
        ws.send(JSON.stringify(messageWithId));
      } catch (error) {
        ws.removeEventListener('message', messageHandler);
        return reject(new Error(`Failed to send WebSocket message: ${(error as Error).message}`));
      }
      
      // Set a timeout to reject the promise if no response is received
      const timeout = setTimeout(() => {
        if (!responseReceived) {
          ws.removeEventListener('message', messageHandler);
          reject(new Error(`WebSocket response timeout after ${timeoutMs}ms for message type: ${message.type}`));
        }
      }, timeoutMs);
      
      // Clear timeout if connection closes
      ws.addEventListener('close', () => {
        clearTimeout(timeout);
        if (!responseReceived) {
          ws.removeEventListener('message', messageHandler);
          reject(new Error('WebSocket connection closed before receiving response'));
        }
      }, { once: true });
    });
  };
  
  it('should receive a connection message when connected', (done) => {
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        expect(message.type).toBe('connection');
        expect(message.connectionId).toBeDefined();
        done();
      } catch (error) {
        done(error);
      }
    });
  });
  
  it('should respond to ping messages with pong', async () => {
    const response = await sendAndReceive({ type: 'ping' });
    expect(response.type).toBe('pong');
    expect(response.timestamp).toBeDefined();
  });
  
  it('should handle invalid JSON messages', (done) => {
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Skip connection message
        if (message.type === 'connection') {
          // Send invalid JSON
          ws.send('this is not valid JSON');
          return;
        }
        
        // Check for error response
        if (message.type === 'error') {
          expect(message.message).toBe('Invalid JSON message');
          done();
        }
      } catch (error) {
        done(error);
      }
    });
  });
  
  it('should handle unknown message types', async () => {
    const response = await sendAndReceive({ type: 'unknownType' });
    expect(response.type).toBe('error');
    expect(response.message).toBe('Unknown message type');
  });
  
  // This test is a placeholder for authentication tests that will be added
  // when the full authentication flow is implemented
  it('should handle authentication placeholder', async () => {
    const response = await sendAndReceive({ 
      type: 'authenticate',
      token: 'invalid-token'
    });
    
    expect(response.type).toBe('auth_response');
    // At this point, it may fail with 'not yet implemented' or more detailed errors
    // depending on the implementation stage
  });
}); 
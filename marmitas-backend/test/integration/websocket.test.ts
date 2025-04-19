import WebSocket from 'ws';
import { config } from '../../src/config/app.config.js';
import { v4 as uuidv4 } from 'uuid';

describe('WebSocket Server', () => {
  const baseUrl = `ws://localhost:${config.app.port}${config.websocket?.path || '/ws'}`;
  let ws: WebSocket;
  
  beforeEach((done) => {
    // Create a new WebSocket connection for each test
    ws = new WebSocket(baseUrl);
    
    // Wait for the connection to be established
    ws.on('open', () => {
      done();
    });
    
    // Handle connection errors
    ws.on('error', (error) => {
      console.error('WebSocket connection error:', error);
      done(error);
    });
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
  const sendAndReceive = (message: any): Promise<any> => {
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
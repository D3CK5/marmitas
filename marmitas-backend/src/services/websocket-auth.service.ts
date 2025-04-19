import { logger } from '../utils/logger.utils.js';
import { jwtService } from './jwt.service.js';
import { websocketService } from './websocket.service.js';
import { config } from '../config/app.config.js';

// Types
interface AuthenticationPayload {
  type: 'authenticate';
  token: string;
}

/**
 * WebSocket Authentication Service
 * Handles authentication of WebSocket connections
 */
class WebSocketAuthService {
  
  /**
   * Initialize the WebSocket authentication service
   */
  initialize(): void {
    // Set up the authentication handler in the websocket service
    this.setupAuthenticationHandler();
    
    logger.info('WebSocket authentication service initialized');
  }
  
  /**
   * Set up the authentication handler in the websocket service
   */
  private setupAuthenticationHandler(): void {
    // Override the placeholder handleAuthentication method in websocketService
    websocketService.handleAuthentication = this.handleAuthentication.bind(this);
  }
  
  /**
   * Handle authentication messages
   * @param connectionId The connection's unique ID
   * @param message The authentication message
   */
  async handleAuthentication(connectionId: string, message: AuthenticationPayload): Promise<void> {
    if (!message.token) {
      websocketService.sendToConnection(connectionId, {
        type: 'auth_response',
        success: false,
        message: 'No authentication token provided'
      });
      return;
    }
    
    try {
      // Verify the JWT token
      const decodedToken = await jwtService.verifyAccessToken(message.token);
      
      if (!decodedToken || !decodedToken.userId) {
        websocketService.sendToConnection(connectionId, {
          type: 'auth_response',
          success: false,
          message: 'Invalid authentication token'
        });
        return;
      }
      
      // Get the connection
      const connection = websocketService.getConnection(connectionId);
      if (!connection) {
        logger.error('Connection not found during authentication', { connectionId });
        return;
      }
      
      // Update the connection with authentication info
      connection.userId = decodedToken.userId;
      connection.isAuthenticated = true;
      
      logger.debug('WebSocket connection authenticated', { 
        connectionId,
        userId: decodedToken.userId
      });
      
      // Send successful authentication response
      websocketService.sendToConnection(connectionId, {
        type: 'auth_response',
        success: true,
        message: 'Authentication successful',
        userId: decodedToken.userId
      });
      
    } catch (error) {
      logger.error('WebSocket authentication error', {
        connectionId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      websocketService.sendToConnection(connectionId, {
        type: 'auth_response',
        success: false,
        message: 'Authentication failed',
        error: config.app.nodeEnv === 'development' ? 
          (error instanceof Error ? error.message : String(error)) : 
          'Internal server error'
      });
    }
  }
  
  /**
   * Check if a connection is authenticated
   * @param connectionId The connection ID to check
   */
  isConnectionAuthenticated(connectionId: string): boolean {
    const connection = websocketService.getConnection(connectionId);
    return connection?.isAuthenticated ?? false;
  }
  
  /**
   * Get the user ID associated with a connection
   * @param connectionId The connection ID to check
   */
  getConnectionUserId(connectionId: string): string | undefined {
    const connection = websocketService.getConnection(connectionId);
    return connection?.userId;
  }
}

// Export singleton instance
export const websocketAuthService = new WebSocketAuthService(); 
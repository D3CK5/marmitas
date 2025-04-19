import { logger } from '../utils/logger.utils.js';
import { websocketService, WebSocketConnection } from './websocket.service.js';
import { websocketAuthService } from './websocket-auth.service.js';
import { config } from '../config/app.config.js';

// Types for subscription messages
export interface SubscriptionPayload {
  type: 'subscribe';
  entityType: string;
  entityId?: string;  // Optional for subscribing to all entities of a type
  filter?: Record<string, any>; // Optional filter criteria
}

export interface UnsubscriptionPayload {
  type: 'unsubscribe';
  entityType: string;
  entityId?: string;
  all?: boolean; // Unsubscribe from all subscriptions if true
}

export interface SubscriptionKey {
  entityType: string;
  entityId?: string;
}

// Utility function to generate subscription key
export function generateSubscriptionKey(entityType: string, entityId?: string): string {
  return entityId ? `${entityType}:${entityId}` : entityType;
}

/**
 * WebSocket Subscription Service
 * Manages subscriptions to entity types and IDs
 */
class WebSocketSubscriptionService {
  // Map of subscription keys to connection IDs
  private subscriptions: Map<string, Set<string>> = new Map();
  
  // Map of connection IDs to subscription keys
  private connectionSubscriptions: Map<string, Set<string>> = new Map();
  
  // List of supported entity types
  private supportedEntityTypes: Set<string> = new Set([
    'products',
    'orders',
    'customers',
    'deliveries',
    'kitchens',
    'menus',
    'categories',
    'promotions',
    'reviews'
  ]);
  
  /**
   * Initialize the WebSocket subscription service
   */
  initialize(): void {
    // Set up subscription handlers in the websocket service
    this.setupSubscriptionHandlers();
    
    logger.info('WebSocket subscription service initialized', {
      supportedEntityTypes: Array.from(this.supportedEntityTypes)
    });
  }
  
  /**
   * Set up subscription handlers in the websocket service
   */
  private setupSubscriptionHandlers(): void {
    // Override the placeholder handleSubscription method in websocketService
    websocketService.handleSubscription = this.handleSubscription.bind(this);
    websocketService.handleUnsubscription = this.handleUnsubscription.bind(this);
  }
  
  /**
   * Handle subscription messages
   * @param connectionId The connection's unique ID
   * @param message The subscription message
   */
  handleSubscription(connectionId: string, message: SubscriptionPayload): void {
    const { entityType, entityId, filter } = message;
    
    // Validate entity type
    if (!this.isValidEntityType(entityType)) {
      websocketService.sendToConnection(connectionId, {
        type: 'subscription_response',
        success: false,
        message: `Invalid entity type: ${entityType}`,
        supportedTypes: Array.from(this.supportedEntityTypes)
      });
      return;
    }
    
    // Check authentication if required
    if (config.websocket?.requireAuthentication && !this.isAuthenticated(connectionId)) {
      websocketService.sendToConnection(connectionId, {
        type: 'subscription_response',
        success: false,
        message: 'Authentication required for subscriptions'
      });
      return;
    }
    
    // Generate subscription key
    const subscriptionKey = generateSubscriptionKey(entityType, entityId);
    
    try {
      // Add subscription
      this.addSubscription(connectionId, subscriptionKey);
      
      logger.debug('WebSocket subscription added', {
        connectionId,
        entityType,
        entityId,
        filter
      });
      
      // Send success response
      websocketService.sendToConnection(connectionId, {
        type: 'subscription_response',
        success: true,
        message: 'Subscription successful',
        subscription: {
          entityType,
          entityId,
          filter
        }
      });
    } catch (error) {
      logger.error('Error adding subscription', {
        connectionId,
        entityType,
        entityId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      websocketService.sendToConnection(connectionId, {
        type: 'subscription_response',
        success: false,
        message: 'Error adding subscription',
        error: config.app.nodeEnv === 'development' ? 
          (error instanceof Error ? error.message : String(error)) : 
          'Internal server error'
      });
    }
  }
  
  /**
   * Handle unsubscription messages
   * @param connectionId The connection's unique ID
   * @param message The unsubscription message
   */
  handleUnsubscription(connectionId: string, message: UnsubscriptionPayload): void {
    const { entityType, entityId, all } = message;
    
    try {
      if (all) {
        // Remove all subscriptions for this connection
        this.removeAllSubscriptions(connectionId);
        
        logger.debug('Removed all WebSocket subscriptions', { connectionId });
        
        websocketService.sendToConnection(connectionId, {
          type: 'unsubscription_response',
          success: true,
          message: 'Unsubscribed from all entities'
        });
        return;
      }
      
      // Validate entity type if not unsubscribing from all
      if (!this.isValidEntityType(entityType)) {
        websocketService.sendToConnection(connectionId, {
          type: 'unsubscription_response',
          success: false,
          message: `Invalid entity type: ${entityType}`,
          supportedTypes: Array.from(this.supportedEntityTypes)
        });
        return;
      }
      
      // Generate subscription key
      const subscriptionKey = generateSubscriptionKey(entityType, entityId);
      
      // Remove subscription
      const removed = this.removeSubscription(connectionId, subscriptionKey);
      
      if (removed) {
        logger.debug('WebSocket subscription removed', {
          connectionId,
          entityType,
          entityId
        });
        
        websocketService.sendToConnection(connectionId, {
          type: 'unsubscription_response',
          success: true,
          message: 'Unsubscription successful',
          subscription: {
            entityType,
            entityId
          }
        });
      } else {
        websocketService.sendToConnection(connectionId, {
          type: 'unsubscription_response',
          success: false,
          message: 'No matching subscription found',
          subscription: {
            entityType,
            entityId
          }
        });
      }
    } catch (error) {
      logger.error('Error removing subscription', {
        connectionId,
        entityType,
        entityId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      websocketService.sendToConnection(connectionId, {
        type: 'unsubscription_response',
        success: false,
        message: 'Error removing subscription',
        error: config.app.nodeEnv === 'development' ? 
          (error instanceof Error ? error.message : String(error)) : 
          'Internal server error'
      });
    }
  }
  
  /**
   * Add a subscription for a connection
   * @param connectionId The connection's unique ID
   * @param subscriptionKey The subscription key
   */
  private addSubscription(connectionId: string, subscriptionKey: string): void {
    // Add to subscriptions map
    if (!this.subscriptions.has(subscriptionKey)) {
      this.subscriptions.set(subscriptionKey, new Set());
    }
    this.subscriptions.get(subscriptionKey)!.add(connectionId);
    
    // Add to connection subscriptions map
    if (!this.connectionSubscriptions.has(connectionId)) {
      this.connectionSubscriptions.set(connectionId, new Set());
    }
    this.connectionSubscriptions.get(connectionId)!.add(subscriptionKey);
    
    // Add to connection's subscriptions set in WebSocketConnection
    const connection = websocketService.getConnection(connectionId);
    if (connection) {
      connection.subscriptions.add(subscriptionKey);
    }
  }
  
  /**
   * Remove a subscription for a connection
   * @param connectionId The connection's unique ID
   * @param subscriptionKey The subscription key
   * @returns Whether the subscription was removed
   */
  private removeSubscription(connectionId: string, subscriptionKey: string): boolean {
    let removed = false;
    
    // Remove from subscriptions map
    const subscribers = this.subscriptions.get(subscriptionKey);
    if (subscribers) {
      removed = subscribers.delete(connectionId);
      
      // Clean up empty subscription sets
      if (subscribers.size === 0) {
        this.subscriptions.delete(subscriptionKey);
      }
    }
    
    // Remove from connection subscriptions map
    const connectionSubs = this.connectionSubscriptions.get(connectionId);
    if (connectionSubs) {
      connectionSubs.delete(subscriptionKey);
      
      // Clean up empty connection subscription sets
      if (connectionSubs.size === 0) {
        this.connectionSubscriptions.delete(connectionId);
      }
    }
    
    // Remove from connection's subscriptions set in WebSocketConnection
    const connection = websocketService.getConnection(connectionId);
    if (connection) {
      connection.subscriptions.delete(subscriptionKey);
    }
    
    return removed;
  }
  
  /**
   * Remove all subscriptions for a connection
   * @param connectionId The connection's unique ID
   */
  private removeAllSubscriptions(connectionId: string): void {
    // Get all subscription keys for this connection
    const connectionSubs = this.connectionSubscriptions.get(connectionId);
    if (!connectionSubs) {
      return;
    }
    
    // Remove this connection from each subscription
    for (const subscriptionKey of connectionSubs) {
      const subscribers = this.subscriptions.get(subscriptionKey);
      if (subscribers) {
        subscribers.delete(connectionId);
        
        // Clean up empty subscription sets
        if (subscribers.size === 0) {
          this.subscriptions.delete(subscriptionKey);
        }
      }
    }
    
    // Clear connection subscriptions
    this.connectionSubscriptions.delete(connectionId);
    
    // Clear connection's subscriptions set in WebSocketConnection
    const connection = websocketService.getConnection(connectionId);
    if (connection) {
      connection.subscriptions.clear();
    }
  }
  
  /**
   * Check if a connection is authenticated
   * @param connectionId The connection's unique ID
   * @returns Whether the connection is authenticated
   */
  private isAuthenticated(connectionId: string): boolean {
    return websocketAuthService.isConnectionAuthenticated(connectionId);
  }
  
  /**
   * Validate an entity type
   * @param entityType The entity type to validate
   * @returns Whether the entity type is valid
   */
  private isValidEntityType(entityType: string): boolean {
    return this.supportedEntityTypes.has(entityType);
  }
  
  /**
   * Add a supported entity type
   * @param entityType The entity type to add
   */
  addSupportedEntityType(entityType: string): void {
    this.supportedEntityTypes.add(entityType);
    logger.debug('Added supported entity type', { entityType });
  }
  
  /**
   * Get connections subscribed to an entity
   * @param entityType The entity type
   * @param entityId Optional entity ID
   * @returns Array of connection IDs
   */
  getSubscribers(entityType: string, entityId?: string): string[] {
    const results = new Set<string>();
    
    // Check for subscribers to the specific entity
    if (entityId) {
      const specificKey = generateSubscriptionKey(entityType, entityId);
      const specificSubscribers = this.subscriptions.get(specificKey);
      if (specificSubscribers) {
        specificSubscribers.forEach(id => results.add(id));
      }
    }
    
    // Also check for subscribers to all entities of this type
    const typeKey = generateSubscriptionKey(entityType);
    const typeSubscribers = this.subscriptions.get(typeKey);
    if (typeSubscribers) {
      typeSubscribers.forEach(id => results.add(id));
    }
    
    return Array.from(results);
  }
  
  /**
   * Get all subscriptions for a connection
   * @param connectionId The connection's unique ID
   */
  getConnectionSubscriptions(connectionId: string): string[] {
    const connectionSubs = this.connectionSubscriptions.get(connectionId);
    return connectionSubs ? Array.from(connectionSubs) : [];
  }
  
  /**
   * Clean up subscriptions for a connection that's been closed
   * @param connectionId The connection's unique ID
   */
  handleConnectionClosed(connectionId: string): void {
    this.removeAllSubscriptions(connectionId);
    logger.debug('Cleaned up subscriptions for closed connection', { connectionId });
  }
  
  /**
   * Get subscription metrics
   */
  getMetrics(): any {
    return {
      totalSubscriptions: Array.from(this.subscriptions.values()).reduce((total, subs) => total + subs.size, 0),
      uniqueSubscriptionKeys: this.subscriptions.size,
      connectionsWithSubscriptions: this.connectionSubscriptions.size,
      supportedEntityTypes: Array.from(this.supportedEntityTypes)
    };
  }
}

// Export singleton instance
export const websocketSubscriptionService = new WebSocketSubscriptionService(); 
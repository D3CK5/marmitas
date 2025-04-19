import { logger } from '../utils/logger.utils.js';
import { TransformedEvent } from './supabase-event-transformer.service.js';

/**
 * WebSocket subscription event types
 */
export enum SubscriptionEventType {
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
  ANY = 'any'
}

/**
 * Subscription metadata
 */
export interface SubscriptionMetadata {
  clientId: string;
  entityType: string;
  entityId?: string;
  eventType?: SubscriptionEventType;
  filters?: Record<string, any>;
}

/**
 * Subscription handler function
 */
export type SubscriptionHandler = (event: TransformedEvent) => boolean;

/**
 * WebSocket subscription manager service
 * Handles WebSocket client subscriptions and event dispatch
 */
class WebSocketSubscriptionHandlersService {
  // Map of clientId to their subscriptions
  private clientSubscriptions: Map<string, Map<string, SubscriptionHandler>> = new Map();
  
  /**
   * Initialize the WebSocket subscription handlers service
   */
  initialize(): void {
    logger.info('WebSocket Subscription Handlers Service initialized');
  }
  
  /**
   * Add a subscription for a client
   * @param metadata The subscription metadata
   * @returns The subscription ID
   */
  addSubscription(metadata: SubscriptionMetadata): string {
    // Generate subscription ID
    const subscriptionId = this.generateSubscriptionId(metadata);
    
    // Get or initialize client subscriptions
    const clientSubs = this.getOrInitClientSubscriptions(metadata.clientId);
    
    // Create subscription handler function
    const handler = this.createSubscriptionHandler(metadata);
    
    // Add subscription
    clientSubs.set(subscriptionId, handler);
    
    logger.debug('Added WebSocket subscription', {
      clientId: metadata.clientId,
      subscriptionId,
      entityType: metadata.entityType,
      entityId: metadata.entityId,
      eventType: metadata.eventType
    });
    
    return subscriptionId;
  }
  
  /**
   * Remove a subscription for a client
   * @param clientId The client ID
   * @param subscriptionId The subscription ID
   * @returns Whether the subscription was removed
   */
  removeSubscription(clientId: string, subscriptionId: string): boolean {
    const clientSubs = this.clientSubscriptions.get(clientId);
    if (!clientSubs) {
      return false;
    }
    
    const removed = clientSubs.delete(subscriptionId);
    
    // Remove client entry if no more subscriptions
    if (clientSubs.size === 0) {
      this.clientSubscriptions.delete(clientId);
    }
    
    if (removed) {
      logger.debug('Removed WebSocket subscription', {
        clientId,
        subscriptionId
      });
    }
    
    return removed;
  }
  
  /**
   * Remove all subscriptions for a client
   * @param clientId The client ID
   * @returns The number of subscriptions removed
   */
  removeAllClientSubscriptions(clientId: string): number {
    const clientSubs = this.clientSubscriptions.get(clientId);
    if (!clientSubs) {
      return 0;
    }
    
    const count = clientSubs.size;
    this.clientSubscriptions.delete(clientId);
    
    logger.debug('Removed all WebSocket subscriptions for client', {
      clientId,
      count
    });
    
    return count;
  }
  
  /**
   * Find matching subscriptions for an event and call their handlers
   * @param event The transformed event
   * @returns Array of matched subscription IDs by client
   */
  processEvent(event: TransformedEvent): Record<string, string[]> {
    const matchedByClient: Record<string, string[]> = {};
    
    // Iterate through all client subscriptions
    for (const [clientId, subscriptions] of this.clientSubscriptions.entries()) {
      const matchedIds: string[] = [];
      
      // Check each subscription handler
      for (const [subscriptionId, handler] of subscriptions.entries()) {
        try {
          // Call handler to check if it matches
          if (handler(event)) {
            matchedIds.push(subscriptionId);
          }
        } catch (error) {
          logger.error('Error in subscription handler', {
            clientId,
            subscriptionId,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      // Add to results if any matches found
      if (matchedIds.length > 0) {
        matchedByClient[clientId] = matchedIds;
      }
    }
    
    logger.debug('Processed event for WebSocket subscriptions', {
      entityType: event.entityType,
      eventType: event.eventType,
      entityId: event.entityId,
      matchedClients: Object.keys(matchedByClient).length
    });
    
    return matchedByClient;
  }
  
  /**
   * Get stats about active subscriptions
   */
  getStats(): { totalClients: number; totalSubscriptions: number } {
    let totalSubscriptions = 0;
    
    for (const subscriptions of this.clientSubscriptions.values()) {
      totalSubscriptions += subscriptions.size;
    }
    
    return {
      totalClients: this.clientSubscriptions.size,
      totalSubscriptions
    };
  }
  
  /**
   * Get subscriptions for a client
   * @param clientId The client ID
   */
  getClientSubscriptions(clientId: string): string[] {
    const clientSubs = this.clientSubscriptions.get(clientId);
    return clientSubs ? Array.from(clientSubs.keys()) : [];
  }
  
  /**
   * Generate a subscription ID from metadata
   * @param metadata The subscription metadata
   */
  private generateSubscriptionId(metadata: SubscriptionMetadata): string {
    const { entityType, entityId, eventType } = metadata;
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    
    // Format: entityType.entityId.eventType.timestamp.random
    return `${entityType}${entityId ? `.${entityId}` : ''}${eventType ? `.${eventType}` : ''}.${timestamp}.${random}`;
  }
  
  /**
   * Get or initialize client subscriptions
   * @param clientId The client ID
   */
  private getOrInitClientSubscriptions(clientId: string): Map<string, SubscriptionHandler> {
    let clientSubs = this.clientSubscriptions.get(clientId);
    
    if (!clientSubs) {
      clientSubs = new Map();
      this.clientSubscriptions.set(clientId, clientSubs);
    }
    
    return clientSubs;
  }
  
  /**
   * Create a subscription handler function based on metadata
   * @param metadata The subscription metadata
   */
  private createSubscriptionHandler(metadata: SubscriptionMetadata): SubscriptionHandler {
    const { entityType, entityId, eventType, filters } = metadata;
    
    return (event: TransformedEvent): boolean => {
      // Check entity type
      if (event.entityType !== entityType) {
        return false;
      }
      
      // Check entity ID if specified
      if (entityId && event.entityId !== entityId) {
        return false;
      }
      
      // Check event type if specified
      if (eventType && eventType !== SubscriptionEventType.ANY && event.eventType !== eventType) {
        return false;
      }
      
      // Check filters if specified
      if (filters && !this.matchesFilters(event.data, filters)) {
        return false;
      }
      
      return true;
    };
  }
  
  /**
   * Check if data matches filters
   * @param data The data to check
   * @param filters The filters to match against
   */
  private matchesFilters(data: any, filters: Record<string, any>): boolean {
    // Simple equality check for each filter
    for (const [key, value] of Object.entries(filters)) {
      if (data[key] !== value) {
        return false;
      }
    }
    
    return true;
  }
}

// Export singleton instance
export const websocketSubscriptionHandlersService = new WebSocketSubscriptionHandlersService(); 
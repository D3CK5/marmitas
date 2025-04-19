import { logger } from '../utils/logger.utils.js';

/**
 * Subscription data stored for each client
 */
export interface StoredSubscription {
  clientId: string;
  subscriptionId: string;
  entityType: string;
  entityId?: string;
  eventTypes: string[];
  createdAt: number;
  metadata?: Record<string, any>;
}

/**
 * WebSocket Subscription Storage Service
 * Manages storage of WebSocket client subscriptions
 */
class WebSocketSubscriptionStorageService {
  // Map of clientId -> Map of subscriptionId -> StoredSubscription
  private clientSubscriptions: Map<string, Map<string, StoredSubscription>> = new Map();
  
  // Map of entityType -> Map of entityId -> Set of clientId:subscriptionId
  private entitySubscriptions: Map<string, Map<string | null, Set<string>>> = new Map();
  
  /**
   * Initialize the WebSocket subscription storage service
   */
  initialize(): void {
    logger.info('WebSocket Subscription Storage Service initialized');
  }
  
  /**
   * Store a subscription
   * @param subscription The subscription data to store
   * @returns True if added successfully
   */
  addSubscription(subscription: StoredSubscription): boolean {
    const { clientId, subscriptionId, entityType, entityId, eventTypes } = subscription;
    
    // Validate subscription data
    if (!clientId || !subscriptionId || !entityType || !eventTypes || eventTypes.length === 0) {
      logger.warn('Invalid subscription data', { subscription });
      return false;
    }
    
    // Add to client subscriptions
    if (!this.clientSubscriptions.has(clientId)) {
      this.clientSubscriptions.set(clientId, new Map());
    }
    
    // Store with timestamp if not provided
    const subscriptionData = {
      ...subscription,
      createdAt: subscription.createdAt || Date.now()
    };
    
    this.clientSubscriptions.get(clientId)!.set(subscriptionId, subscriptionData);
    
    // Add to entity subscriptions for efficient lookup
    this.addToEntityIndex(clientId, subscriptionId, entityType, entityId);
    
    logger.debug('Added subscription to storage', {
      clientId,
      subscriptionId,
      entityType,
      entityId
    });
    
    return true;
  }
  
  /**
   * Remove a subscription
   * @param clientId The client ID
   * @param subscriptionId The subscription ID
   * @returns True if removed successfully
   */
  removeSubscription(clientId: string, subscriptionId: string): boolean {
    // Get client's subscriptions
    const clientSubs = this.clientSubscriptions.get(clientId);
    if (!clientSubs) {
      return false;
    }
    
    // Get subscription data before removal
    const subscription = clientSubs.get(subscriptionId);
    if (!subscription) {
      return false;
    }
    
    // Remove from client subscriptions
    clientSubs.delete(subscriptionId);
    
    // Clean up client entry if empty
    if (clientSubs.size === 0) {
      this.clientSubscriptions.delete(clientId);
    }
    
    // Remove from entity index
    this.removeFromEntityIndex(clientId, subscriptionId, subscription.entityType, subscription.entityId);
    
    logger.debug('Removed subscription from storage', {
      clientId,
      subscriptionId,
      entityType: subscription.entityType,
      entityId: subscription.entityId
    });
    
    return true;
  }
  
  /**
   * Remove all subscriptions for a client
   * @param clientId The client ID
   * @returns Number of subscriptions removed
   */
  removeAllClientSubscriptions(clientId: string): number {
    const clientSubs = this.clientSubscriptions.get(clientId);
    if (!clientSubs || clientSubs.size === 0) {
      return 0;
    }
    
    // Get count before removal
    const count = clientSubs.size;
    
    // Remove each subscription from entity index
    for (const [subscriptionId, subscription] of clientSubs.entries()) {
      this.removeFromEntityIndex(clientId, subscriptionId, subscription.entityType, subscription.entityId);
    }
    
    // Remove client entirely
    this.clientSubscriptions.delete(clientId);
    
    logger.debug('Removed all subscriptions for client', {
      clientId,
      count
    });
    
    return count;
  }
  
  /**
   * Get subscription data
   * @param clientId The client ID
   * @param subscriptionId The subscription ID
   * @returns The subscription data or null if not found
   */
  getSubscription(clientId: string, subscriptionId: string): StoredSubscription | null {
    const clientSubs = this.clientSubscriptions.get(clientId);
    return clientSubs?.get(subscriptionId) || null;
  }
  
  /**
   * Get all subscriptions for a client
   * @param clientId The client ID
   * @returns Array of subscriptions
   */
  getClientSubscriptions(clientId: string): StoredSubscription[] {
    const clientSubs = this.clientSubscriptions.get(clientId);
    return clientSubs ? Array.from(clientSubs.values()) : [];
  }
  
  /**
   * Find subscriptions for an entity
   * @param entityType The entity type
   * @param entityId The specific entity ID (optional)
   * @returns Array of client:subscription IDs
   */
  findEntitySubscriptions(entityType: string, entityId?: string): string[] {
    const entitySubs = this.entitySubscriptions.get(entityType);
    if (!entitySubs) {
      return [];
    }
    
    const result = new Set<string>();
    
    // Add subscriptions for the specific entity
    if (entityId) {
      const specificSubs = entitySubs.get(entityId);
      if (specificSubs) {
        specificSubs.forEach(sub => result.add(sub));
      }
    }
    
    // Add subscriptions for all entities of this type (null entityId)
    const allTypeSubs = entitySubs.get(null);
    if (allTypeSubs) {
      allTypeSubs.forEach(sub => result.add(sub));
    }
    
    return Array.from(result);
  }
  
  /**
   * Find client IDs subscribed to an entity
   * @param entityType The entity type
   * @param entityId The specific entity ID (optional)
   * @returns Map of clientId to array of their subscription IDs
   */
  findSubscribedClients(entityType: string, entityId?: string): Map<string, string[]> {
    const subscriptionIds = this.findEntitySubscriptions(entityType, entityId);
    const result = new Map<string, string[]>();
    
    for (const combined of subscriptionIds) {
      const [clientId, subscriptionId] = combined.split(':');
      
      if (!result.has(clientId)) {
        result.set(clientId, []);
      }
      
      result.get(clientId)!.push(subscriptionId);
    }
    
    return result;
  }
  
  /**
   * Get statistics about stored subscriptions
   */
  getStats(): {
    totalClients: number;
    totalSubscriptions: number;
    subscriptionsByEntityType: Record<string, number>;
  } {
    let totalSubscriptions = 0;
    const subscriptionsByEntityType: Record<string, number> = {};
    
    // Count total subscriptions
    for (const clientSubs of this.clientSubscriptions.values()) {
      totalSubscriptions += clientSubs.size;
      
      // Count by entity type
      for (const sub of clientSubs.values()) {
        if (!subscriptionsByEntityType[sub.entityType]) {
          subscriptionsByEntityType[sub.entityType] = 0;
        }
        subscriptionsByEntityType[sub.entityType]++;
      }
    }
    
    return {
      totalClients: this.clientSubscriptions.size,
      totalSubscriptions,
      subscriptionsByEntityType
    };
  }
  
  /**
   * Check if a client has any active subscriptions
   * @param clientId The client ID
   */
  hasSubscriptions(clientId: string): boolean {
    const clientSubs = this.clientSubscriptions.get(clientId);
    return !!clientSubs && clientSubs.size > 0;
  }
  
  /**
   * Add a subscription to the entity index for efficient lookup
   * @param clientId The client ID
   * @param subscriptionId The subscription ID
   * @param entityType The entity type
   * @param entityId The entity ID or undefined
   */
  private addToEntityIndex(
    clientId: string,
    subscriptionId: string,
    entityType: string,
    entityId?: string
  ): void {
    // Get or create entity type map
    if (!this.entitySubscriptions.has(entityType)) {
      this.entitySubscriptions.set(entityType, new Map());
    }
    const entityMap = this.entitySubscriptions.get(entityType)!;
    
    // Use null as key for "all entities of this type"
    const key = entityId || null;
    
    // Get or create entity ID set
    if (!entityMap.has(key)) {
      entityMap.set(key, new Set());
    }
    const subscribers = entityMap.get(key)!;
    
    // Add client:subscriptionId to the set
    subscribers.add(`${clientId}:${subscriptionId}`);
  }
  
  /**
   * Remove a subscription from the entity index
   * @param clientId The client ID
   * @param subscriptionId The subscription ID
   * @param entityType The entity type
   * @param entityId The entity ID or undefined
   */
  private removeFromEntityIndex(
    clientId: string,
    subscriptionId: string,
    entityType: string,
    entityId?: string
  ): void {
    const entityMap = this.entitySubscriptions.get(entityType);
    if (!entityMap) {
      return;
    }
    
    const key = entityId || null;
    const subscribers = entityMap.get(key);
    if (!subscribers) {
      return;
    }
    
    // Remove client:subscriptionId from set
    subscribers.delete(`${clientId}:${subscriptionId}`);
    
    // Clean up empty sets
    if (subscribers.size === 0) {
      entityMap.delete(key);
    }
    
    // Clean up empty maps
    if (entityMap.size === 0) {
      this.entitySubscriptions.delete(entityType);
    }
  }
}

// Export singleton instance
export const websocketSubscriptionStorageService = new WebSocketSubscriptionStorageService(); 
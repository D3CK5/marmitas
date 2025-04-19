import { websocketClient, WebSocketMessageType, WebSocketMessage } from './websocket-client';
import { logger } from '../../utils/logger';

/**
 * Subscription event types
 */
export enum SubscriptionEventType {
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
}

/**
 * Subscription state
 */
export enum SubscriptionState {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  ERROR = 'error',
}

/**
 * Subscription options
 */
export interface SubscriptionOptions {
  entityType: string;
  entityId?: string;
  eventTypes?: SubscriptionEventType[];
  filters?: Record<string, any>;
}

/**
 * Subscription event
 */
export interface SubscriptionEvent {
  entityType: string;
  entityId: string;
  eventType: SubscriptionEventType;
  data: any;
  timestamp: number;
}

/**
 * Subscription handler
 */
export type SubscriptionHandler = (event: SubscriptionEvent) => void;

/**
 * Subscription info
 */
export interface Subscription {
  id: string;
  options: SubscriptionOptions;
  state: SubscriptionState;
  handler: SubscriptionHandler;
  createdAt: number;
}

/**
 * WebSocket Subscription API
 * Manages client subscriptions to entity events
 */
class WebSocketSubscriptionApi {
  private subscriptions: Map<string, Subscription> = new Map();
  private eventHandlerRegistered = false;
  
  /**
   * Initialize the WebSocket subscription API
   */
  initialize(): void {
    // Register event listener for WebSocket events
    this.registerEventHandler();
    
    logger.info('WebSocket Subscription API initialized');
  }
  
  /**
   * Subscribe to entity events
   * @param options Subscription options
   * @param handler Event handler function
   * @returns Subscription ID
   */
  subscribe(options: SubscriptionOptions, handler: SubscriptionHandler): string {
    // Generate subscription ID
    const subscriptionId = this.generateSubscriptionId(options);
    
    // Create subscription object
    const subscription: Subscription = {
      id: subscriptionId,
      options,
      state: SubscriptionState.PENDING,
      handler,
      createdAt: Date.now(),
    };
    
    // Store subscription
    this.subscriptions.set(subscriptionId, subscription);
    
    // Register event handler if not already done
    if (!this.eventHandlerRegistered) {
      this.registerEventHandler();
    }
    
    // Send subscription request to server
    this.sendSubscription(subscription);
    
    logger.debug('Created WebSocket subscription', {
      subscriptionId,
      entityType: options.entityType,
      entityId: options.entityId,
    });
    
    return subscriptionId;
  }
  
  /**
   * Unsubscribe from entity events
   * @param subscriptionId Subscription ID to unsubscribe
   * @returns Whether unsubscription was successful
   */
  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      logger.warn('Attempted to unsubscribe non-existent subscription', { subscriptionId });
      return false;
    }
    
    // Send unsubscribe request to server
    this.sendUnsubscription(subscription);
    
    // Remove subscription
    this.subscriptions.delete(subscriptionId);
    
    logger.debug('Removed WebSocket subscription', { subscriptionId });
    
    return true;
  }
  
  /**
   * Unsubscribe from all subscriptions
   */
  unsubscribeAll(): void {
    // Send unsubscribe request for each subscription
    for (const subscription of this.subscriptions.values()) {
      this.sendUnsubscription(subscription);
    }
    
    // Clear all subscriptions
    const count = this.subscriptions.size;
    this.subscriptions.clear();
    
    logger.debug('Unsubscribed from all WebSocket subscriptions', { count });
  }
  
  /**
   * Get subscription by ID
   * @param subscriptionId Subscription ID
   * @returns Subscription object or null if not found
   */
  getSubscription(subscriptionId: string): Subscription | null {
    return this.subscriptions.get(subscriptionId) || null;
  }
  
  /**
   * Get all active subscriptions
   * @returns Array of subscriptions
   */
  getSubscriptions(): Subscription[] {
    return Array.from(this.subscriptions.values());
  }
  
  /**
   * Find subscriptions for an entity type
   * @param entityType Entity type to find subscriptions for
   * @returns Array of subscription IDs
   */
  findSubscriptionsByEntityType(entityType: string): string[] {
    const result: string[] = [];
    
    for (const [id, subscription] of this.subscriptions.entries()) {
      if (subscription.options.entityType === entityType) {
        result.push(id);
      }
    }
    
    return result;
  }
  
  /**
   * Find subscriptions for a specific entity
   * @param entityType Entity type
   * @param entityId Entity ID
   * @returns Array of subscription IDs
   */
  findSubscriptionsByEntity(entityType: string, entityId: string): string[] {
    const result: string[] = [];
    
    for (const [id, subscription] of this.subscriptions.entries()) {
      if (subscription.options.entityType === entityType &&
          (!subscription.options.entityId || subscription.options.entityId === entityId)) {
        result.push(id);
      }
    }
    
    return result;
  }
  
  /**
   * Send a subscription request to the server
   * @param subscription The subscription to send
   */
  private sendSubscription(subscription: Subscription): void {
    const { options } = subscription;
    
    websocketClient.send(WebSocketMessageType.SUBSCRIBE, {
      entityType: options.entityType,
      entityId: options.entityId,
      eventTypes: options.eventTypes || Object.values(SubscriptionEventType),
      filters: options.filters,
      subscriptionId: subscription.id,
    });
    
    // Update subscription state
    subscription.state = SubscriptionState.ACTIVE;
  }
  
  /**
   * Send an unsubscription request to the server
   * @param subscription The subscription to unsubscribe
   */
  private sendUnsubscription(subscription: Subscription): void {
    websocketClient.send(WebSocketMessageType.UNSUBSCRIBE, {
      subscriptionId: subscription.id,
    });
  }
  
  /**
   * Register event handler for WebSocket events
   */
  private registerEventHandler(): void {
    if (this.eventHandlerRegistered) {
      return;
    }
    
    websocketClient.addEventListener(WebSocketMessageType.EVENT, (message: WebSocketMessage) => {
      this.handleEvent(message);
    });
    
    this.eventHandlerRegistered = true;
  }
  
  /**
   * Handle WebSocket event message
   * @param message The WebSocket message
   */
  private handleEvent(message: WebSocketMessage): void {
    const payload = message.payload;
    if (!payload || !payload.entityType || !payload.eventType) {
      logger.warn('Received invalid WebSocket event', { payload });
      return;
    }
    
    // Create subscription event
    const event: SubscriptionEvent = {
      entityType: payload.entityType,
      entityId: payload.entityId,
      eventType: payload.eventType as SubscriptionEventType,
      data: payload.data,
      timestamp: payload.timestamp || Date.now(),
    };
    
    // Find matching subscriptions
    const matchingSubscriptions = this.findMatchingSubscriptions(event);
    
    // Call handlers for matching subscriptions
    for (const subscription of matchingSubscriptions) {
      try {
        subscription.handler(event);
      } catch (error) {
        logger.error('Error in subscription handler', {
          error: error instanceof Error ? error.message : String(error),
          subscriptionId: subscription.id,
        });
      }
    }
    
    logger.debug('Processed WebSocket event', {
      entityType: event.entityType,
      eventType: event.eventType,
      entityId: event.entityId,
      matchingSubscriptions: matchingSubscriptions.length,
    });
  }
  
  /**
   * Find subscriptions that match an event
   * @param event The event to match
   * @returns Array of matching subscriptions
   */
  private findMatchingSubscriptions(event: SubscriptionEvent): Subscription[] {
    const result: Subscription[] = [];
    
    for (const subscription of this.subscriptions.values()) {
      // Check entity type
      if (subscription.options.entityType !== event.entityType) {
        continue;
      }
      
      // Check entity ID if specified
      if (subscription.options.entityId && subscription.options.entityId !== event.entityId) {
        continue;
      }
      
      // Check event types if specified
      if (subscription.options.eventTypes &&
          subscription.options.eventTypes.length > 0 &&
          !subscription.options.eventTypes.includes(event.eventType)) {
        continue;
      }
      
      // Check filters if specified
      if (subscription.options.filters && !this.matchesFilters(event.data, subscription.options.filters)) {
        continue;
      }
      
      result.push(subscription);
    }
    
    return result;
  }
  
  /**
   * Check if data matches specified filters
   * @param data The data to check
   * @param filters The filters to match against
   * @returns Whether the data matches the filters
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
  
  /**
   * Generate a subscription ID from options
   * @param options Subscription options
   * @returns Generated subscription ID
   */
  private generateSubscriptionId(options: SubscriptionOptions): string {
    const { entityType, entityId } = options;
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    
    // Format: entityType.entityId.timestamp.random
    return `${entityType}${entityId ? `.${entityId}` : ''}.${timestamp}.${random}`;
  }
  
  /**
   * Get statistics about subscriptions
   */
  getStats(): {
    total: number;
    byEntityType: Record<string, number>;
    byState: Record<string, number>;
  } {
    const byEntityType: Record<string, number> = {};
    const byState: Record<string, number> = {};
    
    for (const subscription of this.subscriptions.values()) {
      // Count by entity type
      const entityType = subscription.options.entityType;
      byEntityType[entityType] = (byEntityType[entityType] || 0) + 1;
      
      // Count by state
      const state = subscription.state;
      byState[state] = (byState[state] || 0) + 1;
    }
    
    return {
      total: this.subscriptions.size,
      byEntityType,
      byState,
    };
  }
}

// Export singleton instance
export const websocketSubscription = new WebSocketSubscriptionApi(); 
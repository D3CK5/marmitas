import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { logger } from '../utils/logger.utils.js';
import { config } from '../config/app.config.js';

/**
 * Subscription metadata interface
 */
interface SubscriptionInfo {
  id: string;
  table: string;
  schema: string;
  channel: RealtimeChannel;
  filter?: string;
  eventTypes: string[];
}

/**
 * Event handler callback type
 */
type EventHandler = (payload: any) => void;

/**
 * Supabase Realtime Service
 * Manages subscriptions to Supabase real-time events
 */
class SupabaseRealtimeService {
  private supabase: SupabaseClient | null = null;
  private subscriptions: Map<string, SubscriptionInfo> = new Map();
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  private isInitialized = false;
  
  /**
   * Initialize the Supabase client and connect to Supabase
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    try {
      // Create Supabase client
      const supabaseUrl = config.supabase?.url;
      const supabaseKey = config.supabase?.serviceKey;
      
      if (!supabaseUrl || !supabaseKey) {
        logger.error('Configuração incompleta: URL ou chave de serviço do Supabase não definida');
        throw new Error('Missing Supabase URL or service key in configuration');
      }
      
      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      });
      
      // Verificar se a conexão realtime está funcionando
      if (!this.supabase) {
        throw new Error('Failed to create Supabase client');
      }
      
      // Inicializar processo de verificação periódica de conexão
      this.startConnectionHealthCheck();
      
      this.isInitialized = true;
      
      logger.info('Supabase Realtime Service initialized');
    } catch (error) {
      logger.error('Failed to initialize Supabase Realtime Service', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Tentar inicializar novamente após um tempo
      setTimeout(() => this.initialize(), 5000);
      
      throw error;
    }
  }
  
  /**
   * Subscribe to Supabase real-time events for a table
   * @param table The database table name
   * @param schema The database schema name (default: public)
   * @param eventTypes The event types to subscribe to (default: all)
   * @param filter Optional filter string for the subscription
   * @returns The subscription ID
   */
  async subscribe(
    table: string,
    schema: string = 'public',
    eventTypes: string[] = ['INSERT', 'UPDATE', 'DELETE'],
    filter?: string
  ): Promise<string> {
    if (!this.isInitialized || !this.supabase) {
      throw new Error('Supabase Realtime Service not initialized');
    }
    
    try {
      // Generate subscription ID
      const subscriptionId = `${schema}:${table}:${eventTypes.join(',')}${filter ? `:${filter}` : ''}`;
      
      // Check if subscription already exists
      if (this.subscriptions.has(subscriptionId)) {
        logger.debug('Subscription already exists', { subscriptionId });
        return subscriptionId;
      }
      
      // Create channel for this subscription
      const channel = this.supabase.channel(subscriptionId);
      
      // Apply filter if provided
      let subscription = channel.on('postgres_changes', {
        event: '*',
        schema,
        table,
        filter
      }, (payload) => this.handleEvent(subscriptionId, payload));
      
      // Subscribe to channel
      subscription = subscription.subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          logger.info('Subscribed to Supabase real-time events', {
            subscriptionId,
            table,
            schema,
            eventTypes,
            filter
          });
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('Supabase subscription error', {
            subscriptionId,
            error: err ? err.message : 'Unknown error'
          });
        } else if (status === 'TIMED_OUT') {
          logger.warn('Supabase subscription timed out', { subscriptionId });
          this.removeSubscription(subscriptionId);
          // Try to resubscribe
          setTimeout(() => {
            this.subscribe(table, schema, eventTypes, filter)
              .catch(error => logger.error('Failed to resubscribe', { 
                subscriptionId, error: error.message 
              }));
          }, 5000);
        }
      });
      
      // Store subscription info
      this.subscriptions.set(subscriptionId, {
        id: subscriptionId,
        table,
        schema,
        channel,
        filter,
        eventTypes
      });
      
      // Initialize event handlers set if needed
      if (!this.eventHandlers.has(subscriptionId)) {
        this.eventHandlers.set(subscriptionId, new Set());
      }
      
      return subscriptionId;
    } catch (error) {
      logger.error('Failed to subscribe to Supabase real-time events', {
        table,
        schema,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Unsubscribe from Supabase real-time events
   * @param subscriptionId The subscription ID to unsubscribe from
   * @returns Whether the subscription was removed
   */
  async unsubscribe(subscriptionId: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('Supabase Realtime Service not initialized');
    }
    
    try {
      return this.removeSubscription(subscriptionId);
    } catch (error) {
      logger.error('Failed to unsubscribe from Supabase real-time events', {
        subscriptionId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Handle an event from Supabase
   * @param subscriptionId The subscription ID
   * @param payload The event payload
   */
  private handleEvent(subscriptionId: string, payload: any): void {
    logger.debug('Received Supabase event', {
      subscriptionId,
      eventType: payload.eventType,
      table: payload.table,
      schema: payload.schema,
      new: !!payload.new,
      old: !!payload.old
    });
    
    // Call all event handlers for this subscription
    const handlers = this.eventHandlers.get(subscriptionId);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(payload);
        } catch (error) {
          logger.error('Error in Supabase event handler', {
            subscriptionId,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }
  }
  
  /**
   * Remove a subscription
   * @param subscriptionId The subscription ID to remove
   * @returns Whether the subscription was removed
   */
  private removeSubscription(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return false;
    }
    
    try {
      // Unsubscribe from the channel
      this.supabase?.removeChannel(subscription.channel);
      
      // Remove subscription
      this.subscriptions.delete(subscriptionId);
      
      // Remove event handlers
      this.eventHandlers.delete(subscriptionId);
      
      logger.info('Unsubscribed from Supabase real-time events', { subscriptionId });
      
      return true;
    } catch (error) {
      logger.error('Error removing Supabase subscription', {
        subscriptionId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }
  
  /**
   * Add an event handler for a subscription
   * @param subscriptionId The subscription ID
   * @param handler The event handler function
   * @returns Whether the handler was added
   */
  addEventHandler(subscriptionId: string, handler: EventHandler): boolean {
    if (!this.subscriptions.has(subscriptionId)) {
      logger.warn('Cannot add handler for non-existent subscription', { subscriptionId });
      return false;
    }
    
    if (!this.eventHandlers.has(subscriptionId)) {
      this.eventHandlers.set(subscriptionId, new Set());
    }
    
    this.eventHandlers.get(subscriptionId)!.add(handler);
    return true;
  }
  
  /**
   * Remove an event handler for a subscription
   * @param subscriptionId The subscription ID
   * @param handler The event handler function to remove
   * @returns Whether the handler was removed
   */
  removeEventHandler(subscriptionId: string, handler: EventHandler): boolean {
    const handlers = this.eventHandlers.get(subscriptionId);
    if (!handlers) {
      return false;
    }
    
    return handlers.delete(handler);
  }
  
  /**
   * Get all subscriptions
   * @returns Array of subscription info
   */
  getSubscriptions(): SubscriptionInfo[] {
    return Array.from(this.subscriptions.values());
  }
  
  /**
   * Check if subscription exists
   * @param subscriptionId The subscription ID to check
   * @returns Whether the subscription exists
   */
  hasSubscription(subscriptionId: string): boolean {
    return this.subscriptions.has(subscriptionId);
  }
  
  /**
   * Shutdown the service and remove all subscriptions
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }
    
    try {
      // Remove all subscriptions
      for (const subscription of this.subscriptions.values()) {
        try {
          this.supabase?.removeChannel(subscription.channel);
        } catch (error) {
          // Ignore errors during shutdown
        }
      }
      
      // Clear collections
      this.subscriptions.clear();
      this.eventHandlers.clear();
      
      logger.info('Supabase Realtime Service shutdown');
    } catch (error) {
      logger.error('Error during Supabase Realtime Service shutdown', {
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      this.isInitialized = false;
    }
  }
  
  /**
   * Inicia verificação periódica da saúde da conexão com o Supabase
   */
  private startConnectionHealthCheck(): void {
    const healthCheckInterval = setInterval(() => {
      if (!this.isInitialized || !this.supabase) {
        clearInterval(healthCheckInterval);
        return;
      }
      
      // Verificar cada inscrição
      for (const [subscriptionId, subscription] of this.subscriptions.entries()) {
        const channel = subscription.channel;
        
        if (String(channel.state) !== 'SUBSCRIBED') {
          logger.warn('Subscription channel not in SUBSCRIBED state', { 
            subscriptionId,
            state: channel.state 
          });
          
          // Tentar reinscrever
          this.reconnectSubscription(subscriptionId, subscription);
        }
      }
    }, 30000); // Verificar a cada 30 segundos
  }
  
  /**
   * Tenta reconectar uma inscrição específica
   */
  private reconnectSubscription(subscriptionId: string, subscription: SubscriptionInfo): void {
    logger.info('Attempting to reconnect subscription', { subscriptionId });
    
    // Remover e recriar a inscrição
    this.removeSubscription(subscriptionId);
    
    // Recriar após pequeno atraso
    setTimeout(() => {
      this.subscribe(
        subscription.table,
        subscription.schema,
        subscription.eventTypes,
        subscription.filter
      ).catch(error => {
        logger.error('Failed to reconnect subscription', {
          subscriptionId,
          error: error instanceof Error ? error.message : String(error)
        });
      });
    }, 1000);
  }
}

// Export singleton instance
export const supabaseRealtimeService = new SupabaseRealtimeService(); 
import { logger } from '../utils/logger.utils.js';
import { SubscriptionEventType } from './websocket-subscription-handlers.service.js';

/**
 * Mapping between Supabase event types and WebSocket subscription event types
 */
const EVENT_TYPE_MAPPING = {
  INSERT: SubscriptionEventType.CREATED,
  UPDATE: SubscriptionEventType.UPDATED,
  DELETE: SubscriptionEventType.DELETED
};

/**
 * Event transformation result
 */
export interface TransformedEvent {
  entityType: string;
  entityId?: string;
  eventType: SubscriptionEventType;
  data: any;
  timestamp: number;
  originalPayload?: any;
}

/**
 * Table to entity type mapping
 */
interface TableEntityMapping {
  table: string;
  entityType: string;
  idField: string;
}

/**
 * Supabase Event Transformer Service
 * Transforms Supabase events into standardized format for WebSocket clients
 */
class SupabaseEventTransformerService {
  // Map database tables to entity types
  private tableToEntityMappings: TableEntityMapping[] = [
    { table: 'products', entityType: 'products', idField: 'id' },
    { table: 'orders', entityType: 'orders', idField: 'id' },
    { table: 'customers', entityType: 'customers', idField: 'id' },
    { table: 'deliveries', entityType: 'deliveries', idField: 'id' },
    { table: 'kitchens', entityType: 'kitchens', idField: 'id' },
    { table: 'menus', entityType: 'menus', idField: 'id' },
    { table: 'categories', entityType: 'categories', idField: 'id' },
    { table: 'promotions', entityType: 'promotions', idField: 'id' },
    { table: 'reviews', entityType: 'reviews', idField: 'id' }
  ];
  
  // Custom transformers for specific entity types
  private customTransformers: Map<string, (payload: any) => any> = new Map();
  
  /**
   * Initialize the Supabase event transformer service
   */
  initialize(): void {
    // Register custom transformers if needed
    this.registerCustomTransformers();
    
    logger.info('Supabase Event Transformer Service initialized', {
      mappedTables: this.tableToEntityMappings.map(m => m.table)
    });
  }
  
  /**
   * Register custom transformers for specific entity types
   */
  private registerCustomTransformers(): void {
    // Example of a custom transformer for products
    this.customTransformers.set('products', (payload) => {
      // Deep clone to avoid modifying the original
      const data = JSON.parse(JSON.stringify(payload.new || payload.old || {}));
      
      // Example transformation: formatting price
      if (data.price !== undefined) {
        data.formattedPrice = `$${Number(data.price).toFixed(2)}`;
      }
      
      return data;
    });
    
    // Add more custom transformers as needed
  }
  
  /**
   * Transform a Supabase event payload to a standardized format
   * @param payload The Supabase event payload
   * @returns Transformed event or null if not transformable
   */
  transformEvent(payload: any): TransformedEvent | null {
    try {
      if (!payload || !payload.table) {
        logger.warn('Invalid Supabase event payload', { payload });
        return null;
      }
      
      // Find the mapping for this table
      const mapping = this.tableToEntityMappings.find(m => m.table === payload.table);
      if (!mapping) {
        logger.warn('No entity mapping for table', { table: payload.table });
        return null;
      }
      
      // Map Supabase event type to WebSocket event type
      const eventType = this.mapEventType(payload.eventType);
      if (!eventType) {
        logger.warn('Unknown event type', { eventType: payload.eventType });
        return null;
      }
      
      // Get the entity data
      const entityData = payload.new || payload.old || {};
      
      // Get the entity ID
      const entityId = entityData[mapping.idField]?.toString();
      if (!entityId) {
        logger.warn('Missing entity ID in payload', {
          table: payload.table,
          idField: mapping.idField
        });
        return null;
      }
      
      // Apply custom transformations if available
      let transformedData = entityData;
      const customTransformer = this.customTransformers.get(mapping.entityType);
      if (customTransformer) {
        try {
          transformedData = customTransformer(payload);
        } catch (error) {
          logger.error('Error in custom transformer', {
            entityType: mapping.entityType,
            error: error instanceof Error ? error.message : String(error)
          });
          // Continue with original data on error
          transformedData = entityData;
        }
      }
      
      // Create transformed event
      const transformedEvent: TransformedEvent = {
        entityType: mapping.entityType,
        entityId,
        eventType,
        data: transformedData,
        timestamp: Date.now()
      };
      
      logger.debug('Transformed Supabase event', {
        table: payload.table,
        entityType: mapping.entityType,
        eventType
      });
      
      return transformedEvent;
    } catch (error) {
      logger.error('Error transforming Supabase event', {
        error: error instanceof Error ? error.message : String(error),
        payload
      });
      return null;
    }
  }
  
  /**
   * Map Supabase event type to WebSocket event type
   * @param supabaseEventType The Supabase event type
   * @returns The corresponding WebSocket event type or null if not mappable
   */
  private mapEventType(supabaseEventType: string): SubscriptionEventType | null {
    return EVENT_TYPE_MAPPING[supabaseEventType as keyof typeof EVENT_TYPE_MAPPING] || null;
  }
  
  /**
   * Add a table to entity mapping
   * @param table The database table name
   * @param entityType The entity type
   * @param idField The ID field name
   */
  addTableMapping(table: string, entityType: string, idField: string = 'id'): void {
    // Check if mapping already exists
    const existingIndex = this.tableToEntityMappings.findIndex(m => m.table === table);
    
    if (existingIndex >= 0) {
      // Update existing mapping
      this.tableToEntityMappings[existingIndex] = { table, entityType, idField };
    } else {
      // Add new mapping
      this.tableToEntityMappings.push({ table, entityType, idField });
    }
    
    logger.debug('Added table to entity mapping', { table, entityType, idField });
  }
  
  /**
   * Remove a table to entity mapping
   * @param table The database table name
   * @returns Whether the mapping was removed
   */
  removeTableMapping(table: string): boolean {
    const initialLength = this.tableToEntityMappings.length;
    this.tableToEntityMappings = this.tableToEntityMappings.filter(m => m.table !== table);
    return this.tableToEntityMappings.length < initialLength;
  }
  
  /**
   * Register a custom transformer for an entity type
   * @param entityType The entity type
   * @param transformer The transformer function
   */
  registerTransformer(entityType: string, transformer: (payload: any) => any): void {
    this.customTransformers.set(entityType, transformer);
    logger.debug('Registered custom transformer', { entityType });
  }
  
  /**
   * Unregister a custom transformer for an entity type
   * @param entityType The entity type
   * @returns Whether the transformer was unregistered
   */
  unregisterTransformer(entityType: string): boolean {
    return this.customTransformers.delete(entityType);
  }
  
  /**
   * Get all table to entity mappings
   * @returns Array of table to entity mappings
   */
  getTableMappings(): TableEntityMapping[] {
    return [...this.tableToEntityMappings];
  }
}

// Export singleton instance
export const supabaseEventTransformerService = new SupabaseEventTransformerService(); 
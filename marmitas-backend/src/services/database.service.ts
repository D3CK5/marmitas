import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.utils.js';

// Interface para métricas de BD
interface DbMetrics {
  totalQueries: number;
  errors: number;
  lastError?: string;
  lastErrorTime?: Date;
}

/**
 * DatabaseService - A service for handling database operations
 * 
 * This service encapsulates database access logic, ensuring that
 * all database operations are performed through the backend API.
 */
export class DatabaseService {
  // Métricas para monitoramento
  private metrics: DbMetrics = {
    totalQueries: 0,
    errors: 0
  };
  
  /**
   * Execute a query on the specified table
   * @param table The table to query
   * @param queryFn Function to build the query
   * @returns Query result
   */
  async executeQuery<T>(
    table: string,
    queryFn: (query: any) => any
  ): Promise<T[]> {
    // Incrementar contador de queries
    this.metrics.totalQueries++;
    
    const startTime = Date.now();
    
    try {
      const query = supabase.from(table);
      const { data, error } = await queryFn(query);
      
      if (error) {
        this.recordError(`Database query error in table ${table}: ${error.message}`, error);
        throw new Error(`Database query error: ${error.message}`);
      }
      
      // Log query performance em queries lentas
      const queryTime = Date.now() - startTime;
      if (queryTime > 500) { // Queries mais de 500ms são consideradas lentas
        logger.warn(`Slow database query detected`, {
          table,
          duration: queryTime,
          timestamp: new Date().toISOString()
        });
      }
      
      return data || [];
    } catch (error: any) {
      this.recordError(`Database error in ${table}`, error);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  /**
   * Find records in a table
   * @param table The table to query
   * @param options Query options (filters, pagination, etc.)
   * @returns Matching records
   */
  async find<T>(
    table: string,
    options: { 
      filter?: Record<string, any>;
      orderBy?: { column: string; ascending?: boolean };
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<T[]> {
    return this.executeQuery<T>(table, (query) => {
      let queryBuilder = query.select('*');
      
      // Apply filter if provided
      if (options.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          queryBuilder = queryBuilder.eq(key, value);
        });
      }
      
      // Apply ordering if provided
      if (options.orderBy) {
        const { column, ascending = true } = options.orderBy;
        queryBuilder = queryBuilder.order(column, { ascending });
      }
      
      // Apply pagination if provided
      if (options.limit) {
        queryBuilder = queryBuilder.limit(options.limit);
      }
      
      if (options.offset) {
        queryBuilder = queryBuilder.range(options.offset, options.offset + (options.limit || 10) - 1);
      }
      
      return queryBuilder;
    });
  }

  /**
   * Find a single record by ID
   * @param table The table to query
   * @param id The ID of the record
   * @returns The found record or null
   */
  async findById<T>(table: string, id: string): Promise<T | null> {
    const results = await this.executeQuery<T>(table, (query) => 
      query.select('*').eq('id', id).limit(1)
    );
    
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Create a new record
   * @param table The table to insert into
   * @param data The data to insert
   * @returns The created record
   */
  async create<T>(table: string, data: Partial<T>): Promise<T> {
    const results = await this.executeQuery<T>(table, (query) => 
      query.insert(data).select()
    );
    
    if (!results.length) {
      throw new Error('Failed to create record');
    }
    
    return results[0];
  }

  /**
   * Update an existing record
   * @param table The table to update
   * @param id The ID of the record to update
   * @param data The data to update
   * @returns The updated record
   */
  async update<T>(table: string, id: string, data: Partial<T>): Promise<T> {
    const results = await this.executeQuery<T>(table, (query) => 
      query.update(data).eq('id', id).select()
    );
    
    if (!results.length) {
      throw new Error(`Record with ID ${id} not found`);
    }
    
    return results[0];
  }

  /**
   * Delete a record
   * @param table The table to delete from
   * @param id The ID of the record to delete
   * @returns Whether the deletion was successful
   */
  async delete(table: string, id: string): Promise<boolean> {
    this.metrics.totalQueries++;
    
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      
      if (error) {
        this.recordError(`Failed to delete record from ${table}`, error);
        throw new Error(`Failed to delete record: ${error.message}`);
      }
      
      return true;
    } catch (error: any) {
      this.recordError(`Delete operation failed on ${table}`, error);
      throw new Error(`Failed to delete record: ${error.message}`);
    }
  }
  
  /**
   * Registra um erro de banco de dados e atualiza métricas
   */
  private recordError(message: string, error: any): void {
    this.metrics.errors++;
    this.metrics.lastError = error?.message || String(error);
    this.metrics.lastErrorTime = new Date();
    
    logger.error(message, {
      error: error?.message || String(error),
      code: error?.code,
      details: error?.details,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Retorna métricas de uso e erro do banco de dados
   */
  getMetrics(): DbMetrics {
    return { ...this.metrics };
  }
}

// Export a singleton instance
export const dbService = new DatabaseService();
export default dbService; 
import { supabase } from '../config/supabase.js';
/**
 * DatabaseService - A service for handling database operations
 *
 * This service encapsulates database access logic, ensuring that
 * all database operations are performed through the backend API.
 */
export class DatabaseService {
    /**
     * Execute a query on the specified table
     * @param table The table to query
     * @param queryFn Function to build the query
     * @returns Query result
     */
    async executeQuery(table, queryFn) {
        try {
            const query = supabase.from(table);
            const { data, error } = await queryFn(query);
            if (error) {
                throw new Error(`Database query error: ${error.message}`);
            }
            return data || [];
        }
        catch (error) {
            console.error(`Database error in ${table}:`, error);
            throw new Error(`Database operation failed: ${error.message}`);
        }
    }
    /**
     * Find records in a table
     * @param table The table to query
     * @param options Query options (filters, pagination, etc.)
     * @returns Matching records
     */
    async find(table, options = {}) {
        return this.executeQuery(table, (query) => {
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
    async findById(table, id) {
        const results = await this.executeQuery(table, (query) => query.select('*').eq('id', id).limit(1));
        return results.length > 0 ? results[0] : null;
    }
    /**
     * Create a new record
     * @param table The table to insert into
     * @param data The data to insert
     * @returns The created record
     */
    async create(table, data) {
        const results = await this.executeQuery(table, (query) => query.insert(data).select());
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
    async update(table, id, data) {
        const results = await this.executeQuery(table, (query) => query.update(data).eq('id', id).select());
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
    async delete(table, id) {
        const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', id);
        if (error) {
            throw new Error(`Failed to delete record: ${error.message}`);
        }
        return true;
    }
}
// Export a singleton instance
export const dbService = new DatabaseService();
export default dbService;
//# sourceMappingURL=database.service.js.map
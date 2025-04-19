/**
 * DatabaseService - A service for handling database operations
 *
 * This service encapsulates database access logic, ensuring that
 * all database operations are performed through the backend API.
 */
export declare class DatabaseService {
    /**
     * Execute a query on the specified table
     * @param table The table to query
     * @param queryFn Function to build the query
     * @returns Query result
     */
    executeQuery<T>(table: string, queryFn: (query: any) => any): Promise<T[]>;
    /**
     * Find records in a table
     * @param table The table to query
     * @param options Query options (filters, pagination, etc.)
     * @returns Matching records
     */
    find<T>(table: string, options?: {
        filter?: Record<string, any>;
        orderBy?: {
            column: string;
            ascending?: boolean;
        };
        limit?: number;
        offset?: number;
    }): Promise<T[]>;
    /**
     * Find a single record by ID
     * @param table The table to query
     * @param id The ID of the record
     * @returns The found record or null
     */
    findById<T>(table: string, id: string): Promise<T | null>;
    /**
     * Create a new record
     * @param table The table to insert into
     * @param data The data to insert
     * @returns The created record
     */
    create<T>(table: string, data: Partial<T>): Promise<T>;
    /**
     * Update an existing record
     * @param table The table to update
     * @param id The ID of the record to update
     * @param data The data to update
     * @returns The updated record
     */
    update<T>(table: string, id: string, data: Partial<T>): Promise<T>;
    /**
     * Delete a record
     * @param table The table to delete from
     * @param id The ID of the record to delete
     * @returns Whether the deletion was successful
     */
    delete(table: string, id: string): Promise<boolean>;
}
export declare const dbService: DatabaseService;
export default dbService;
//# sourceMappingURL=database.service.d.ts.map
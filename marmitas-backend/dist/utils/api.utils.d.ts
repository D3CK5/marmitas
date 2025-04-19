import { Response } from 'express';
import { PaginationParams } from '../types/api.types.js';
/**
 * API response utilities for standardizing response formats
 */
export declare const apiResponse: {
    /**
     * Send a success response
     */
    success<T>(res: Response, data: T, statusCode?: number): void;
    /**
     * Send an error response
     */
    error(res: Response, message: string, statusCode?: number, code?: string, details?: Record<string, any>): void;
    /**
     * Send a paginated response
     */
    paginated<T>(res: Response, data: T[], total: number, params: PaginationParams): void;
};
/**
 * Parse pagination parameters from request query
 */
export declare const parsePaginationParams: (query: any) => PaginationParams;
/**
 * Calculate offset from pagination parameters
 */
export declare const calculateOffset: (page: number, pageSize: number) => number;
//# sourceMappingURL=api.utils.d.ts.map
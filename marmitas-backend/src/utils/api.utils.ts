import { Response } from 'express';
import { 
  ApiResponse, 
  ApiErrorResponse, 
  PaginatedResponse, 
  PaginationParams
} from '../types/api.types.js';

/**
 * API response utilities for standardizing response formats
 */
export const apiResponse = {
  /**
   * Send a success response
   */
  success<T>(res: Response, data: T, statusCode = 200): void {
    const response: ApiResponse<T> = {
      data,
      status: 'success',
      timestamp: new Date().toISOString()
    };
    res.status(statusCode).json(response);
  },

  /**
   * Send an error response
   */
  error(
    res: Response, 
    message: string, 
    statusCode = 500, 
    code?: string, 
    details?: Record<string, any>
  ): void {
    const response: ApiErrorResponse = {
      error: {
        message,
        code: code || undefined,
        details: details || undefined
      },
      status: 'error',
      timestamp: new Date().toISOString()
    };
    res.status(statusCode).json(response);
  },

  /**
   * Send a paginated response
   */
  paginated<T>(
    res: Response,
    data: T[],
    total: number,
    params: PaginationParams
  ): void {
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const totalPages = Math.ceil(total / pageSize);

    const response: PaginatedResponse<T> = {
      data,
      pagination: {
        total,
        page,
        pageSize,
        totalPages
      },
      status: 'success',
      timestamp: new Date().toISOString()
    };
    res.status(200).json(response);
  }
};

/**
 * Parse pagination parameters from request query
 */
export const parsePaginationParams = (query: any): PaginationParams => {
  return {
    page: query.page ? parseInt(query.page) : 1,
    pageSize: query.pageSize ? parseInt(query.pageSize) : 10,
    sort: query.sort || 'createdAt',
    direction: (query.direction as 'asc' | 'desc') || 'desc'
  };
};

/**
 * Calculate offset from pagination parameters
 */
export const calculateOffset = (page: number, pageSize: number): number => {
  return (page - 1) * pageSize;
}; 
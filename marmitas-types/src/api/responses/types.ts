/**
 * API response type definitions
 */
import { PaginationParams } from '../../models/common';

/**
 * Base API response interface
 */
export interface ApiResponse<T> {
  /** Response data */
  data: T;
  
  /** Response status */
  status: 'success';
  
  /** Response timestamp */
  timestamp: string;
}

/**
 * API error response interface
 */
export interface ApiErrorResponse {
  /** Error details */
  error: {
    /** Error message */
    message: string;
    
    /** Optional error code */
    code?: string;
    
    /** Optional error details */
    details?: unknown;
  };
  
  /** Response status */
  status: 'error';
  
  /** Response timestamp */
  timestamp: string;
}

/**
 * Paginated response interface
 */
export interface PaginatedResponse<T> extends Omit<ApiResponse<T[]>, 'data'> {
  /** Array of data items */
  data: T[];
  
  /** Pagination information */
  pagination: {
    /** Total number of items */
    total: number;
    
    /** Current page number */
    page: number;
    
    /** Number of items per page */
    pageSize: number;
    
    /** Total number of pages */
    totalPages: number;
  };
} 
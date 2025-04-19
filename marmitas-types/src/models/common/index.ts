/**
 * Common utility types shared across the application
 */

/**
 * Base entity interface with common properties
 */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Timestamp properties for entities
 */
export type TimestampFields = Pick<BaseEntity, 'createdAt' | 'updatedAt'>;

/**
 * Pagination parameters for API requests
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

/**
 * Nutritional information object
 */
export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export * from './enums'; 
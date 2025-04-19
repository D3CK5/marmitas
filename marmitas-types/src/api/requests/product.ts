/**
 * Product API request type definitions
 */
import { NutritionalInfo } from '../../models/common';

/**
 * Create product request
 */
export interface CreateProductRequest {
  /** Product name */
  name: string;
  
  /** Product description */
  description: string;
  
  /** Product price */
  price: number;
  
  /** Category identifier */
  categoryId: string;
  
  /** Optional URL to product image */
  imageUrl?: string;
  
  /** Optional availability flag */
  isAvailable?: boolean;
  
  /** Optional ingredients list */
  ingredients?: string[];
  
  /** Optional nutritional information */
  nutritionalInfo?: NutritionalInfo;
}

/**
 * Update product request
 */
export interface UpdateProductRequest {
  /** Optional product name */
  name?: string;
  
  /** Optional product description */
  description?: string;
  
  /** Optional product price */
  price?: number;
  
  /** Optional category identifier */
  categoryId?: string;
  
  /** Optional URL to product image */
  imageUrl?: string;
  
  /** Optional availability flag */
  isAvailable?: boolean;
  
  /** Optional ingredients list */
  ingredients?: string[];
  
  /** Optional nutritional information */
  nutritionalInfo?: NutritionalInfo;
}

/**
 * Product filter options
 */
export interface ProductFiltersRequest {
  /** Optional category identifier filter */
  categoryId?: string;
  
  /** Optional search query */
  query?: string;
  
  /** Optional minimum price filter */
  minPrice?: number;
  
  /** Optional maximum price filter */
  maxPrice?: number;
  
  /** Optional availability filter */
  available?: boolean;
} 
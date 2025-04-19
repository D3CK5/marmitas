/**
 * Product type definitions
 */
import { BaseEntity, NutritionalInfo } from '../common';

/**
 * Product category interface
 */
export interface ProductCategory extends BaseEntity {
  /** Unique identifier */
  id: string;
  
  /** Category name */
  name: string;
  
  /** Optional category description */
  description?: string;
}

/**
 * Product interface representing a product in the system
 * This combines the frontend and backend product models
 */
export interface Product extends BaseEntity {
  /** Unique identifier */
  id: string;
  
  /** Product name */
  name: string;
  
  /** Product description */
  description: string;
  
  /** Product price */
  price: number;
  
  /** Optional URL to the product image */
  imageUrl?: string;
  
  /** Category identifier the product belongs to */
  categoryId: string;
  
  /** Whether the product is available for purchase */
  isAvailable: boolean;
  
  /** Optional list of ingredients */
  ingredients?: string[];
  
  /** Optional nutritional information */
  nutritionalInfo?: NutritionalInfo;
}

/**
 * Changeable food option for product customization
 */
export interface ChangeableFood extends BaseEntity {
  /** Unique identifier */
  id: string;
  
  /** Option name */
  name: string;
  
  /** Additional price for this option */
  additionalPrice: number;
}

/**
 * Product changeable food mapping
 */
export interface ProductChangeableFood {
  /** Product identifier */
  productId: string;
  
  /** Changeable food option identifier */
  changeableFoodId: string;
  
  /** Whether this option is available for the product */
  isAvailable: boolean;
} 
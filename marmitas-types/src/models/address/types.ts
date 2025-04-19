/**
 * Address type definitions
 */
import { BaseEntity } from '../common';

/**
 * Address interface representing a physical address
 */
export interface Address extends BaseEntity {
  /** Unique identifier */
  id: string;
  
  /** User identifier associated with this address */
  userId: string;
  
  /** Street name */
  street: string;
  
  /** House/building number */
  number: string;
  
  /** Additional address information (apartment, floor, etc.) */
  complement?: string;
  
  /** Neighborhood/district */
  neighborhood: string;
  
  /** City name */
  city: string;
  
  /** State/province */
  state: string;
  
  /** Postal/ZIP code */
  zipCode: string;
  
  /** Country */
  country: string;
  
  /** Whether this is the default address for the user */
  isDefault?: boolean;
  
  /** Optional address label (home, work, etc.) */
  label?: string;
}

/**
 * Delivery area interface for defining delivery coverage
 */
export interface DeliveryArea extends BaseEntity {
  /** Unique identifier */
  id: string;
  
  /** Area name (usually neighborhood or district) */
  name: string;
  
  /** Delivery fee for this area */
  deliveryFee: number;
  
  /** Estimated delivery time in minutes */
  estimatedTime: number;
  
  /** Whether delivery is available for this area */
  isAvailable: boolean;
  
  /** Optional ZIP/postal codes covered by this area */
  zipCodes?: string[];
}

/**
 * Simplified address for order delivery
 */
export interface DeliveryAddress {
  /** Full address as a string */
  fullAddress: string;
  
  /** Reference address ID if saved */
  addressId?: string;
  
  /** Delivery instructions */
  instructions?: string;
  
  /** Delivery area ID */
  deliveryAreaId?: string;
} 
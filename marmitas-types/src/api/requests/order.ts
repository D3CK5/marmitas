/**
 * Order API request type definitions
 */
import { OrderStatus, PaymentMethod } from '../../models/common/enums';
import { DeliveryAddress } from '../../models/address/types';

/**
 * Create order item request
 */
export interface CreateOrderItemRequest {
  /** Product identifier */
  productId: string;
  
  /** Quantity of the product */
  quantity: number;
  
  /** Optional customizations for this item */
  customizations?: string[];
  
  /** Optional notes for this item */
  notes?: string;
}

/**
 * Create order request
 */
export interface CreateOrderRequest {
  /** Items to include in the order */
  items: CreateOrderItemRequest[];
  
  /** Optional delivery address */
  deliveryAddress?: DeliveryAddress;
  
  /** Optional payment method */
  paymentMethod?: PaymentMethod;
  
  /** Optional scheduled delivery time */
  scheduledFor?: string;
  
  /** Optional discount code */
  discountCode?: string;
  
  /** Optional order notes */
  notes?: string;
}

/**
 * Update order request
 */
export interface UpdateOrderRequest {
  /** Optional order status */
  status?: OrderStatus;
  
  /** Optional delivery address */
  deliveryAddress?: DeliveryAddress;
  
  /** Optional payment method */
  paymentMethod?: PaymentMethod;
  
  /** Optional payment status */
  paymentStatus?: 'pending' | 'paid' | 'failed';
  
  /** Optional scheduled delivery time */
  scheduledFor?: string;
}

/**
 * Order filter options
 */
export interface OrderFiltersRequest {
  /** Optional status filter */
  status?: OrderStatus;
  
  /** Optional start date filter */
  startDate?: string;
  
  /** Optional end date filter */
  endDate?: string;
  
  /** Optional minimum total amount filter */
  minTotal?: number;
  
  /** Optional maximum total amount filter */
  maxTotal?: number;
} 
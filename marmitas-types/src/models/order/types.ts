/**
 * Order type definitions
 */
import { BaseEntity } from '../common';
import { OrderStatus, PaymentMethod } from '../common/enums';
import { DeliveryAddress } from '../address/types';

/**
 * Order item interface representing a product in an order
 */
export interface OrderItem extends BaseEntity {
  /** Unique identifier */
  id: string;
  
  /** Order identifier this item belongs to */
  orderId: string;
  
  /** Product identifier */
  productId: string;
  
  /** Product name (for display) */
  productName: string;
  
  /** Quantity of the product */
  quantity: number;
  
  /** Unit price at the time of order */
  unitPrice: number;
  
  /** Calculated subtotal (quantity * unitPrice) */
  subtotal: number;
  
  /** Optional customizations for this item */
  customizations?: string[];
  
  /** Optional notes for this item */
  notes?: string;
}

/**
 * Order interface representing a customer order
 */
export interface Order extends BaseEntity {
  /** Unique identifier */
  id: string;
  
  /** User identifier who placed the order */
  userId: string;
  
  /** Current order status */
  status: OrderStatus;
  
  /** Total order amount */
  totalAmount: number;
  
  /** Delivery fee */
  deliveryFee?: number;
  
  /** Items in the order */
  items: OrderItem[];
  
  /** Delivery address */
  deliveryAddress?: DeliveryAddress;
  
  /** Payment method */
  paymentMethod?: PaymentMethod;
  
  /** Payment status */
  paymentStatus?: 'pending' | 'paid' | 'failed';
  
  /** Scheduled delivery time */
  scheduledFor?: string;
  
  /** Discount amount applied to the order */
  discountAmount?: number;
  
  /** Discount code applied to the order */
  discountCode?: string;
  
  /** Customer notes for the order */
  notes?: string;
}

/**
 * Cart item interface for the shopping cart
 */
export interface CartItem {
  /** Product identifier */
  productId: string;
  
  /** Quantity of the product */
  quantity: number;
  
  /** Optional customizations for this item */
  customizations?: string[];
  
  /** Optional notes for this item */
  notes?: string;
} 
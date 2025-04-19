/**
 * Enums for the application
 */

/**
 * User role enum
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  CUSTOMER = 'customer'
}

/**
 * Order status enum (unified from frontend and backend)
 */
export enum OrderStatus {
  PENDING = 'pending',
  AWAITING_PAYMENT = 'awaiting_payment',
  PROCESSING = 'processing',
  PREPARING = 'preparing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

/**
 * Payment method enum
 */
export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  CASH = 'cash',
  PIX = 'pix',
  BANK_TRANSFER = 'bank_transfer'
}

/**
 * Delivery status enum
 */
export enum DeliveryStatus {
  WAITING = 'waiting',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
} 
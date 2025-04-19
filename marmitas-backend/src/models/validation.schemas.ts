import { z } from 'zod';

/**
 * Validation schemas for API requests
 */

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters')
});

// User schemas
export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email format').optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

// Product schemas
export const createProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().positive('Price must be a positive number'),
  imageUrl: z.string().url('Invalid image URL').optional(),
  category: z.string().min(2, 'Category must be at least 2 characters'),
  isAvailable: z.boolean().default(true)
});

export const updateProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  price: z.number().positive('Price must be a positive number').optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
  category: z.string().min(2, 'Category must be at least 2 characters').optional(),
  isAvailable: z.boolean().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

// Order schemas
export const orderItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID format'),
  quantity: z.number().int().positive('Quantity must be a positive integer')
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'Order must contain at least one item'),
  deliveryAddress: z.string().min(10, 'Delivery address must be at least 10 characters').optional()
});

export const updateOrderSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'cancelled']).optional(),
  deliveryAddress: z.string().min(10, 'Delivery address must be at least 10 characters').optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  sort: z.string().default('createdAt'),
  direction: z.enum(['asc', 'desc']).default('desc')
}); 
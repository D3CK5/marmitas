import { Router } from 'express';
import { apiGateway } from '../config/api-gateway.config.js';

// Import routes
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import productRoutes from './product.routes.js';
import orderRoutes from './order.routes.js';
import categoryRoutes from './category.routes.js';
import foodRoutes from './food.routes.js';
import addressRoutes from './address.routes.js';

// Create router
export const apiRoutes = Router();

// Register routes
// Public routes that don't require authentication
apiGateway.registerRoute('/auth', authRoutes, {
  authRequired: false,
  rateLimitMax: 20, // More strict rate limiting for auth endpoints
  isHighlySensitive: true, // Mark auth endpoints as highly sensitive
  description: 'Authentication endpoints'
});

// Protected routes
apiGateway.registerRoute('/users', userRoutes, {
  authRequired: true,
  description: 'User management endpoints'
});

apiGateway.registerRoute('/products', productRoutes, {
  authRequired: false, // Public access for reading, auth checked in controllers for write
  description: 'Product management endpoints'
});

apiGateway.registerRoute('/orders', orderRoutes, {
  authRequired: true,
  description: 'Order management endpoints'
});

apiGateway.registerRoute('/categories', categoryRoutes, {
  authRequired: false, // Public access for reading, auth checked in controllers for write
  description: 'Category management endpoints'
});

apiGateway.registerRoute('/foods', foodRoutes, {
  authRequired: false, // Public access for reading, auth checked in controllers for write
  description: 'Food management endpoints'
});

apiGateway.registerRoute('/addresses', addressRoutes, {
  authRequired: true,
  description: 'Address management endpoints'
});

// API documentation and status routes
apiGateway.registerRoute('/status', Router().get('/', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
}), {
  authRequired: false,
  description: 'API status endpoint'
});

// Version information route
apiRoutes.get('/version', (_req, res) => {
  res.json({
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

export default apiRoutes; 
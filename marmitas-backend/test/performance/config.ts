/**
 * Performance Test Configuration
 * 
 * This file contains configuration settings for performance tests.
 * Includes baseline values from pre-separation benchmarks for comparison.
 */

import path from 'path';
import fs from 'fs';

// Base configuration for all performance tests
export const BASE_CONFIG = {
  // Server configuration
  server: {
    host: process.env.API_HOST || 'localhost',
    port: parseInt(process.env.API_PORT || '3001', 10),
    protocol: process.env.API_PROTOCOL || 'http',
  },
  
  // Performance test runs
  runs: {
    warmup: 1,     // Number of warmup runs before collecting metrics
    iterations: 3,  // Number of test iterations for averaging results
    timeout: 60000, // Test timeout in milliseconds
  },
  
  // Output directories
  output: {
    dir: path.join(process.cwd(), 'test', 'performance', 'results'),
    baseline: path.join(process.cwd(), 'test', 'performance', 'baseline'),
  },
  
  // Default concurrency levels
  concurrency: {
    low: 10,      // Low load testing
    medium: 50,    // Medium load testing
    high: 100,     // High load testing
    extreme: 200,  // Extreme load testing (stress test)
  },
  
  // Test durations in seconds
  duration: {
    short: 10,    // Short test runs
    medium: 30,    // Medium test runs
    long: 60,      // Long test runs
    stress: 120,   // Stress test runs
  },
};

// API endpoint scenarios for performance testing
export const API_ENDPOINTS = {
  // Authentication endpoints
  auth: {
    login: {
      method: 'POST',
      path: '/api/auth/login',
      payload: {
        email: 'perftest@example.com',
        password: 'PerfTest123!',
      },
      expectedStatus: 200,
    },
    profile: {
      method: 'GET',
      path: '/api/auth/profile',
      requiresAuth: true,
      expectedStatus: 200,
    },
    logout: {
      method: 'POST',
      path: '/api/auth/logout',
      requiresAuth: true,
      expectedStatus: 204,
    },
  },
  
  // Product endpoints
  products: {
    list: {
      method: 'GET',
      path: '/api/products',
      expectedStatus: 200,
    },
    get: {
      method: 'GET',
      path: '/api/products/:id',
      paramResolver: async () => {
        // This would typically get a valid product ID from the database
        return { id: '123e4567-e89b-12d3-a456-426614174000' };
      },
      expectedStatus: 200,
    },
  },
  
  // Order endpoints
  orders: {
    create: {
      method: 'POST',
      path: '/api/orders',
      requiresAuth: true,
      payload: {
        items: [
          { productId: '123e4567-e89b-12d3-a456-426614174000', quantity: 2 },
          { productId: '223e4567-e89b-12d3-a456-426614174001', quantity: 1 },
        ],
        deliveryAddress: {
          street: '123 Test Street',
          city: 'Test City',
          postalCode: '12345',
        },
        paymentMethod: 'card',
      },
      expectedStatus: 201,
    },
    list: {
      method: 'GET',
      path: '/api/orders',
      requiresAuth: true,
      expectedStatus: 200,
    },
  },
};

// Baseline metrics from pre-separation benchmarks
export const BASELINE_METRICS = {
  // API latency baselines (milliseconds)
  api: {
    auth: {
      login: { p50: 120, p95: 250, p99: 350 },
      profile: { p50: 80, p95: 150, p99: 250 },
      logout: { p50: 50, p95: 100, p99: 150 },
    },
    products: {
      list: { p50: 150, p95: 300, p99: 450 },
      get: { p50: 100, p95: 200, p99: 300 },
    },
    orders: {
      create: { p50: 200, p95: 400, p99: 600 },
      list: { p50: 180, p95: 350, p99: 500 },
    },
  },
  
  // Throughput baselines (requests per second)
  throughput: {
    auth: {
      login: { low: 50, medium: 120, high: 180 },
      profile: { low: 80, medium: 200, high: 320 },
      logout: { low: 100, medium: 250, high: 400 },
    },
    products: {
      list: { low: 40, medium: 100, high: 150 },
      get: { low: 60, medium: 150, high: 230 },
    },
    orders: {
      create: { low: 30, medium: 70, high: 110 },
      list: { low: 35, medium: 85, high: 130 },
    },
  },
  
  // Database operation baselines (milliseconds)
  database: {
    read: { p50: 15, p95: 40, p99: 80 },
    write: { p50: 30, p95: 60, p99: 120 },
    transaction: { p50: 50, p95: 100, p99: 200 },
  },
  
  // WebSocket performance baselines
  websocket: {
    messageLatency: { p50: 40, p95: 100, p99: 200 },
    connectionTime: { p50: 80, p95: 150, p99: 250 },
    maxConcurrentConnections: 1000,
  },
  
  // Memory usage baselines (MB)
  memory: {
    idle: 80,
    low: 120,
    medium: 180,
    high: 250,
  },
  
  // CPU usage baselines (percentage)
  cpu: {
    idle: 5,
    low: 20,
    medium: 40,
    high: 70,
  },
};

// Create the results directory if it doesn't exist
export const ensureDirectoriesExist = (): void => {
  [BASE_CONFIG.output.dir, BASE_CONFIG.output.baseline].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Helper to get absolute URL for a given endpoint
export const getEndpointUrl = (path: string): string => {
  const { protocol, host, port } = BASE_CONFIG.server;
  return `${protocol}://${host}:${port}${path}`;
};

// Export configuration
export default {
  BASE_CONFIG,
  API_ENDPOINTS,
  BASELINE_METRICS,
  ensureDirectoriesExist,
  getEndpointUrl,
}; 
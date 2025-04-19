/**
 * Models Module
 * 
 * Contains domain model type definitions that represent the core business entities
 * in the Marmitas application. These types are organized by domain namespace.
 */

// Common types and utilities
export * from './common';

// User/Profile types
export * from './user';

// Product types
export * from './product';

// Order types
export * from './order';

// Address types
export * from './address';

// This namespace will be populated with actual types in future implementations
export namespace Models {
  // Placeholder for future model type definitions
}

// Future exports will be added here as types are implemented
// export * from './user';
// export * from './order';
// export * from './delivery'; 
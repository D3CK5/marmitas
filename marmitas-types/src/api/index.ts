/**
 * API Module
 * 
 * Contains API request and response type definitions for the Marmitas application.
 * These types define the contract between frontend and backend.
 */

// API responses
export * from './responses';

// API requests
export * from './requests';

// This namespace is kept for backward compatibility
export namespace API {
  // Namespace no longer needs content as types are directly exported
}

// Future exports will be added here as types are implemented
// export * from './requests';
// export * from './responses';
// export * from './errors'; 
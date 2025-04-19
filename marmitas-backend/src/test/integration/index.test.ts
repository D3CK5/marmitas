/**
 * Integration Tests Index
 * 
 * This file serves as an entry point for running all integration tests.
 * It imports and re-exports the individual test files.
 */

// Import all integration tests
import './api-contract.test';
import './auth-flow.test';

// We could add additional setup/teardown logic here if needed
beforeAll(() => {
  console.log('Starting integration tests');
});

afterAll(() => {
  console.log('All integration tests completed');
}); 
import { errorHandler } from '../middleware/error.middleware.js';
import { Request, Response, NextFunction } from 'express';
import assert from 'assert';
import { HttpError } from '../utils/errors.js';

/**
 * Test suite for error handling middleware
 * 
 * These tests verify that the error handling middleware correctly processes
 * different types of errors and returns appropriate responses.
 */

async function runTests() {
  console.log('=== Running Error Handling Tests ===');
  let succeeded = 0;
  let failed = 0;
  const total = 4;

  // Test 1: HTTP error handling
  try {
    // Create mock request, response and error
    const req = mockRequest();
    const res = mockResponse();
    const next = () => {};
    const httpError = new HttpError('Resource not found', 404);
    
    // Execute error handler
    errorHandler(httpError, req, res, next);
    
    // Verify response
    assert.strictEqual(res.statusCode, 404, 'Status code should match error status');
    assert.strictEqual(res.jsonData.message, 'Resource not found', 'Error message should be preserved');
    assert.strictEqual(res.jsonData.status, 'error', 'Status should be "error"');
    
    console.log('✅ Test 1: HTTP error handling - PASSED');
    succeeded++;
  } catch (error) {
    console.error('❌ Test 1: HTTP error handling - FAILED', error);
    failed++;
  }

  // Test 2: Validation error handling
  try {
    // Create mock objects
    const req = mockRequest();
    const res = mockResponse();
    const next = () => {};
    
    // Create a validation error (typically from express-validator)
    const validationError = {
      name: 'ValidationError',
      message: 'Validation failed',
      errors: [
        { param: 'email', msg: 'Invalid email format', value: 'not-an-email' },
        { param: 'password', msg: 'Password too short', value: '123' }
      ]
    };
    
    // Execute error handler
    errorHandler(validationError, req, res, next);
    
    // Verify response
    assert.strictEqual(res.statusCode, 400, 'Validation errors should return 400 Bad Request');
    assert.strictEqual(res.jsonData.message, 'Validation failed', 'Error message should be preserved');
    assert.strictEqual(res.jsonData.status, 'error', 'Status should be "error"');
    assert(Array.isArray(res.jsonData.errors), 'Response should contain errors array');
    assert.strictEqual(res.jsonData.errors.length, 2, 'Both validation errors should be included');
    
    console.log('✅ Test 2: Validation error handling - PASSED');
    succeeded++;
  } catch (error) {
    console.error('❌ Test 2: Validation error handling - FAILED', error);
    failed++;
  }

  // Test 3: Database error handling
  try {
    // Create mock objects
    const req = mockRequest();
    const res = mockResponse();
    const next = () => {};
    
    // Create a database-type error
    const dbError = {
      name: 'SequelizeError',
      message: 'Database connection failed',
      original: {
        code: 'ECONNREFUSED',
        errno: 111
      }
    };
    
    // Execute error handler
    errorHandler(dbError, req, res, next);
    
    // Verify response
    assert.strictEqual(res.statusCode, 500, 'DB errors should return 500 Internal Server Error');
    assert(res.jsonData.message.includes('internal server error'), 'Should return generic error message for security');
    assert.strictEqual(res.jsonData.status, 'error', 'Status should be "error"');
    
    // In production, we shouldn't expose the actual error details to clients
    if (process.env.NODE_ENV === 'production') {
      assert(!res.jsonData.error, 'Error details should not be exposed in production');
    } else {
      assert(res.jsonData.error, 'Error details can be included in non-production');
    }
    
    console.log('✅ Test 3: Database error handling - PASSED');
    succeeded++;
  } catch (error) {
    console.error('❌ Test 3: Database error handling - FAILED', error);
    failed++;
  }

  // Test 4: Generic error handling
  try {
    // Create mock objects
    const req = mockRequest();
    const res = mockResponse();
    const next = () => {};
    
    // Create a generic Error
    const genericError = new Error('Something went wrong');
    
    // Execute error handler
    errorHandler(genericError, req, res, next);
    
    // Verify response
    assert.strictEqual(res.statusCode, 500, 'Generic errors should return 500 Internal Server Error');
    assert(res.jsonData.message.includes('internal server error'), 'Should return generic error message');
    assert.strictEqual(res.jsonData.status, 'error', 'Status should be "error"');
    
    // Make sure we log errors properly - this is harder to test directly
    // In a real implementation, this would be verified with a mock logger
    
    console.log('✅ Test 4: Generic error handling - PASSED');
    succeeded++;
  } catch (error) {
    console.error('❌ Test 4: Generic error handling - FAILED', error);
    failed++;
  }

  // Print test summary
  console.log('\n=== Error Handling Test Results ===');
  console.log(`Total: ${total}, Passed: ${succeeded}, Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('✅ All error handling tests passed!');
    return true;
  } else {
    console.log('❌ Some error handling tests failed');
    return false;
  }
}

// Utility functions to create mock request and response objects
function mockRequest(): Request {
  return {
    body: {},
    params: {},
    query: {}
  } as Request;
}

function mockResponse(): any {
  const res: any = {};
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data: any) => {
    res.jsonData = data;
    return res;
  };
  return res;
}

// Run tests directly if this file is executed
if (require.main === module) {
  runTests().then(passed => {
    if (!passed) {
      process.exit(1);
    }
  }).catch(error => {
    console.error('Error running error handling tests:', error);
    process.exit(1);
  });
}

export { runTests }; 
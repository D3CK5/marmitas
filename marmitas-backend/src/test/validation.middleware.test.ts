import { validateBody, validateParams } from '../middleware/validation.middleware.js';
import { Request, Response, NextFunction } from 'express';
import assert from 'assert';
import { body, param } from 'express-validator';
import { HttpError } from '../utils/errors.js';

/**
 * Test suite for validation middleware
 * 
 * These tests verify that the validation middleware functions correctly validate 
 * request body and parameters and handle validation errors appropriately.
 */

async function runTests() {
  console.log('=== Running Validation Middleware Tests ===');
  let succeeded = 0;
  let failed = 0;
  const total = 4;

  // Test 1: validateBody passes with valid data
  try {
    // Mock validation rules
    const validationRules = [
      body('email').isEmail(),
      body('password').isLength({ min: 6 })
    ];

    // Create mock request with valid data
    const req = mockRequest({ 
      body: {
        email: 'user@example.com',
        password: 'validPassword123'
      }
    });
    
    const res = mockResponse();
    let nextCalled = false;
    let errorPassed = null;
    const next: NextFunction = (error?: any) => { 
      nextCalled = true; 
      errorPassed = error;
    };
    
    // Execute middleware
    const middleware = validateBody(validationRules);
    await middleware(req, res, next);
    
    // Verify next was called with no error
    assert(nextCalled, 'Next function should be called for valid data');
    assert(!errorPassed, 'No error should be passed to next');
    
    console.log('✅ Test 1: Valid body data - PASSED');
    succeeded++;
  } catch (error) {
    console.error('❌ Test 1: Valid body data - FAILED', error);
    failed++;
  }

  // Test 2: validateBody fails with invalid data
  try {
    // Mock validation rules
    const validationRules = [
      body('email').isEmail(),
      body('password').isLength({ min: 6 })
    ];

    // Create mock request with invalid data
    const req = mockRequest({
      body: {
        email: 'invalid-email',
        password: 'short'
      }
    });
    
    const res = mockResponse();
    let nextCalled = false;
    let errorPassed = null;
    
    const next: NextFunction = (error?: any) => { 
      nextCalled = true; 
      errorPassed = error;
    };
    
    // Execute middleware
    const middleware = validateBody(validationRules);
    await middleware(req, res, next);
    
    // Verify error was passed to next
    assert(nextCalled, 'Next function should be called with error');
    assert(errorPassed instanceof HttpError, 'Error should be an instance of HttpError');
    assert.strictEqual(errorPassed.statusCode, 400, 'Status code should be 400 Bad Request');
    assert(Array.isArray(errorPassed.details), 'Error details should be an array');
    assert(errorPassed.details.length === 2, 'Should have 2 validation errors');

    // Ensure error messages correspond to our validation failures
    const emailError = errorPassed.details.find((d: any) => d.path === 'email');
    const passwordError = errorPassed.details.find((d: any) => d.path === 'password');
    
    assert(emailError, 'Should contain email validation error');
    assert(passwordError, 'Should contain password validation error');
    
    console.log('✅ Test 2: Invalid body data - PASSED');
    succeeded++;
  } catch (error) {
    console.error('❌ Test 2: Invalid body data - FAILED', error);
    failed++;
  }

  // Test 3: validateParams passes with valid data
  try {
    // Mock validation rules
    const validationRules = [
      param('id').isInt()
    ];

    // Create mock request with valid params
    const req = mockRequest({
      params: {
        id: '123'
      }
    });
    
    const res = mockResponse();
    let nextCalled = false;
    let errorPassed = null;
    
    const next: NextFunction = (error?: any) => { 
      nextCalled = true; 
      errorPassed = error;
    };
    
    // Execute middleware
    const middleware = validateParams(validationRules);
    await middleware(req, res, next);
    
    // Verify next was called with no error
    assert(nextCalled, 'Next function should be called for valid params');
    assert(!errorPassed, 'No error should be passed to next');
    
    console.log('✅ Test 3: Valid params data - PASSED');
    succeeded++;
  } catch (error) {
    console.error('❌ Test 3: Valid params data - FAILED', error);
    failed++;
  }

  // Test 4: validateParams fails with invalid data
  try {
    // Mock validation rules
    const validationRules = [
      param('id').isInt()
    ];

    // Create mock request with invalid params
    const req = mockRequest({
      params: {
        id: 'abc' // Not a number
      }
    });
    
    const res = mockResponse();
    let nextCalled = false;
    let errorPassed = null;
    
    const next: NextFunction = (error?: any) => { 
      nextCalled = true; 
      errorPassed = error;
    };
    
    // Execute middleware
    const middleware = validateParams(validationRules);
    await middleware(req, res, next);
    
    // Verify error was passed to next
    assert(nextCalled, 'Next function should be called with error');
    assert(errorPassed instanceof HttpError, 'Error should be an instance of HttpError');
    assert.strictEqual(errorPassed.statusCode, 400, 'Status code should be 400 Bad Request');
    assert(Array.isArray(errorPassed.details), 'Error details should be an array');
    assert(errorPassed.details.length === 1, 'Should have 1 validation error');

    // Ensure error message corresponds to our validation failure
    const idError = errorPassed.details.find((d: any) => d.path === 'id');
    assert(idError, 'Should contain id validation error');
    
    console.log('✅ Test 4: Invalid params data - PASSED');
    succeeded++;
  } catch (error) {
    console.error('❌ Test 4: Invalid params data - FAILED', error);
    failed++;
  }

  // Print test summary
  console.log('\n=== Validation Middleware Test Results ===');
  console.log(`Total: ${total}, Passed: ${succeeded}, Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('✅ All validation middleware tests passed!');
    return true;
  } else {
    console.log('❌ Some validation middleware tests failed');
    return false;
  }
}

// Use the same mock request/response utility functions from the existing tests
function mockRequest(options: any = {}): Request {
  return {
    headers: options.headers || {},
    body: options.body || {},
    params: options.params || {},
    query: options.query || {}
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
    console.error('Error running validation middleware tests:', error);
    process.exit(1);
  });
}

export { runTests }; 
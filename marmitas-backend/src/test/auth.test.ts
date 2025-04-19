import { verifyToken } from '../middleware/auth.middleware.js';
import { Request, Response, NextFunction } from 'express';
import assert from 'assert';
import jwt from 'jsonwebtoken';

/**
 * Test suite for authentication middleware
 * 
 * These tests verify that the authentication middleware correctly validates JWT tokens
 * and handles various authentication scenarios appropriately.
 */

async function runTests() {
  console.log('=== Running Authentication Tests ===');
  let succeeded = 0;
  let failed = 0;
  const total = 5;

  // Save original environment variable
  const originalSecret = process.env.JWT_SECRET;
  // Set test JWT secret
  process.env.JWT_SECRET = 'test-secret-key';

  // Test 1: Valid token
  try {
    // Create a valid token
    const validPayload = { id: 123, email: 'user@example.com', role: 'user' };
    const validToken = jwt.sign(validPayload, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    // Create mock objects
    const req = mockRequest();
    req.headers.authorization = `Bearer ${validToken}`;
    const res = mockResponse();
    let nextCalled = false;
    const next: NextFunction = () => { nextCalled = true; };
    
    // Execute middleware
    await verifyToken(req, res, next);
    
    // Verify user was set on request and next was called
    assert(nextCalled, 'Next function should be called for valid token');
    assert.deepStrictEqual(req.user, validPayload, 'User payload should be attached to request');
    
    console.log('✅ Test 1: Valid token - PASSED');
    succeeded++;
  } catch (error) {
    console.error('❌ Test 1: Valid token - FAILED', error);
    failed++;
  }

  // Test 2: Missing token
  try {
    // Create mock objects with no authorization header
    const req = mockRequest();
    const res = mockResponse();
    let nextCalled = false;
    const next: NextFunction = (error?: any) => { 
      nextCalled = true; 
      if (error) throw error;
    };
    
    // Execute middleware
    try {
      await verifyToken(req, res, next);
      throw new Error('Should have thrown an error for missing token');
    } catch (err: any) {
      // Verify correct error response
      assert.strictEqual(err.message, 'No token provided', 'Should return appropriate error message');
      assert.strictEqual(err.statusCode, 401, 'Should return 401 Unauthorized status');
    }
    
    console.log('✅ Test 2: Missing token - PASSED');
    succeeded++;
  } catch (error) {
    console.error('❌ Test 2: Missing token - FAILED', error);
    failed++;
  }

  // Test 3: Invalid token format
  try {
    // Create mock objects with malformed token
    const req = mockRequest();
    req.headers.authorization = 'InvalidTokenFormat';
    const res = mockResponse();
    let nextCalled = false;
    const next: NextFunction = (error?: any) => { 
      nextCalled = true; 
      if (error) throw error;
    };
    
    // Execute middleware
    try {
      await verifyToken(req, res, next);
      throw new Error('Should have thrown an error for invalid token format');
    } catch (err: any) {
      // Verify correct error response
      assert.strictEqual(err.message, 'Invalid token format', 'Should return appropriate error message');
      assert.strictEqual(err.statusCode, 401, 'Should return 401 Unauthorized status');
    }
    
    console.log('✅ Test 3: Invalid token format - PASSED');
    succeeded++;
  } catch (error) {
    console.error('❌ Test 3: Invalid token format - FAILED', error);
    failed++;
  }

  // Test 4: Expired token
  try {
    // Create an expired token
    const expiredPayload = { id: 456, email: 'expired@example.com', role: 'user' };
    const expiredToken = jwt.sign(expiredPayload, process.env.JWT_SECRET, { expiresIn: '0s' });
    
    // Wait to ensure token is expired
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create mock objects
    const req = mockRequest();
    req.headers.authorization = `Bearer ${expiredToken}`;
    const res = mockResponse();
    let nextCalled = false;
    const next: NextFunction = (error?: any) => { 
      nextCalled = true; 
      if (error) throw error;
    };
    
    // Execute middleware
    try {
      await verifyToken(req, res, next);
      throw new Error('Should have thrown an error for expired token');
    } catch (err: any) {
      // Verify correct error response
      assert(err.message.includes('jwt expired'), 'Should detect expired token');
      assert.strictEqual(err.statusCode, 401, 'Should return 401 Unauthorized status');
    }
    
    console.log('✅ Test 4: Expired token - PASSED');
    succeeded++;
  } catch (error) {
    console.error('❌ Test 4: Expired token - FAILED', error);
    failed++;
  }

  // Test 5: Token with invalid signature
  try {
    // Create token with wrong signature
    const payload = { id: 789, email: 'tampered@example.com', role: 'user' };
    const tamperedToken = jwt.sign(payload, 'wrong-secret-key', { expiresIn: '1h' });
    
    // Create mock objects
    const req = mockRequest();
    req.headers.authorization = `Bearer ${tamperedToken}`;
    const res = mockResponse();
    let nextCalled = false;
    const next: NextFunction = (error?: any) => { 
      nextCalled = true; 
      if (error) throw error;
    };
    
    // Execute middleware
    try {
      await verifyToken(req, res, next);
      throw new Error('Should have thrown an error for invalid signature');
    } catch (err: any) {
      // Verify correct error response
      assert(err.message.includes('invalid signature'), 'Should detect invalid token signature');
      assert.strictEqual(err.statusCode, 401, 'Should return 401 Unauthorized status');
    }
    
    console.log('✅ Test 5: Invalid signature - PASSED');
    succeeded++;
  } catch (error) {
    console.error('❌ Test 5: Invalid signature - FAILED', error);
    failed++;
  }

  // Restore original environment
  process.env.JWT_SECRET = originalSecret;

  // Print test summary
  console.log('\n=== Authentication Test Results ===');
  console.log(`Total: ${total}, Passed: ${succeeded}, Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('✅ All authentication tests passed!');
    return true;
  } else {
    console.log('❌ Some authentication tests failed');
    return false;
  }
}

// Utility functions to create mock request and response objects
function mockRequest(): any {
  const req: any = {
    headers: {},
    body: {},
    params: {},
    query: {}
  };
  return req;
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
    console.error('Error running authentication tests:', error);
    process.exit(1);
  });
}

export { runTests }; 
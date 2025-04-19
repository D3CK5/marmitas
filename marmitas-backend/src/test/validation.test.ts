import { validate } from '../middleware/validation.middleware.js';
import { Request, Response, NextFunction } from 'express';
import assert from 'assert';
import { body, param, query } from 'express-validator';
import { validateBody, validateParams } from '../middleware/validation.middleware.js';
import { HttpError } from '../utils/errors.js';

/**
 * Test suite for API input validation
 * 
 * These tests verify that input validation correctly accepts valid inputs
 * and rejects invalid ones according to the validation rules.
 */

async function runTests() {
  console.log('=== Running Input Validation Tests ===');
  let succeeded = 0;
  let failed = 0;
  const total = 5;

  // Test 1: Email validation
  try {
    // Create a mock express middleware chain for email validation
    const emailValidation = [
      body('email').isEmail().withMessage('Invalid email format'),
      validate
    ];
    
    // Valid email test
    const validReq = mockRequest({ body: { email: 'test@example.com' } });
    const validRes = mockResponse();
    let nextCalled = false;
    const validNext = () => { nextCalled = true; };
    
    // Run the validation middleware chain
    for (const middleware of emailValidation) {
      await middleware(validReq, validRes, validNext);
    }
    
    assert(nextCalled, 'Next should be called for valid email');
    assert(!validRes.statusCode, 'No error status should be set for valid input');
    
    // Invalid email test
    const invalidReq = mockRequest({ body: { email: 'not-an-email' } });
    const invalidRes = mockResponse();
    nextCalled = false;
    const invalidNext = () => { nextCalled = true; };
    
    // Run the validation middleware chain
    for (const middleware of emailValidation) {
      await middleware(invalidReq, invalidRes, invalidNext);
      if (invalidRes.statusCode) break; // Stop chain if error returned
    }
    
    assert(!nextCalled, 'Next should not be called for invalid email');
    assert.strictEqual(invalidRes.statusCode, 400, 'Should return 400 Bad Request for invalid input');
    assert(invalidRes.jsonData.errors.some((err: any) => 
      err.path === 'email' && err.msg === 'Invalid email format'
    ), 'Should return appropriate error message');
    
    console.log('✅ Test 1: Email validation - PASSED');
    succeeded++;
  } catch (error) {
    console.error('❌ Test 1: Email validation - FAILED', error);
    failed++;
  }

  // Test 2: Password strength validation
  try {
    // Create validation chain for password
    const passwordValidation = [
      body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/[A-Z]/).withMessage('Password must contain uppercase letter')
        .matches(/[a-z]/).withMessage('Password must contain lowercase letter')
        .matches(/[0-9]/).withMessage('Password must contain a number')
        .matches(/[^A-Za-z0-9]/).withMessage('Password must contain a special character'),
      validate
    ];
    
    // Valid password test
    const validReq = mockRequest({ body: { password: 'StrongP@ss123' } });
    const validRes = mockResponse();
    let nextCalled = false;
    const validNext = () => { nextCalled = true; };
    
    // Run middleware chain
    for (const middleware of passwordValidation) {
      await middleware(validReq, validRes, validNext);
    }
    
    assert(nextCalled, 'Next should be called for valid password');
    
    // Test too short password
    const shortReq = mockRequest({ body: { password: 'Abc@1' } });
    const shortRes = mockResponse();
    nextCalled = false;
    const shortNext = () => { nextCalled = true; };
    
    for (const middleware of passwordValidation) {
      await middleware(shortReq, shortRes, shortNext);
      if (shortRes.statusCode) break;
    }
    
    assert(!nextCalled, 'Next should not be called for short password');
    assert.strictEqual(shortRes.statusCode, 400, 'Should return 400 for short password');
    assert(shortRes.jsonData.errors.some((err: any) => 
      err.path === 'password' && err.msg === 'Password must be at least 8 characters'
    ), 'Should return appropriate error message for short password');
    
    // Test password without special char
    const noSpecialReq = mockRequest({ body: { password: 'AbcDef123' } });
    const noSpecialRes = mockResponse();
    nextCalled = false;
    const noSpecialNext = () => { nextCalled = true; };
    
    for (const middleware of passwordValidation) {
      await middleware(noSpecialReq, noSpecialRes, noSpecialNext);
      if (noSpecialRes.statusCode) break;
    }
    
    assert(!nextCalled, 'Next should not be called for password without special character');
    assert.strictEqual(noSpecialRes.statusCode, 400, 'Should return 400 for password without special char');
    assert(noSpecialRes.jsonData.errors.some((err: any) => 
      err.path === 'password' && err.msg === 'Password must contain a special character'
    ), 'Should return appropriate error message for missing special character');
    
    console.log('✅ Test 2: Password strength validation - PASSED');
    succeeded++;
  } catch (error) {
    console.error('❌ Test 2: Password strength validation - FAILED', error);
    failed++;
  }

  // Test 3: Numeric parameter validation
  try {
    // Create validation chain for numeric ID
    const idValidation = [
      param('id').isInt().withMessage('ID must be an integer'),
      validate
    ];
    
    // Valid ID test
    const validReq = mockRequest({ params: { id: '123' } });
    const validRes = mockResponse();
    let nextCalled = false;
    const validNext = () => { nextCalled = true; };
    
    for (const middleware of idValidation) {
      await middleware(validReq, validRes, validNext);
    }
    
    assert(nextCalled, 'Next should be called for valid ID');
    
    // Invalid ID test
    const invalidReq = mockRequest({ params: { id: 'abc' } });
    const invalidRes = mockResponse();
    nextCalled = false;
    const invalidNext = () => { nextCalled = true; };
    
    for (const middleware of idValidation) {
      await middleware(invalidReq, invalidRes, invalidNext);
      if (invalidRes.statusCode) break;
    }
    
    assert(!nextCalled, 'Next should not be called for non-numeric ID');
    assert.strictEqual(invalidRes.statusCode, 400, 'Should return 400 Bad Request for non-numeric ID');
    
    console.log('✅ Test 3: Numeric parameter validation - PASSED');
    succeeded++;
  } catch (error) {
    console.error('❌ Test 3: Numeric parameter validation - FAILED', error);
    failed++;
  }

  // Test 4: Query parameter validation
  try {
    // Create validation for pagination parameters
    const paginationValidation = [
      query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
      validate
    ];
    
    // Valid pagination test
    const validReq = mockRequest({ query: { page: '2', limit: '20' } });
    const validRes = mockResponse();
    let nextCalled = false;
    const validNext = () => { nextCalled = true; };
    
    for (const middleware of paginationValidation) {
      await middleware(validReq, validRes, validNext);
    }
    
    assert(nextCalled, 'Next should be called for valid pagination params');
    
    // Invalid pagination test - negative page
    const invalidReq = mockRequest({ query: { page: '-1', limit: '20' } });
    const invalidRes = mockResponse();
    nextCalled = false;
    const invalidNext = () => { nextCalled = true; };
    
    for (const middleware of paginationValidation) {
      await middleware(invalidReq, invalidRes, invalidNext);
      if (invalidRes.statusCode) break;
    }
    
    assert(!nextCalled, 'Next should not be called for negative page number');
    assert.strictEqual(invalidRes.statusCode, 400, 'Should return 400 for negative page');
    
    // Invalid pagination test - excessive limit
    const excessiveReq = mockRequest({ query: { page: '1', limit: '500' } });
    const excessiveRes = mockResponse();
    nextCalled = false;
    const excessiveNext = () => { nextCalled = true; };
    
    for (const middleware of paginationValidation) {
      await middleware(excessiveReq, excessiveRes, excessiveNext);
      if (excessiveRes.statusCode) break;
    }
    
    assert(!nextCalled, 'Next should not be called for excessive limit');
    assert.strictEqual(excessiveRes.statusCode, 400, 'Should return 400 for excessive limit');
    
    console.log('✅ Test 4: Query parameter validation - PASSED');
    succeeded++;
  } catch (error) {
    console.error('❌ Test 4: Query parameter validation - FAILED', error);
    failed++;
  }

  // Test 5: Required fields validation
  try {
    // Create validation for required fields in user creation
    const userValidation = [
      body('name').notEmpty().withMessage('Name is required'),
      body('email').isEmail().withMessage('Valid email is required'),
      body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
      validate
    ];
    
    // Valid user test with all fields
    const validReq = mockRequest({ 
      body: { 
        name: 'John Doe', 
        email: 'john@example.com',
        phone: '+1234567890'
      } 
    });
    const validRes = mockResponse();
    let nextCalled = false;
    const validNext = () => { nextCalled = true; };
    
    for (const middleware of userValidation) {
      await middleware(validReq, validRes, validNext);
    }
    
    assert(nextCalled, 'Next should be called for valid user data');
    
    // Valid user test with only required fields
    const requiredOnlyReq = mockRequest({ 
      body: { 
        name: 'Jane Doe', 
        email: 'jane@example.com'
      } 
    });
    const requiredOnlyRes = mockResponse();
    nextCalled = false;
    const requiredOnlyNext = () => { nextCalled = true; };
    
    for (const middleware of userValidation) {
      await middleware(requiredOnlyReq, requiredOnlyRes, requiredOnlyNext);
    }
    
    assert(nextCalled, 'Next should be called when only required fields are provided');
    
    // Invalid user test - missing name
    const missingNameReq = mockRequest({ 
      body: { 
        email: 'missing@example.com',
        phone: '+1234567890'
      } 
    });
    const missingNameRes = mockResponse();
    nextCalled = false;
    const missingNameNext = () => { nextCalled = true; };
    
    for (const middleware of userValidation) {
      await middleware(missingNameReq, missingNameRes, missingNameNext);
      if (missingNameRes.statusCode) break;
    }
    
    assert(!nextCalled, 'Next should not be called when required name is missing');
    assert.strictEqual(missingNameRes.statusCode, 400, 'Should return 400 for missing name');
    
    // Invalid user test - invalid optional field
    const invalidPhoneReq = mockRequest({ 
      body: { 
        name: 'Bad Phone',
        email: 'bad@example.com',
        phone: 'not-a-phone'
      } 
    });
    const invalidPhoneRes = mockResponse();
    nextCalled = false;
    const invalidPhoneNext = () => { nextCalled = true; };
    
    for (const middleware of userValidation) {
      await middleware(invalidPhoneReq, invalidPhoneRes, invalidPhoneNext);
      if (invalidPhoneRes.statusCode) break;
    }
    
    assert(!nextCalled, 'Next should not be called when optional field is invalid');
    assert.strictEqual(invalidPhoneRes.statusCode, 400, 'Should return 400 for invalid phone');
    
    console.log('✅ Test 5: Required fields validation - PASSED');
    succeeded++;
  } catch (error) {
    console.error('❌ Test 5: Required fields validation - FAILED', error);
    failed++;
  }

  // Print test summary
  console.log('\n=== Validation Test Results ===');
  console.log(`Total: ${total}, Passed: ${succeeded}, Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('✅ All validation tests passed!');
    return true;
  } else {
    console.log('❌ Some validation tests failed');
    return false;
  }
}

// Utility functions to create mock request and response objects
function mockRequest(options: any = {}): Request {
  return {
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
    console.error('Error running validation tests:', error);
    process.exit(1);
  });
}

export { runTests }; 
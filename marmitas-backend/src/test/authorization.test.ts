import { authorizationService } from '../services/authorization.service.js';
import { Request, Response, NextFunction } from 'express';
import assert from 'assert';

/**
 * Test suite for data access control implementation
 * 
 * These tests verify that access control, role-based authorization,
 * and permission filtering work correctly.
 */

async function runTests() {
  console.log('=== Running Authorization Tests ===');
  let succeeded = 0;
  let failed = 0;
  const total = 5;

  // Test 1: User role permissions
  try {
    // Check default permissions for USER role
    const userPermissions = authorizationService.getPermissionsForRole('USER');
    
    // User should be able to read their own data but not write to most resources
    assert(userPermissions.includes('profile:read'), 'User should have profile:read permission');
    assert(userPermissions.includes('orders:read'), 'User should have orders:read permission');
    assert(userPermissions.includes('orders:create'), 'User should have orders:create permission');
    assert(!userPermissions.includes('users:list'), 'User should not have users:list permission');
    assert(!userPermissions.includes('orders:update:any'), 'User should not have orders:update:any permission');
    
    console.log('✅ Test 1: User role permissions - PASSED');
    succeeded++;
  } catch (error) {
    console.error('❌ Test 1: User role permissions - FAILED', error);
    failed++;
  }

  // Test 2: Admin role permissions
  try {
    // Check default permissions for ADMIN role
    const adminPermissions = authorizationService.getPermissionsForRole('ADMIN');
    
    // Admin should have extensive permissions
    assert(adminPermissions.includes('users:list'), 'Admin should have users:list permission');
    assert(adminPermissions.includes('users:create'), 'Admin should have users:create permission');
    assert(adminPermissions.includes('orders:read:any'), 'Admin should have orders:read:any permission');
    assert(adminPermissions.includes('orders:update:any'), 'Admin should have orders:update:any permission');
    assert(adminPermissions.includes('orders:delete:any'), 'Admin should have orders:delete:any permission');
    
    console.log('✅ Test 2: Admin role permissions - PASSED');
    succeeded++;
  } catch (error) {
    console.error('❌ Test 2: Admin role permissions - FAILED', error);
    failed++;
  }

  // Test 3: Permission checking
  try {
    // Check if a user with USER role has the permission
    const userHasPermission = authorizationService.hasPermission('USER', 'orders:create');
    assert(userHasPermission === true, 'User should have orders:create permission');
    
    // Check if a user doesn't have a permission
    const userLacksPermission = authorizationService.hasPermission('USER', 'users:delete');
    assert(userLacksPermission === false, 'User should not have users:delete permission');
    
    // Check if admin has all user permissions
    const userPermissions = authorizationService.getPermissionsForRole('USER');
    let adminHasAllUserPerms = true;
    
    for (const perm of userPermissions) {
      if (!authorizationService.hasPermission('ADMIN', perm)) {
        adminHasAllUserPerms = false;
        break;
      }
    }
    
    assert(adminHasAllUserPerms, 'Admin should have all permissions that a User has');
    
    console.log('✅ Test 3: Permission checking - PASSED');
    succeeded++;
  } catch (error) {
    console.error('❌ Test 3: Permission checking - FAILED', error);
    failed++;
  }

  // Test 4: Authorization middleware
  try {
    const { requirePermission } = await import('../middleware/authorization.middleware.js');
    
    // Mock request, response and next objects
    const mockReq = {
      user: { id: '123', role: 'USER' }
    } as Request;
    
    let nextCalled = false;
    const mockNext = (() => { nextCalled = true; }) as NextFunction;
    
    const mockRes = {
      status: (code: number) => ({
        json: (data: any) => {
          return { statusCode: code, data };
        }
      })
    } as Response;
    
    // Test with permission user has
    await requirePermission('profile:read')(mockReq, mockRes, mockNext);
    assert(nextCalled, 'Next should be called when user has permission');
    
    // Test with permission user doesn't have
    nextCalled = false;
    const mockResWithSend = {
      status: (code: number) => ({
        json: (data: any) => {
          assert(code === 403, 'Should return 403 Forbidden');
          return { statusCode: code, data };
        }
      })
    } as Response;
    
    try {
      await requirePermission('users:delete')(mockReq, mockResWithSend, mockNext);
    } catch (e) {
      // Expected to fail
    }
    
    assert(!nextCalled, 'Next should not be called when user lacks permission');
    
    console.log('✅ Test 4: Authorization middleware - PASSED');
    succeeded++;
  } catch (error) {
    console.error('❌ Test 4: Authorization middleware - FAILED', error);
    failed++;
  }

  // Test 5: Resource filtering
  try {
    // This tests data filtering based on ownership and permissions
    const mockUser = { id: '123', role: 'USER' };
    const mockOrders = [
      { id: '1', userId: '123', total: 100 }, // owned by user
      { id: '2', userId: '456', total: 200 }, // owned by someone else
      { id: '3', userId: '789', total: 300 }  // owned by someone else
    ];
    
    // Filter orders by ownership for a regular user
    const filteredOrders = authorizationService.filterResourcesByOwnership(
      mockOrders,
      'orders',
      mockUser,
      'userId'
    );
    
    assert(filteredOrders.length === 1, 'User should only see their own orders');
    assert(filteredOrders[0].id === '1', 'User should only see order with id=1');
    
    // Now test with an admin user
    const mockAdmin = { id: '999', role: 'ADMIN' };
    const adminFilteredOrders = authorizationService.filterResourcesByOwnership(
      mockOrders,
      'orders',
      mockAdmin,
      'userId'
    );
    
    assert(adminFilteredOrders.length === 3, 'Admin should see all orders');
    
    console.log('✅ Test 5: Resource filtering - PASSED');
    succeeded++;
  } catch (error) {
    console.error('❌ Test 5: Resource filtering - FAILED', error);
    failed++;
  }

  // Print test summary
  console.log('\n=== Authorization Test Results ===');
  console.log(`Total: ${total}, Passed: ${succeeded}, Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('✅ All authorization tests passed!');
    return true;
  } else {
    console.log('❌ Some authorization tests failed');
    return false;
  }
}

// Run tests directly if this file is executed
if (require.main === module) {
  runTests().then(passed => {
    if (!passed) {
      process.exit(1);
    }
  }).catch(error => {
    console.error('Error running authorization tests:', error);
    process.exit(1);
  });
}

export { runTests }; 
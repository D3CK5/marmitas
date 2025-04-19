import { logger } from '../utils/logger.utils.js';

/**
 * User role definitions
 */
export enum UserRole {
  ANONYMOUS = 'anonymous',
  USER = 'user',
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  SYSTEM = 'system'
}

/**
 * Permission definition
 */
export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'list' | 'manage';
  conditions?: object;
}

/**
 * Interface for permission conditions
 */
interface ConditionsType {
  owner?: boolean;
  [key: string]: any;
}

/**
 * Role-based authorization service
 * Manages permissions and access control
 */
export class AuthorizationService {
  private rolePermissions: Map<UserRole, Permission[]> = new Map();
  private initialized = false;

  constructor() {
    this.initializePermissions();
    this.initialized = true;
  }

  /**
   * Set up default role-based permissions
   */
  private initializePermissions(): void {
    // Anonymous role permissions (unauthenticated users)
    this.rolePermissions.set(UserRole.ANONYMOUS, [
      { resource: 'products', action: 'read' },
      { resource: 'products', action: 'list' },
      { resource: 'categories', action: 'read' },
      { resource: 'categories', action: 'list' },
      { resource: 'foods', action: 'read' },
      { resource: 'foods', action: 'list' }
    ]);

    // User role permissions (base authenticated users)
    this.rolePermissions.set(UserRole.USER, [
      ...this.rolePermissions.get(UserRole.ANONYMOUS) || [],
      { resource: 'profiles', action: 'read', conditions: { owner: true } },
      { resource: 'profiles', action: 'update', conditions: { owner: true } }
    ]);

    // Customer role permissions
    this.rolePermissions.set(UserRole.CUSTOMER, [
      ...this.rolePermissions.get(UserRole.USER) || [],
      { resource: 'orders', action: 'create' },
      { resource: 'orders', action: 'read', conditions: { owner: true } },
      { resource: 'orders', action: 'list', conditions: { owner: true } },
      { resource: 'user_addresses', action: 'create', conditions: { owner: true } },
      { resource: 'user_addresses', action: 'read', conditions: { owner: true } },
      { resource: 'user_addresses', action: 'update', conditions: { owner: true } },
      { resource: 'user_addresses', action: 'delete', conditions: { owner: true } },
      { resource: 'user_addresses', action: 'list', conditions: { owner: true } },
      { resource: 'payment_methods', action: 'create', conditions: { owner: true } },
      { resource: 'payment_methods', action: 'read', conditions: { owner: true } },
      { resource: 'payment_methods', action: 'update', conditions: { owner: true } },
      { resource: 'payment_methods', action: 'delete', conditions: { owner: true } },
      { resource: 'payment_methods', action: 'list', conditions: { owner: true } }
    ]);

    // Admin role permissions
    this.rolePermissions.set(UserRole.ADMIN, [
      { resource: 'profiles', action: 'manage' },
      { resource: 'products', action: 'manage' },
      { resource: 'categories', action: 'manage' },
      { resource: 'foods', action: 'manage' },
      { resource: 'orders', action: 'manage' },
      { resource: 'user_addresses', action: 'manage' },
      { resource: 'payment_methods', action: 'read' }, // Admin can only read payment methods, not see full details
      { resource: 'system_settings', action: 'manage' },
      { resource: 'delivery_areas', action: 'manage' }
    ]);

    // System role permissions (for system/service operations)
    this.rolePermissions.set(UserRole.SYSTEM, [
      { resource: '*', action: 'manage' } // System can do anything
    ]);

    logger.info('Authorization permissions initialized');
  }

  /**
   * Check if a user has permission to perform an action on a resource
   * @param userId User ID
   * @param userRole User role
   * @param resource Resource name
   * @param action Action to perform
   * @param resourceOwnerId Owner ID of the resource (for permission conditions)
   * @returns True if user has permission
   */
  hasPermission(
    userId: string | null, 
    userRole: UserRole, 
    resource: string, 
    action: string,
    resourceOwnerId?: string
  ): boolean {
    // If not initialized, deny all permissions
    if (!this.initialized) {
      logger.error('Authorization service not initialized');
      return false;
    }

    // Get permissions for the role
    const permissions = this.rolePermissions.get(userRole);
    if (!permissions) {
      logger.warn(`No permissions defined for role: ${userRole}`);
      return false;
    }

    // Check for a direct resource + action match
    const directMatch = permissions.find(p => 
      (p.resource === resource || p.resource === '*') && 
      (p.action === action || p.action === 'manage')
    );

    if (directMatch) {
      // If no conditions, permission is granted
      if (!directMatch.conditions) {
        return true;
      }
      
      // Check ownership condition
      if ((directMatch.conditions as ConditionsType).owner === true) {
        // If no userId (anonymous) or no resourceOwnerId, ownership can't be verified
        if (!userId || !resourceOwnerId) {
          return false;
        }
        
        // Check if user is the owner of the resource
        return userId === resourceOwnerId;
      }
      
      // Other conditions could be added here
      return true;
    }
    
    return false;
  }

  /**
   * Filter a list of records based on user permissions
   * @param userId User ID
   * @param userRole User role
   * @param resource Resource name
   * @param records Array of records to filter
   * @param ownerIdField Field name that contains the owner ID
   * @returns Filtered records
   */
  filterAccessibleRecords<T extends Record<string, any>>(
    userId: string | null,
    userRole: UserRole,
    resource: string,
    records: T[],
    ownerIdField: string = 'user_id'
  ): T[] {
    // Admin and system roles can access all records
    if (userRole === UserRole.ADMIN || userRole === UserRole.SYSTEM) {
      return records;
    }
    
    // For other roles, filter based on ownership
    return records.filter(record => {
      // Try to get the owner ID from the record
      const resourceOwnerId = record[ownerIdField]?.toString();
      
      // Check permission for each record
      return this.hasPermission(userId, userRole, resource, 'read', resourceOwnerId);
    });
  }

  /**
   * Check if user has admin permissions
   * @param userRole User role
   * @returns True if user has admin permissions
   */
  isAdmin(userRole: UserRole): boolean {
    return userRole === UserRole.ADMIN || userRole === UserRole.SYSTEM;
  }

  /**
   * Add custom permissions for a role
   * @param role User role
   * @param permissions Array of permissions
   */
  addPermissions(role: UserRole, permissions: Permission[]): void {
    const currentPermissions = this.rolePermissions.get(role) || [];
    this.rolePermissions.set(role, [...currentPermissions, ...permissions]);
    logger.info(`Added ${permissions.length} permissions to role: ${role}`);
  }

  /**
   * Get all permissions for a role
   * @param role User role
   * @returns Array of permissions
   */
  getPermissionsForRole(role: UserRole): Permission[] {
    return this.rolePermissions.get(role) || [];
  }
}

// Export singleton instance
export const authorizationService = new AuthorizationService(); 
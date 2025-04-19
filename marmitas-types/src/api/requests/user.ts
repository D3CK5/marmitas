/**
 * User API request type definitions
 */

/**
 * User registration request
 */
export interface RegisterUserRequest {
  /** User's email address */
  email: string;
  
  /** User's display name */
  name: string;
  
  /** User's password */
  password: string;
}

/**
 * User login request
 */
export interface LoginUserRequest {
  /** User's email address */
  email: string;
  
  /** User's password */
  password: string;
}

/**
 * Update user profile request
 */
export interface UpdateUserRequest {
  /** Optional user's display name */
  name?: string;
  
  /** Optional user's email address */
  email?: string;
  
  /** Optional user's avatar URL */
  avatarUrl?: string;
  
  /** Optional user's phone number */
  phone?: string;
}

/**
 * Change password request
 */
export interface ChangePasswordRequest {
  /** Current password */
  currentPassword: string;
  
  /** New password */
  newPassword: string;
} 
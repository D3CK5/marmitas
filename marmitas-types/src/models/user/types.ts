/**
 * User type definitions
 */
import { BaseEntity } from '../common';
import { UserRole } from '../common/enums';

/**
 * User interface representing a user in the system
 * This combines the frontend and backend user models
 */
export interface User extends BaseEntity {
  /** Unique identifier for the user */
  id: string;
  
  /** User's email address */
  email: string;
  
  /** User's display name */
  name: string;
  
  /** User's role in the system */
  role: UserRole;
  
  /** Optional URL to the user's avatar image */
  avatarUrl?: string;
}

/**
 * Profile interface representing extended user information
 */
export interface Profile extends User {
  /** Optional phone number */
  phone?: string;
  
  /** Whether the user has verified their email */
  emailVerified?: boolean;
  
  /** User preferences */
  preferences?: {
    /** Email notification preferences */
    emailNotifications?: boolean;
    
    /** Push notification preferences */
    pushNotifications?: boolean;
  };
}

/**
 * Authentication information
 */
export interface Auth {
  /** JWT token for the authenticated user */
  token: string;
  
  /** User information */
  user: User;
  
  /** Token expiration timestamp in milliseconds since epoch */
  expiresAt?: number;
} 
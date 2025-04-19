import supabase from '../config/supabase.js';
import { JwtService, TokenPayload } from './jwt.service.js';
import { logger } from '../utils/logger.utils.js';
import { databaseEncryptionService } from './database-encryption.service.js';
import { UserRole } from './authorization.service.js';
import bcrypt from 'bcrypt';
import { config } from '../config/app.config.js';

/**
 * Auth Service - Handles user authentication and profile management
 * with data protection measures
 */
export class AuthService {
  private jwtService: JwtService;
  
  constructor() {
    this.jwtService = new JwtService();
  }
  
  /**
   * Register a new user
   * @param userData User registration data
   * @returns User data and tokens
   */
  async register(userData: any): Promise<any> {
    try {
      // Validate input data
      if (!userData.email || !userData.password) {
        throw new Error('Email and password are required');
      }
      
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email)
        .single();
      
      if (existingUser) {
        throw new Error('User with this email already exists');
      }
      
      // Hash password
      const hashedPassword = await this.hashPassword(userData.password);
      
      // Create user in auth system
      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: hashedPassword
      });
      
      if (authError || !authUser.user) {
        throw new Error(authError?.message || 'Failed to create user');
      }
      
      // Prepare profile data with encryption for sensitive fields
      const profileData = {
        id: authUser.user.id,
        email: userData.email,
        name: userData.name || '',
        phone: userData.phone || '',
        role: UserRole.CUSTOMER
      };
      
      // Encrypt sensitive fields
      const encryptedProfileData = databaseEncryptionService.encryptRecord('profiles', profileData);
      
      // Insert profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert(encryptedProfileData)
        .select()
        .single();
      
      if (profileError) {
        logger.error('Error creating user profile', { error: profileError, userId: authUser.user.id });
        throw new Error('Failed to create user profile');
      }
      
      // Generate tokens
      const tokenPayload: TokenPayload = {
        userId: authUser.user.id,
        email: userData.email,
        role: UserRole.CUSTOMER
      };
      
      const { accessToken, refreshToken } = this.jwtService.generateTokens(tokenPayload);
      
      // Decrypt profile data for return
      const decryptedProfile = databaseEncryptionService.decryptRecord('profiles', profile);
      
      return {
        user: {
          id: authUser.user.id,
          email: userData.email,
          name: decryptedProfile.name,
          role: UserRole.CUSTOMER
        },
        accessToken,
        refreshToken
      };
    } catch (error) {
      logger.error('Registration error', { error });
      throw error;
    }
  }
  
  /**
   * Login a user
   * @param credentials Login credentials
   * @returns User data and tokens
   */
  async login(credentials: { email: string; password: string }): Promise<any> {
    try {
      // Validate input
      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }
      
      // Sign in with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });
      
      if (authError || !authData.user) {
        throw new Error('Invalid email or password');
      }
      
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      
      if (profileError || !profile) {
        throw new Error('User profile not found');
      }
      
      // Decrypt profile data
      const decryptedProfile = databaseEncryptionService.decryptRecord('profiles', profile);
      
      // Generate tokens
      const tokenPayload: TokenPayload = {
        userId: authData.user.id,
        email: credentials.email,
        role: decryptedProfile.role || UserRole.CUSTOMER
      };
      
      const { accessToken, refreshToken } = this.jwtService.generateTokens(tokenPayload);
      
      // Return user data and tokens
      return {
        user: {
          id: authData.user.id,
          email: credentials.email,
          name: decryptedProfile.name,
          role: decryptedProfile.role
        },
        accessToken,
        refreshToken
      };
    } catch (error) {
      logger.error('Login error', { error });
      throw error;
    }
  }
  
  /**
   * Refresh authentication tokens
   * @param refreshToken Current refresh token
   * @returns New access and refresh tokens
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
      // Verify refresh token
      const decoded = this.jwtService.verifyRefreshToken(refreshToken);
      
      if (!decoded) {
        return null;
      }
      
      // Check if user exists
      const { data: user, error } = await supabase
        .from('profiles')
        .select('email, role')
        .eq('id', decoded.userId)
        .single();
      
      if (error || !user) {
        return null;
      }
      
      // Generate new tokens
      const tokenPayload: TokenPayload = {
        userId: decoded.userId,
        email: user.email,
        role: user.role
      };
      
      return this.jwtService.generateTokens(tokenPayload);
    } catch (error) {
      logger.error('Token refresh error', { error });
      return null;
    }
  }
  
  /**
   * Logout user by invalidating refresh token
   * @param refreshToken Current refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      await this.jwtService.invalidateRefreshToken(refreshToken);
    } catch (error) {
      logger.error('Logout error', { error });
      throw error;
    }
  }
  
  /**
   * Logout user from all devices
   * @param userId User ID
   */
  async logoutAll(userId: string): Promise<void> {
    try {
      await this.jwtService.invalidateAllUserTokens(userId);
    } catch (error) {
      logger.error('Logout all error', { error });
      throw error;
    }
  }
  
  /**
   * Get user profile
   * @param userId User ID
   * @returns User profile data
   */
  async getProfile(userId: string): Promise<any> {
    try {
      // Get profile data
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error || !profile) {
        throw new Error('Profile not found');
      }
      
      // Decrypt sensitive fields
      const decryptedProfile = databaseEncryptionService.decryptRecord('profiles', profile);
      
      return {
        id: decryptedProfile.id,
        email: decryptedProfile.email,
        name: decryptedProfile.name,
        phone: decryptedProfile.phone,
        created_at: decryptedProfile.created_at,
        updated_at: decryptedProfile.updated_at
      };
    } catch (error) {
      logger.error('Get profile error', { error, userId });
      throw error;
    }
  }
  
  /**
   * Update user profile
   * @param userId User ID
   * @param profileData Profile data to update
   * @returns Updated profile
   */
  async updateProfile(userId: string, profileData: any): Promise<any> {
    try {
      // Remove fields that shouldn't be updated
      const { id, email, role, created_at, ...updatableData } = profileData;
      
      // Get current profile to know what to encrypt
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (fetchError || !currentProfile) {
        throw new Error('Profile not found');
      }
      
      // Encrypt sensitive fields
      const encryptedData = databaseEncryptionService.encryptRecord('profiles', updatableData);
      
      // Update profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .update(encryptedData)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) {
        throw new Error('Failed to update profile');
      }
      
      // Decrypt profile data
      const decryptedProfile = databaseEncryptionService.decryptRecord('profiles', profile);
      
      return {
        id: decryptedProfile.id,
        email: decryptedProfile.email,
        name: decryptedProfile.name,
        phone: decryptedProfile.phone,
        created_at: decryptedProfile.created_at,
        updated_at: decryptedProfile.updated_at
      };
    } catch (error) {
      logger.error('Update profile error', { error, userId });
      throw error;
    }
  }
  
  /**
   * Hash a password using bcrypt
   * @param password Plain text password
   * @returns Hashed password
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, config.security.bcryptSaltRounds);
  }
  
  /**
   * Verify a password against a hash
   * @param password Plain text password
   * @param hash Hashed password
   * @returns True if password matches
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

// Export a singleton instance
export const authService = new AuthService();
export default authService; 
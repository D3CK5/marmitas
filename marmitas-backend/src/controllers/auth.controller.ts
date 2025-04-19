import { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { apiResponse } from '../utils/api.utils.js';

/**
 * AuthController - Controller for authentication endpoints
 */
export class AuthController {
  /**
   * Register a new user
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.register(req.body);
      apiResponse.success(res, result, 201);
    } catch (error: any) {
      apiResponse.error(
        res,
        error.message || 'Registration failed',
        400,
        'REGISTRATION_ERROR'
      );
    }
  }

  /**
   * Login a user
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.login(req.body);
      apiResponse.success(res, result);
    } catch (error: any) {
      apiResponse.error(
        res,
        error.message || 'Authentication failed',
        401,
        'AUTH_ERROR'
      );
    }
  }

  /**
   * Logout a user
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.split(' ')[1] || '';
      await authService.logout(token);
      apiResponse.success(res, { message: 'Logged out successfully' });
    } catch (error: any) {
      apiResponse.error(
        res,
        error.message || 'Logout failed',
        500,
        'LOGOUT_ERROR'
      );
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        apiResponse.error(res, 'User not authenticated', 401, 'UNAUTHORIZED');
        return;
      }

      const profile = await authService.getProfile(req.user.id);
      apiResponse.success(res, profile);
    } catch (error: any) {
      apiResponse.error(
        res,
        error.message || 'Failed to retrieve profile',
        500,
        'PROFILE_ERROR'
      );
    }
  }

  /**
   * Update current user profile
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        apiResponse.error(res, 'User not authenticated', 401, 'UNAUTHORIZED');
        return;
      }

      const updatedProfile = await authService.updateProfile(req.user.id, req.body);
      apiResponse.success(res, updatedProfile);
    } catch (error: any) {
      apiResponse.error(
        res,
        error.message || 'Failed to update profile',
        400,
        'PROFILE_UPDATE_ERROR'
      );
    }
  }
}

// Export a singleton instance
export const authController = new AuthController();
export default authController; 
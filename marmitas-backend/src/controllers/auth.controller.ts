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
      
      // Set HTTP-only cookies for refresh token
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      // Return access token in response body
      apiResponse.success(res, {
        user: result.user,
        accessToken: result.accessToken
      }, 201);
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
      
      // Set HTTP-only cookies for refresh token
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      // Return access token in response body
      apiResponse.success(res, {
        user: result.user,
        accessToken: result.accessToken
      });
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
   * Refresh the access token
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      // Get refresh token from cookies
      const refreshToken = req.cookies.refreshToken;
      
      if (!refreshToken) {
        apiResponse.error(res, 'Refresh token not found', 401, 'INVALID_TOKEN');
        return;
      }
      
      // Get new tokens
      const tokens = await authService.refreshToken(refreshToken);
      
      if (!tokens) {
        // Clear the invalid cookie
        res.clearCookie('refreshToken');
        apiResponse.error(res, 'Invalid refresh token', 401, 'INVALID_TOKEN');
        return;
      }
      
      // Set HTTP-only cookies for new refresh token
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      // Return new access token
      apiResponse.success(res, { accessToken: tokens.accessToken });
    } catch (error: any) {
      apiResponse.error(
        res,
        error.message || 'Token refresh failed',
        401,
        'TOKEN_ERROR'
      );
    }
  }

  /**
   * Logout a user
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      // Get refresh token from cookies
      const refreshToken = req.cookies.refreshToken;
      
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      
      // Clear the refresh token cookie
      res.clearCookie('refreshToken');
      
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
   * Logout a user from all devices
   */
  async logoutAll(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        apiResponse.error(res, 'User not authenticated', 401, 'UNAUTHORIZED');
        return;
      }
      
      await authService.logoutAll(req.user.id);
      
      // Clear the refresh token cookie
      res.clearCookie('refreshToken');
      
      apiResponse.success(res, { message: 'Logged out from all devices' });
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
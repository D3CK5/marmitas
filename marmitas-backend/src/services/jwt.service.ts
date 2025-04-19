import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/app.config.js';
import { logger } from '../utils/logger.utils.js';

/**
 * Token payload structure
 */
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * JwtService - Service for handling JWT token operations
 * with enhanced security measures
 */
export class JwtService {
  // Secret keys
  private accessTokenSecret: string;
  private refreshTokenSecret: string;
  
  // Token expiration times
  private accessTokenExpiry: string;
  private refreshTokenExpiry: string;
  
  // Store for refresh tokens (in production, use Redis or similar)
  private refreshTokens: Map<string, { userId: string; expiresAt: number }> = new Map();
  
  constructor() {
    // Initialize from config or use secure defaults
    this.accessTokenSecret = config.jwt.accessTokenSecret || crypto.randomBytes(32).toString('hex');
    this.refreshTokenSecret = config.jwt.refreshTokenSecret || crypto.randomBytes(32).toString('hex');
    this.accessTokenExpiry = config.jwt.accessTokenExpiry || '15m';
    this.refreshTokenExpiry = config.jwt.refreshTokenExpiry || '7d';
    
    // Log warning if using default secrets in production
    if (process.env.NODE_ENV === 'production' && 
        (!config.jwt.accessTokenSecret || !config.jwt.refreshTokenSecret)) {
      logger.warn('WARNING: Using randomly generated JWT secrets in production. Tokens will be invalidated on server restart.');
    }
    
    // Start a periodic cleanup task for expired tokens
    setInterval(() => this.cleanupExpiredTokens(), 60 * 60 * 1000); // Run every hour
  }
  
  /**
   * Generate both access and refresh tokens
   * @param payload Token payload
   * @returns Access and refresh tokens
   */
  generateTokens(payload: TokenPayload): { accessToken: string; refreshToken: string } {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);
    
    return { accessToken, refreshToken };
  }
  
  /**
   * Generate access token
   * @param payload Token payload
   * @returns Access token
   */
  generateAccessToken(payload: TokenPayload): string {
    // Add a token ID (jti) to prevent token reuse
    const tokenId = crypto.randomBytes(8).toString('hex');
    
    return jwt.sign(
      { ...payload, jti: tokenId },
      this.accessTokenSecret,
      {
        expiresIn: this.accessTokenExpiry,
        algorithm: 'HS256' // Explicitly specify algorithm
      }
    );
  }
  
  /**
   * Generate refresh token
   * @param payload Token payload
   * @returns Refresh token
   */
  generateRefreshToken(payload: TokenPayload): string {
    // Create a unique token ID for tracking
    const tokenId = crypto.randomBytes(16).toString('hex');
    
    // Calculate expiration time
    const expiresIn = this.getExpiryTime(this.refreshTokenExpiry);
    const expiresAt = Date.now() + expiresIn;
    
    // Generate the token
    const refreshToken = jwt.sign(
      { ...payload, jti: tokenId, type: 'refresh' },
      this.refreshTokenSecret,
      {
        expiresIn: this.refreshTokenExpiry,
        algorithm: 'HS256' // Explicitly specify algorithm
      }
    );
    
    // Store refresh token with expiration
    this.refreshTokens.set(tokenId, {
      userId: payload.userId,
      expiresAt: expiresAt
    });
    
    logger.debug('Generated refresh token', { userId: payload.userId, tokenId });
    
    return refreshToken;
  }
  
  /**
   * Verify access token
   * @param token Access token to verify
   * @returns Decoded token payload or null if invalid
   */
  verifyAccessToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        algorithms: ['HS256'] // Only accept HS256 algorithm
      }) as TokenPayload & { jti: string };
      
      return decoded;
    } catch (error) {
      logger.debug('Access token verification failed', { error: (error as Error).message });
      return null;
    }
  }
  
  /**
   * Verify refresh token
   * @param token Refresh token to verify
   * @returns Decoded token payload or null if invalid
   */
  verifyRefreshToken(token: string): TokenPayload | null {
    try {
      // Verify JWT signature and expiration
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        algorithms: ['HS256'] // Only accept HS256 algorithm
      }) as TokenPayload & { jti: string; type: string };
      
      // Verify it's a refresh token
      if (decoded.type !== 'refresh') {
        logger.warn('Token is not a refresh token', { userId: decoded.userId });
        return null;
      }
      
      // Check if token exists in store
      const storedToken = this.refreshTokens.get(decoded.jti);
      if (!storedToken) {
        logger.debug('Refresh token not found in token store', { jti: decoded.jti });
        return null;
      }
      
      // Check if token is expired
      if (storedToken.expiresAt < Date.now()) {
        this.refreshTokens.delete(decoded.jti);
        logger.debug('Refresh token expired', { jti: decoded.jti });
        return null;
      }
      
      // Verify user ID matches the stored token
      if (storedToken.userId !== decoded.userId) {
        logger.warn('User ID mismatch in token', { 
          tokenUserId: decoded.userId, 
          storedUserId: storedToken.userId 
        });
        return null;
      }
      
      return decoded;
    } catch (error) {
      logger.debug('Refresh token verification failed', { error: (error as Error).message });
      return null;
    }
  }
  
  /**
   * Refresh the access token using a refresh token
   * @param refreshToken Refresh token
   * @returns New tokens or null if refresh token is invalid
   */
  refreshAccessToken(refreshToken: string): { accessToken: string; refreshToken: string } | null {
    try {
      // Verify refresh token
      const decoded = jwt.decode(refreshToken) as TokenPayload & { jti: string };
      if (!decoded || !decoded.jti) {
        logger.debug('Invalid refresh token format');
        return null;
      }
      
      const payload = this.verifyRefreshToken(refreshToken);
      if (!payload) {
        logger.debug('Refresh token verification failed');
        return null;
      }
      
      // Invalidate the old refresh token (one-time use)
      this.refreshTokens.delete(decoded.jti);
      
      // Generate new tokens
      const newAccessToken = this.generateAccessToken(payload);
      const newRefreshToken = this.generateRefreshToken(payload);
      
      logger.debug('Refreshed tokens', { userId: payload.userId });
      
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      logger.error('Token refresh error', { error });
      return null;
    }
  }
  
  /**
   * Invalidate a refresh token
   * @param token Refresh token to invalidate
   */
  invalidateRefreshToken(token: string): void {
    try {
      const decoded = jwt.decode(token) as TokenPayload & { jti: string };
      if (decoded && decoded.jti) {
        this.refreshTokens.delete(decoded.jti);
        logger.debug('Invalidated refresh token', { userId: decoded.userId, jti: decoded.jti });
      }
    } catch (error) {
      logger.error('Error invalidating refresh token', { error });
    }
  }
  
  /**
   * Invalidate all refresh tokens for a user
   * @param userId User ID
   */
  invalidateAllUserTokens(userId: string): void {
    try {
      let count = 0;
      for (const [tokenId, data] of this.refreshTokens.entries()) {
        if (data.userId === userId) {
          this.refreshTokens.delete(tokenId);
          count++;
        }
      }
      
      logger.debug('Invalidated all user tokens', { userId, count });
    } catch (error) {
      logger.error('Error invalidating all user tokens', { error, userId });
      throw error;
    }
  }
  
  /**
   * Clean up expired refresh tokens
   */
  cleanupExpiredTokens(): void {
    try {
      const now = Date.now();
      let count = 0;
      
      for (const [tokenId, data] of this.refreshTokens.entries()) {
        if (data.expiresAt < now) {
          this.refreshTokens.delete(tokenId);
          count++;
        }
      }
      
      if (count > 0) {
        logger.debug('Cleaned up expired tokens', { count });
      }
    } catch (error) {
      logger.error('Error cleaning up expired tokens', { error });
    }
  }
  
  /**
   * Convert expiry string (like '7d', '15m') to milliseconds
   */
  private getExpiryTime(expiry: string): number {
    const unit = expiry.charAt(expiry.length - 1);
    const value = parseInt(expiry.slice(0, -1));
    
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      case 'w': return value * 7 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000; // Default to 1 day if format is not recognized
    }
  }
}

// Export a singleton instance
export const jwtService = new JwtService();
export default jwtService; 
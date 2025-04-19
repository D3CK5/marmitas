import { User } from '../types/api.types.js';
/**
 * AuthService - Service for handling authentication operations
 */
export declare class AuthService {
    /**
     * Register a new user
     * @param userData User registration data
     * @returns User object and session token
     */
    register(userData: User.CreateRequest): Promise<{
        user: User.Response;
        token: string;
    }>;
    /**
     * Login a user
     * @param credentials User login credentials
     * @returns User object and session token
     */
    login(credentials: {
        email: string;
        password: string;
    }): Promise<{
        user: User.Response;
        token: string;
    }>;
    /**
     * Logout a user
     * @param token The session token to invalidate
     * @returns Success indicator
     */
    logout(token: string): Promise<boolean>;
    /**
     * Get current user profile
     * @param userId User ID
     * @returns User profile
     */
    getProfile(userId: string): Promise<User.Response>;
    /**
     * Update user profile
     * @param userId User ID
     * @param userData User data to update
     * @returns Updated user profile
     */
    updateProfile(userId: string, userData: User.UpdateRequest): Promise<User.Response>;
}
export declare const authService: AuthService;
export default authService;
//# sourceMappingURL=auth.service.d.ts.map
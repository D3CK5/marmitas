import { Request, Response } from 'express';
/**
 * AuthController - Controller for authentication endpoints
 */
export declare class AuthController {
    /**
     * Register a new user
     */
    register(req: Request, res: Response): Promise<void>;
    /**
     * Login a user
     */
    login(req: Request, res: Response): Promise<void>;
    /**
     * Logout a user
     */
    logout(req: Request, res: Response): Promise<void>;
    /**
     * Get current user profile
     */
    getProfile(req: Request, res: Response): Promise<void>;
    /**
     * Update current user profile
     */
    updateProfile(req: Request, res: Response): Promise<void>;
}
export declare const authController: AuthController;
export default authController;
//# sourceMappingURL=auth.controller.d.ts.map
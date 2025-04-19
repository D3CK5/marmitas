import { Request, Response, NextFunction } from 'express';
/**
 * Extend Express Request type to include user information
 */
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: string;
            };
        }
    }
}
/**
 * Middleware to authenticate requests using JWT token
 */
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to check if user has required role
 */
export declare const authorize: (roles: string | string[]) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map
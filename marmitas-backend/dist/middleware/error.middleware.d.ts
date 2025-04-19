import { Request, Response, NextFunction } from 'express';
/**
 * Error handler middleware
 *
 * This middleware catches all unhandled errors in the application
 * and formats them as a standardized API response.
 */
export declare const errorHandler: (err: Error, req: Request, res: Response, next: NextFunction) => void;
/**
 * Not found handler middleware
 *
 * This middleware catches all requests to non-existent routes
 * and returns a standardized 404 response.
 */
export declare const notFoundHandler: (req: Request, res: Response) => void;
//# sourceMappingURL=error.middleware.d.ts.map
import { apiResponse } from '../utils/api.utils.js';
/**
 * Error handler middleware
 *
 * This middleware catches all unhandled errors in the application
 * and formats them as a standardized API response.
 */
export const errorHandler = (err, req, res, next) => {
    // Log the error for debugging
    console.error('Unhandled error:', err);
    // Return a standardized error response
    apiResponse.error(res, err.message || 'An unexpected error occurred', 500, 'SERVER_ERROR', process.env.NODE_ENV === 'development' ? { stack: err.stack } : undefined);
};
/**
 * Not found handler middleware
 *
 * This middleware catches all requests to non-existent routes
 * and returns a standardized 404 response.
 */
export const notFoundHandler = (req, res) => {
    apiResponse.error(res, `Route not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND');
};
//# sourceMappingURL=error.middleware.js.map
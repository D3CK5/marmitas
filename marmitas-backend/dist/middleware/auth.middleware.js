import { supabase } from '../config/supabase.js';
import { apiResponse } from '../utils/api.utils.js';
/**
 * Middleware to authenticate requests using JWT token
 */
export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            apiResponse.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
            return;
        }
        const token = authHeader.split(' ')[1];
        // Verify the token
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data.user) {
            apiResponse.error(res, 'Invalid or expired token', 401, 'INVALID_TOKEN');
            return;
        }
        // Attach user to request
        req.user = {
            id: data.user.id,
            email: data.user.email,
            role: data.user.app_metadata.role || 'user'
        };
        next();
    }
    catch (error) {
        apiResponse.error(res, 'Authentication failed', 500, 'AUTH_ERROR');
    }
};
/**
 * Middleware to check if user has required role
 */
export const authorize = (roles) => {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    return (req, res, next) => {
        if (!req.user) {
            apiResponse.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            apiResponse.error(res, 'Insufficient permissions', 403, 'FORBIDDEN');
            return;
        }
        next();
    };
};
//# sourceMappingURL=auth.middleware.js.map
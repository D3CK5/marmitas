/**
 * API response utilities for standardizing response formats
 */
export const apiResponse = {
    /**
     * Send a success response
     */
    success(res, data, statusCode = 200) {
        const response = {
            data,
            status: 'success',
            timestamp: new Date().toISOString()
        };
        res.status(statusCode).json(response);
    },
    /**
     * Send an error response
     */
    error(res, message, statusCode = 500, code, details) {
        const response = {
            error: {
                message,
                code: code || undefined,
                details: details || undefined
            },
            status: 'error',
            timestamp: new Date().toISOString()
        };
        res.status(statusCode).json(response);
    },
    /**
     * Send a paginated response
     */
    paginated(res, data, total, params) {
        const page = params.page || 1;
        const pageSize = params.pageSize || 10;
        const totalPages = Math.ceil(total / pageSize);
        const response = {
            data,
            pagination: {
                total,
                page,
                pageSize,
                totalPages
            },
            status: 'success',
            timestamp: new Date().toISOString()
        };
        res.status(200).json(response);
    }
};
/**
 * Parse pagination parameters from request query
 */
export const parsePaginationParams = (query) => {
    return {
        page: query.page ? parseInt(query.page) : 1,
        pageSize: query.pageSize ? parseInt(query.pageSize) : 10,
        sort: query.sort || 'createdAt',
        direction: query.direction || 'desc'
    };
};
/**
 * Calculate offset from pagination parameters
 */
export const calculateOffset = (page, pageSize) => {
    return (page - 1) * pageSize;
};
//# sourceMappingURL=api.utils.js.map
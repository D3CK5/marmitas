import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { apiResponse } from '../utils/api.utils.js';

/**
 * Middleware factory for validating request data against Zod schemas
 * @param schema The Zod schema to validate against
 * @param source Where to find the data to validate ('body', 'query', 'params')
 */
export const validateRequest = (
  schema: z.Schema,
  source: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[source];
      const validatedData = schema.parse(data);
      
      // Replace the request data with the validated data
      req[source] = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Format the validation errors
        const formattedErrors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));
        
        apiResponse.error(
          res, 
          'Validation error', 
          400, 
          'VALIDATION_ERROR', 
          formattedErrors
        );
      } else {
        apiResponse.error(
          res, 
          'An unexpected error occurred during validation', 
          500
        );
      }
    }
  };
}; 
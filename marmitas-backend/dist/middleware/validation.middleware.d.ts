import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
/**
 * Middleware factory for validating request data against Zod schemas
 * @param schema The Zod schema to validate against
 * @param source Where to find the data to validate ('body', 'query', 'params')
 */
export declare const validateRequest: (schema: z.Schema, source?: "body" | "query" | "params") => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validation.middleware.d.ts.map
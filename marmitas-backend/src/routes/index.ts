import express, { Request, Response } from 'express';
import { exampleRoutes } from './example.routes.js';
import { docsRoutes } from './docs.routes.js';
import { authRoutes } from './auth.routes.js';

// Import route modules
// Example: import userRoutes from './user.routes.js';

// Create router
const router = express.Router();

// API version and documentation
router.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Marmitas API',
    version: '1.0.0',
    description: 'Backend API for Marmitas application',
    documentation: '/api/docs'
  });
});

// Mount routes
// Example: router.use('/users', userRoutes);
router.use('/examples', exampleRoutes);
router.use('/docs', docsRoutes);
router.use('/auth', authRoutes);

// Export API routes
export const apiRoutes = router; 
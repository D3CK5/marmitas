import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public endpoints (no authentication required)
// GET /api/categories - Get all categories
router.get('/', (_req, res) => {
  res.json({
    message: 'Get all categories endpoint',
    status: 'Not implemented yet'
  });
});

// GET /api/categories/:id - Get category by ID
router.get('/:id', (req, res) => {
  res.json({
    message: `Get category with ID: ${req.params.id}`,
    status: 'Not implemented yet'
  });
});

// Protected endpoints (authentication required)
// POST /api/categories - Create new category
router.post('/', authenticate, (_req, res) => {
  res.json({
    message: 'Create category endpoint',
    status: 'Not implemented yet'
  });
});

// PUT /api/categories/:id - Update category
router.put('/:id', authenticate, (req, res) => {
  res.json({
    message: `Update category with ID: ${req.params.id}`,
    status: 'Not implemented yet'
  });
});

// DELETE /api/categories/:id - Delete category
router.delete('/:id', authenticate, (req, res) => {
  res.json({
    message: `Delete category with ID: ${req.params.id}`,
    status: 'Not implemented yet'
  });
});

export const categoryRoutes = router;
export default categoryRoutes; 
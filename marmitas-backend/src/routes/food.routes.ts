import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public endpoints (no authentication required)
// GET /api/foods - Get all foods
router.get('/', (_req, res) => {
  res.json({
    message: 'Get all foods endpoint',
    status: 'Not implemented yet'
  });
});

// GET /api/foods/:id - Get food by ID
router.get('/:id', (req, res) => {
  res.json({
    message: `Get food with ID: ${req.params.id}`,
    status: 'Not implemented yet'
  });
});

// GET /api/foods/category/:categoryId - Get foods by category
router.get('/category/:categoryId', (req, res) => {
  res.json({
    message: `Get foods by category ID: ${req.params.categoryId}`,
    status: 'Not implemented yet'
  });
});

// Protected endpoints (authentication required)
// POST /api/foods - Create new food
router.post('/', authenticate, (_req, res) => {
  res.json({
    message: 'Create food endpoint',
    status: 'Not implemented yet'
  });
});

// PUT /api/foods/:id - Update food
router.put('/:id', authenticate, (req, res) => {
  res.json({
    message: `Update food with ID: ${req.params.id}`,
    status: 'Not implemented yet'
  });
});

// DELETE /api/foods/:id - Delete food
router.delete('/:id', authenticate, (req, res) => {
  res.json({
    message: `Delete food with ID: ${req.params.id}`,
    status: 'Not implemented yet'
  });
});

export const foodRoutes = router;
export default foodRoutes; 
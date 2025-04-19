import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// GET /api/products - Public endpoint
router.get('/', (_req, res) => {
  res.json({
    message: 'Get all products endpoint',
    status: 'Not implemented yet'
  });
});

// GET /api/products/:id - Public endpoint
router.get('/:id', (req, res) => {
  res.json({
    message: `Get product with ID: ${req.params.id}`,
    status: 'Not implemented yet'
  });
});

// Admin operations require authentication
// POST /api/products
router.post('/', authenticate, (_req, res) => {
  res.json({
    message: 'Create product endpoint',
    status: 'Not implemented yet'
  });
});

// PUT /api/products/:id
router.put('/:id', authenticate, (req, res) => {
  res.json({
    message: `Update product with ID: ${req.params.id}`,
    status: 'Not implemented yet'
  });
});

// DELETE /api/products/:id
router.delete('/:id', authenticate, (req, res) => {
  res.json({
    message: `Delete product with ID: ${req.params.id}`,
    status: 'Not implemented yet'
  });
});

export const productRoutes = router;
export default productRoutes; 
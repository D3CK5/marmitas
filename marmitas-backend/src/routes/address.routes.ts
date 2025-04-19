import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// All address endpoints require authentication
// GET /api/addresses - Get user addresses
router.get('/', authenticate, (_req, res) => {
  res.json({
    message: 'Get all addresses for current user endpoint',
    status: 'Not implemented yet'
  });
});

// GET /api/addresses/:id - Get specific address
router.get('/:id', authenticate, (req, res) => {
  res.json({
    message: `Get address with ID: ${req.params.id}`,
    status: 'Not implemented yet'
  });
});

// POST /api/addresses - Create new address
router.post('/', authenticate, (_req, res) => {
  res.json({
    message: 'Create address endpoint',
    status: 'Not implemented yet'
  });
});

// PUT /api/addresses/:id - Update address
router.put('/:id', authenticate, (req, res) => {
  res.json({
    message: `Update address with ID: ${req.params.id}`,
    status: 'Not implemented yet'
  });
});

// DELETE /api/addresses/:id - Delete address
router.delete('/:id', authenticate, (req, res) => {
  res.json({
    message: `Delete address with ID: ${req.params.id}`,
    status: 'Not implemented yet'
  });
});

export const addressRoutes = router;
export default addressRoutes; 
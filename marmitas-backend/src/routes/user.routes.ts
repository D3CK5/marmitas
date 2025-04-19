import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// GET /api/users
router.get('/', authenticate, (_req, res) => {
  res.json({
    message: 'Get all users endpoint',
    status: 'Not implemented yet'
  });
});

// GET /api/users/:id
router.get('/:id', authenticate, (req, res) => {
  res.json({
    message: `Get user with ID: ${req.params.id}`,
    status: 'Not implemented yet'
  });
});

// POST /api/users
router.post('/', authenticate, (_req, res) => {
  res.json({
    message: 'Create user endpoint',
    status: 'Not implemented yet'
  });
});

// PUT /api/users/:id
router.put('/:id', authenticate, (req, res) => {
  res.json({
    message: `Update user with ID: ${req.params.id}`,
    status: 'Not implemented yet'
  });
});

// DELETE /api/users/:id
router.delete('/:id', authenticate, (req, res) => {
  res.json({
    message: `Delete user with ID: ${req.params.id}`,
    status: 'Not implemented yet'
  });
});

export const userRoutes = router;
export default userRoutes; 
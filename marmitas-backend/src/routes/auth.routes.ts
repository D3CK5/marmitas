import express from 'express';
import { authController } from '../controllers/auth.controller.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { loginSchema, registerSchema, updateUserSchema } from '../models/validation.schemas.js';

const router = express.Router();

// POST /api/auth/register - Register a new user
router.post(
  '/register',
  validateRequest(registerSchema),
  authController.register.bind(authController)
);

// POST /api/auth/login - Login a user
router.post(
  '/login',
  validateRequest(loginSchema),
  authController.login.bind(authController)
);

// POST /api/auth/logout - Logout a user
router.post(
  '/logout',
  authenticate,
  authController.logout.bind(authController)
);

// GET /api/auth/profile - Get current user profile
router.get(
  '/profile',
  authenticate,
  authController.getProfile.bind(authController)
);

// PUT /api/auth/profile - Update current user profile
router.put(
  '/profile',
  authenticate,
  validateRequest(updateUserSchema),
  authController.updateProfile.bind(authController)
);

export const authRoutes = router;
export default authRoutes; 
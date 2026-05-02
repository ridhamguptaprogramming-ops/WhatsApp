import { Router } from 'express';
import { auth } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(auth);

// GET /api/users/me - Get current user
router.get('/me', (_req, _res) => {
  // TODO: Get current user
});

// PUT /api/users/me - Update current user
router.put('/me', (_req, _res) => {
  // TODO: Update current user
});

// GET /api/users/:id - Get user by ID
router.get('/:id', (_req, _res) => {
  // TODO: Get user by ID
});

// GET /api/users/search - Search users
router.get('/search', (_req, _res) => {
  // TODO: Search users
});

export default router;

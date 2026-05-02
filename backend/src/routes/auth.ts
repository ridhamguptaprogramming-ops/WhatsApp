import { Router } from 'express';
import { register, login, refreshToken, logout, getMe } from '../controllers/auth.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register - User registration
router.post('/register', register);

// POST /api/auth/login - User login  
router.post('/login', login);

// POST /api/auth/refresh - Refresh token
router.post('/refresh', refreshToken);

// POST /api/auth/logout - User logout
router.post('/logout', auth, logout);

// GET /api/auth/me - Get current user
router.get('/me', auth, getMe);

export default router;

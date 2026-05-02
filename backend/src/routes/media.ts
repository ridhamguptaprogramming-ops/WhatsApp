import { Router } from 'express';
import { auth } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(auth);

// POST /api/media/upload - Upload media
router.post('/upload', (_req, _res) => {
  // TODO: Upload media
});

// GET /api/media/:id - Get media info
router.get('/:id', (_req, _res) => {
  // TODO: Get media info
});

// DELETE /api/media/:id - Delete media
router.delete('/:id', (_req, _res) => {
  // TODO: Delete media
});

export default router;

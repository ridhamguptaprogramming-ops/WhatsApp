import { Router } from 'express';
import { 
  getChats, 
  getChat, 
  createChat, 
  updateChat, 
  deleteChat,
  addParticipants,
  removeParticipant,
  makeAdmin 
} from '../controllers/chats.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(auth);

// GET /api/chats - List user's chats
router.get('/', getChats);

// POST /api/chats - Create chat
router.post('/', createChat);

// GET /api/chats/:id - Get chat details
router.get('/:id', getChat);

// PUT /api/chats/:id - Update chat
router.put('/:id', updateChat);

// DELETE /api/chats/:id - Delete/leave chat
router.delete('/:id', deleteChat);

// POST /api/chats/:id/participants - Add participants
router.post('/:id/participants', addParticipants);

// DELETE /api/chats/:id/participants/:userId - Remove participant
router.delete('/:id/participants/:userId', removeParticipant);

// PUT /api/chats/:id/admin/:userId - Make admin
router.put('/:id/admin/:userId', makeAdmin);

export default router;

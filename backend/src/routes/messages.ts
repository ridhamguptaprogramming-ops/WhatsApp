import { Router } from 'express';
import { 
  getMessages, 
  sendMessage, 
  editMessage, 
  deleteMessage, 
  updateMessageStatus,
  markAsRead,
  addReaction,
  removeReaction 
} from '../controllers/messages.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(auth);

// GET /api/chats/:chatId/messages - Get messages
router.get('/:chatId/messages', getMessages);

// POST /api/chats/:chatId/messages - Send message
router.post('/:chatId/messages', sendMessage);

// PUT /api/messages/:id - Edit message
router.put('/:id', editMessage);

// DELETE /api/messages/:id - Delete message
router.delete('/:id', deleteMessage);

// PUT /api/messages/:id/status - Update message status
router.put('/:id/status', updateMessageStatus);

// POST /api/chats/:chatId/read - Mark messages as read
router.post('/:chatId/read', markAsRead);

// POST /api/messages/:id/reaction - Add reaction
router.post('/:id/reaction', addReaction);

// DELETE /api/messages/:id/reaction - Remove reaction
router.delete('/:id/reaction', removeReaction);

export default router;

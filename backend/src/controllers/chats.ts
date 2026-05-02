import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import { AppError } from '../middleware/errorHandler.js';

// Validation schemas
const createChatSchema = z.object({
  type: z.enum(['direct', 'group']),
  participantIds: z.array(z.string()).min(1),
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(200).optional(),
});

const updateChatSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(200).optional(),
});

// Get all chats for user
export const getChats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    
    const chats = await Chat.find({
      participants: userId,
    })
      .populate('participants', 'displayName avatar status lastSeen')
      .populate('lastMessage')
      .sort({ lastActivity: -1 });
    
    res.json({ chats });
  } catch (error) {
    next(error);
  }
};

// Get single chat
export const getChat = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    
    const chat = await Chat.findOne({
      _id: id,
      participants: userId,
    })
      .populate('participants', 'displayName avatar status lastSeen email')
      .populate('admin', 'displayName avatar')
      .populate('lastMessage');
    
    if (!chat) {
      throw new AppError('Chat not found', 404);
    }
    
    res.json({ chat });
  } catch (error) {
    next(error);
  }
};

// Create new chat
export const createChat = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const data = createChatSchema.parse(req.body);
    
    const participantIds = [
      new mongoose.Types.ObjectId(userId),
      ...data.participantIds.map(id => new mongoose.Types.ObjectId(id)),
    ];
    
    // For direct chats, check if chat already exists
    if (data.type === 'direct') {
      const existingChat = await Chat.findOne({
        type: 'direct',
        participants: { $all: participantIds, $size: 2 },
      }).populate('participants', 'displayName avatar status lastSeen');
      
      if (existingChat) {
        res.json({ chat: existingChat });
        return;
      }
    }
    
    // Create new chat
    const chat = new Chat({
      type: data.type,
      name: data.type === 'group' ? data.name : undefined,
      description: data.description,
      participants: participantIds,
      createdBy: userId,
      admin: data.type === 'group' ? [userId] : [],
      lastActivity: new Date(),
    });
    
    await chat.save();
    
    await chat.populate('participants', 'displayName avatar status lastSeen');
    
    res.status(201).json({ chat });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(error.errors[0].message, 400));
      return;
    }
    next(error);
  }
};

// Update chat
export const updateChat = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    const data = updateChatSchema.parse(req.body);
    
    const chat = await Chat.findById(id);
    
    if (!chat) {
      throw new AppError('Chat not found', 404);
    }
    
    // Check if user is admin
    const isAdmin = chat.admin.some(
      adminId => adminId.toString() === userId
    );
    
    if (!isAdmin) {
      throw new AppError('Only admins can update chat', 403);
    }
    
    if (data.name) chat.name = data.name;
    if (data.description !== undefined) chat.description = data.description;
    
    await chat.save();
    await chat.populate('participants', 'displayName avatar status lastSeen');
    
    res.json({ chat });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(error.errors[0].message, 400));
      return;
    }
    next(error);
  }
};

// Delete/leave chat
export const deleteChat = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    
    const chat = await Chat.findById(id);
    
    if (!chat) {
      throw new AppError('Chat not found', 404);
    }
    
    // For direct chats, just delete
    if (chat.type === 'direct') {
      await Chat.findByIdAndDelete(id);
      await Message.deleteMany({ chatId: id });
    } else {
      // For group chats, remove user from participants
      chat.participants = chat.participants.filter(
        p => p.toString() !== userId
      );
      chat.admin = chat.admin.filter(
        a => a.toString() !== userId
      );
      
      if (chat.participants.length < 2) {
        // Delete chat if less than 2 participants
        await Chat.findByIdAndDelete(id);
        await Message.deleteMany({ chatId: id });
      } else {
        await chat.save();
      }
    }
    
    res.json({ message: 'Chat deleted' });
  } catch (error) {
    next(error);
  }
};

// Add participants to group
export const addParticipants = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    const { participantIds } = req.body;
    
    if (!participantIds || !Array.isArray(participantIds)) {
      throw new AppError('Participant IDs required', 400);
    }
    
    const chat = await Chat.findById(id);
    
    if (!chat) {
      throw new AppError('Chat not found', 404);
    }
    
    if (chat.type !== 'group') {
      throw new AppError('Can only add participants to group chats', 400);
    }
    
    // Check if user is admin
    const isAdmin = chat.admin.some(
      adminId => adminId.toString() === userId
    );
    
    if (!isAdmin) {
      throw new AppError('Only admins can add participants', 403);
    }
    
    // Add new participants
    const newParticipants = participantIds.map(
      id => new mongoose.Types.ObjectId(id)
    );
    
    chat.participants = [
      ...chat.participants,
      ...newParticipants.filter(p => !chat.participants.some(
        existing => existing.toString() === p.toString()
      )),
    ];
    
    await chat.save();
    await chat.populate('participants', 'displayName avatar status lastSeen');
    
    res.json({ chat });
  } catch (error) {
    next(error);
  }
};

// Remove participant from group
export const removeParticipant = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, userId: participantId } = req.params;
    const userId = (req as any).user?.userId;
    
    const chat = await Chat.findById(id);
    
    if (!chat) {
      throw new AppError('Chat not found', 404);
    }
    
    if (chat.type !== 'group') {
      throw new AppError('Can only remove participants from group chats', 400);
    }
    
    // Check if user is admin or removing themselves
    const isAdmin = chat.admin.some(
      adminId => adminId.toString() === userId
    );
    const isSelf = participantId === userId;
    
    if (!isAdmin && !isSelf) {
      throw new AppError('Only admins can remove participants', 403);
    }
    
    chat.participants = chat.participants.filter(
      p => p.toString() !== participantId
    );
    chat.admin = chat.admin.filter(
      a => a.toString() !== participantId
    );
    
    await chat.save();
    await chat.populate('participants', 'displayName avatar status lastSeen');
    
    res.json({ chat });
  } catch (error) {
    next(error);
  }
};

// Make user admin
export const makeAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, userId: participantId } = req.params;
    const userId = (req as any).user?.userId;
    
    const chat = await Chat.findById(id);
    
    if (!chat) {
      throw new AppError('Chat not found', 404);
    }
    
    // Check if current user is admin
    const isAdmin = chat.admin.some(
      adminId => adminId.toString() === userId
    );
    
    if (!isAdmin) {
      throw new AppError('Only admins can make others admin', 403);
    }
    
    // Add to admin
    if (!chat.admin.some(a => a.toString() === participantId)) {
      chat.admin.push(new mongoose.Types.ObjectId(participantId));
      await chat.save();
    }
    
    await chat.populate('participants', 'displayName avatar status');
    await chat.populate('admin', 'displayName avatar');
    
    res.json({ chat });
  } catch (error) {
    next(error);
  }
};

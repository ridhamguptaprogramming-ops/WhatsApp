import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import Message from '../models/Message.js';
import Chat from '../models/Chat.js';
import { AppError } from '../middleware/errorHandler.js';

// Validation schemas
const sendMessageSchema = z.object({
  type: z.enum(['text', 'image', 'video', 'audio', 'file']).default('text'),
  content: z.string().min(1).max(5000).optional(),
  media: z.object({
    url: z.string(),
    thumbnail: z.string().optional(),
    fileName: z.string().optional(),
    fileSize: z.number().optional(),
    mimeType: z.string().optional(),
    duration: z.number().optional(),
  }).optional(),
  replyTo: z.string().optional(),
});

const updateMessageSchema = z.object({
  content: z.string().min(1).max(5000),
});

const MESSAGE_LIMIT = 50;

// Get messages for a chat
export const getMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { chatId } = req.params;
    const userId = (req as any).user?.userId;
    const before = req.query.before as string | undefined;
    const limit = parseInt(req.query.limit as string) || MESSAGE_LIMIT;
    
    // Verify user is participant
    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId,
    });
    
    if (!chat) {
      throw new AppError('Chat not found or access denied', 404);
    }
    
// Build query
    const query: any = { chatId };
    
    if (before) {
      query.createdAt = { $lt: new mongoose.Types.ObjectId(before) };
    }
    
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sender', 'displayName avatar')
      .populate('replyTo', 'content sender')
      .populate('reactions.user', 'displayName avatar');
    
    // Mark messages as delivered
    const messageIds = messages
      .filter(m => m.status === 'sent')
      .map(m => m._id);
    
    if (messageIds.length > 0) {
      await Message.updateMany(
        { _id: { $in: messageIds } },
        { 
          status: 'delivered',
          $push: {
            readBy: {
              user: userId,
              readAt: new Date(),
            },
          },
        }
      );
    }
    
    res.json({ 
      messages: messages.reverse(),
      hasMore: messages.length === limit,
    });
  } catch (error) {
    next(error);
  }
};

// Send a message
export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { chatId } = req.params;
    const userId = (req as any).user?.userId;
    const data = sendMessageSchema.parse(req.body);
    
    // Verify user is participant
    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId,
    });
    
    if (!chat) {
      throw new AppError('Chat not found or access denied', 404);
    }
    
    // Create message
    const message = new Message({
      chatId,
      sender: userId,
      type: data.type,
      content: data.content || '',
      media: data.media,
      replyTo: data.replyTo ? new mongoose.Types.ObjectId(data.replyTo) : undefined,
      status: 'sent',
    });
    
    await message.save();
    
    // Update chat's last activity
    chat.lastMessage = message._id;
    chat.lastActivity = new Date();
    await chat.save();
    
    // Populate sender info
    await message.populate('sender', 'displayName avatar');
    
    // TODO: Emit socket event for real-time delivery
    
    res.status(201).json({ message });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(error.errors[0].message, 400));
      return;
    }
    next(error);
  }
};

// Edit message
export const editMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    const data = updateMessageSchema.parse(req.body);
    
    const message = await Message.findById(id);
    
    if (!message) {
      throw new AppError('Message not found', 404);
    }
    
    // Only sender can edit
    if (message.sender.toString() !== userId) {
      throw new AppError('Only sender can edit message', 403);
    }
    
    message.content = data.content;
    await message.save();
    
    await message.populate('sender', 'displayName avatar');
    
    // TODO: Emit socket event
    
    res.json({ message });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(error.errors[0].message, 400));
      return;
    }
    next(error);
  }
};

// Delete message
export const deleteMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    
    const message = await Message.findById(id);
    
    if (!message) {
      throw new AppError('Message not found', 404);
    }
    
    // Only sender can delete
    if (message.sender.toString() !== userId) {
      throw new AppError('Only sender can delete message', 403);
    }
    
    await Message.findByIdAndDelete(id);
    
    // TODO: Emit socket event
    
    res.json({ message: 'Message deleted' });
  } catch (error) {
    next(error);
  }
};

// Update message status (read)
export const updateMessageStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    const { status } = req.body;
    
    if (!['sent', 'delivered', 'read'].includes(status)) {
      throw new AppError('Invalid status', 400);
    }
    
    const message = await Message.findById(id);
    
    if (!message) {
      throw new AppError('Message not found', 404);
    }
    
    if (status === 'read') {
      message.status = 'read';
      message.readBy.push({
        user: new mongoose.Types.ObjectId(userId),
        readAt: new Date(),
      });
      await message.save();
    } else {
      message.status = status;
      await message.save();
    }
    
    // TODO: Emit socket event
    
    res.json({ message });
  } catch (error) {
    next(error);
  }
};

// Mark messages as read
export const markAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { chatId } = req.params;
    const userId = (req as any).user?.userId;
    const { messageIds } = req.body;
    
    // Verify user is participant
    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId,
    });
    
    if (!chat) {
      throw new AppError('Chat not found or access denied', 404);
    }
    
    // Update messages
    const query: any = {
      chatId,
      sender: { $ne: userId },
      status: { $ne: 'read' },
    };
    
    if (messageIds && messageIds.length > 0) {
      query._id = { $in: messageIds };
    }
    
    const messages = await Message.find(query);
    
    if (messages.length > 0) {
      await Message.updateMany(
        { _id: { $in: messages.map(m => m._id) } },
        {
          status: 'read',
          $push: {
            readBy: {
              user: new mongoose.Types.ObjectId(userId),
              readAt: new Date(),
            },
          },
        }
      );
    }
    
    // TODO: Emit socket event to message sender
    
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    next(error);
  }
};

// Add reaction to message
export const addReaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    const { emoji } = req.body;
    
    if (!emoji) {
      throw new AppError('Emoji required', 400);
    }
    
    const message = await Message.findById(id);
    
    if (!message) {
      throw new AppError('Message not found', 404);
    }
    
    // Remove existing reaction from this user
    message.reactions = message.reactions.filter(
      r => r.user.toString() !== userId
    );
    
    // Add new reaction
    message.reactions.push({
      user: new mongoose.Types.ObjectId(userId),
      emoji,
    });
    
    await message.save();
    
    await message.populate('reactions.user', 'displayName avatar');
    
    // TODO: Emit socket event
    
    res.json({ message });
  } catch (error) {
    next(error);
  }
};

// Remove reaction from message
export const removeReaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    
    const message = await Message.findById(id);
    
    if (!message) {
      throw new AppError('Message not found', 404);
    }
    
    message.reactions = message.reactions.filter(
      r => r.user.toString() !== userId
    );
    
    await message.save();
    
    await message.populate('reactions.user', 'displayName avatar');
    
    // TODO: Emit socket event
    
    res.json({ message });
  } catch (error) {
    next(error);
  }
};

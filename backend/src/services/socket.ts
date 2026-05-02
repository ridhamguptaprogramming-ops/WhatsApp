import { Server, Socket } from 'socket.io';
import { verify } from 'jsonwebtoken';
import { config } from '../config/env.js';

interface JwtPayload {
  userId: string;
  iat: number;
  exp: number;
}

interface UserSocket {
  odocketId: string;
  userId: string;
}

// Store connected users in memory (use Redis in production)
const onlineUsers: Map<string, string> = new Map();

export const initializeSocket = (io: Server): void => {
  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication required'));
    }
    
    try {
      const decoded = verify(token, config.jwt.secret) as JwtPayload;
      socket.data.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    console.log(`User ${userId} connected:`, socket.id);
    
    // Add user to online users
    onlineUsers.set(userId, socket.id);
    
    // Broadcast user online status
    io.emit('user-status', { userId, status: 'online' });
    
    // Handle joining chat rooms
    socket.on('join-chat', (chatId: string) => {
      socket.join(`chat:${chatId}`);
      console.log(`User ${userId} joined chat ${chatId}`);
    });
    
    // Handle leaving chat rooms
    socket.on('leave-chat', (chatId: string) => {
      socket.leave(`chat:${chatId}`);
      console.log(`User ${userId} left chat ${chatId}`);
    });
    
    // Handle sending messages (relay through server)
    socket.on('send-message', (data: { chatId: string; message: any }) => {
      const { chatId, message } = data;
      // Broadcast to all users in the chat room
      io.to(`chat:${chatId}`).emit('new-message', message);
    });
    
    // Handle typing indicators
    socket.on('typing-start', (data: { chatId: string }) => {
      socket.to(`chat:${data.chatId}`).emit('user-typing', { userId, isTyping: true });
    });
    
    socket.on('typing-stop', (data: { chatId: string }) => {
      socket.to(`chat:${data.chatId}`).emit('user-typing', { userId, isTyping: false });
    });
    
    // Handle message read receipts
    socket.on('mark-read', (data: { chatId: string; messageIds: string[] }) => {
      io.to(`chat:${data.chatId}`).emit('message-status', {
        messageIds: data.messageIds,
        userId,
        status: 'read',
      });
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected:`, socket.id);
      onlineUsers.delete(userId);
      io.emit('user-status', { userId, status: 'offline' });
    });
  });
};

// Helper function to send message to specific user
export const sendToUser = (io: Server, userId: string, event: string, data: any): void => {
  const socketId = onlineUsers.get(userId);
  if (socketId) {
    io.to(socketId).emit(event, data);
  }
};

// Helper function to broadcast to chat room
export const broadcastToChat = (io: Server, chatId: string, event: string, data: any): void => {
  io.to(`chat:${chatId}`).emit(event, data);
};

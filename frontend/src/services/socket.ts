import { io, Socket } from 'socket.io-client';
import type { IUser, IMessage, IChat } from '../types';

type TypingCallback = (data: { chatId: string; user: IUser }) => void;
type MessageCallback = (message: IMessage) => void;
type StatusCallback = (data: { messageId: string; status: string }) => void;
type UserStatusCallback = (data: { userId: string; status: IUser['status'] }) => void;

class SocketService {
  private socket: Socket | null = null;
  private typingCallbacks: Map<string, TypingCallback[]> = new Map();
  private messageCallbacks: MessageCallback[] = [];
  private statusCallbacks: StatusCallback[] = [];
  private userStatusCallbacks: UserStatusCallback[] = [];
  private isConnected: boolean = false;

  connect(token: string): void {
    if (this.socket?.connected) return;

    this.socket = io('/', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected = false;
    });

    this.socket.on('new-message', (message: IMessage) => {
      this.messageCallbacks.forEach((cb) => cb(message));
    });

    this.socket.on('user-typing', (data: { chatId: string; user: IUser }) => {
      const callbacks = this.typingCallbacks.get(data.chatId) || [];
      callbacks.forEach((cb) => cb(data));
    });

    this.socket.on('message-status', (data: { messageId: string; status: string }) => {
      this.statusCallbacks.forEach((cb) => cb(data));
    });

    this.socket.on('user-status', (data: { userId: string; status: IUser['status'] }) => {
      this.userStatusCallbacks.forEach((cb) => cb(data));
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.isConnected = false;
  }

  joinChat(chatId: string): void {
    this.socket?.emit('join-chat', chatId);
  }

  leaveChat(chatId: string): void {
    this.socket?.emit('leave-chat', chatId);
  }

  sendMessage(message: IMessage): void {
    this.socket?.emit('send-message', message);
  }

  startTyping(chatId: string): void {
    this.socket?.emit('typing-start', chatId);
  }

  stopTyping(chatId: string): void {
    this.socket?.emit('typing-stop', chatId);
  }

  markAsRead(chatId: string, messageIds: string[]): void {
    this.socket?.emit('mark-read', { chatId, messageIds });
  }

  onNewMessage(callback: MessageCallback): () => void {
    this.messageCallbacks.push(callback);
    return () => {
      const index = this.messageCallbacks.indexOf(callback);
      if (index > -1) this.messageCallbacks.splice(index, 1);
    };
  }

  onTyping(chatId: string, callback: TypingCallback): () => void {
    const callbacks = this.typingCallbacks.get(chatId) || [];
    callbacks.push(callback);
    this.typingCallbacks.set(chatId, callbacks);
    return () => {
      const cbs = this.typingCallbacks.get(chatId) || [];
      const index = cbs.indexOf(callback);
      if (index > -1) cbs.splice(index, 1);
    };
  }

  onMessageStatus(callback: StatusCallback): () => void {
    this.statusCallbacks.push(callback);
    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index > -1) this.statusCallbacks.splice(index, 1);
    };
  }

  onUserStatus(callback: UserStatusCallback): () => void {
    this.userStatusCallbacks.push(callback);
    return () => {
      const index = this.userStatusCallbacks.indexOf(callback);
      if (index > -1) this.userStatusCallbacks.splice(index, 1);
    };
  }

  get connected(): boolean {
    return this.isConnected;
  }
}

export const socketService = new SocketService();
export default socketService;

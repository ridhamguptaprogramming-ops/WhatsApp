// User types
export interface IUser {
  _id: string;
  email: string;
  phone?: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Chat types
export type ChatType = 'direct' | 'group';

export interface IChat {
  _id: string;
  type: ChatType;
  name?: string;
  avatar?: string;
  description?: string;
  participants: IUser[];
  createdBy: IUser;
  admin: IUser[];
  lastMessage?: IMessage;
  lastActivity: Date;
  isMuted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Message types
export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'file';
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface IMedia {
  url: string;
  thumbnail?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  duration?: number;
}

export interface IReaction {
  user: IUser;
  emoji: string;
}

export interface IMessage {
  _id: string;
  chatId: string;
  sender: IUser;
  type: MessageType;
  content: string;
  media?: IMedia;
  replyTo?: IMessage;
  status: MessageStatus;
  readBy: Array<{
    user: IUser;
    readAt: Date;
  }>;
  reactions: IReaction[];
  createdAt: Date;
  updatedAt: Date;
}

// Auth types
export interface IAuthResponse {
  user: IUser;
  accessToken: string;
  refreshToken: string;
}

export interface ILoginCredentials {
  email: string;
  password: string;
}

export interface IRegisterData {
  email: string;
  password: string;
  displayName: string;
  phone?: string;
}

// API Response types
export interface IApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface IPaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  total?: number;
}

// Socket events
export interface ISocketEvents {
  'new-message': (message: IMessage) => void;
  'message-updated': (message: IMessage) => void;
  'message-deleted': (messageId: string) => void;
  'user-typing': (data: { chatId: string; user: IUser }) => void;
  'message-status': (data: { messageId: string; status: MessageStatus }) => void;
  'user-status': (data: { userId: string; status: IUser['status'] }) => void;
  'participant-joined': (data: { chatId: string; user: IUser }) => void;
  'participant-left': (data: { chatId: string; userId: string }) => void;
  'chat-updated': (chat: IChat) => void;
}

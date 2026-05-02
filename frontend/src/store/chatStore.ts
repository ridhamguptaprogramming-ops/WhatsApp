import { create } from 'zustand';
import type { IChat, IMessage, IUser } from '../types';

interface ChatState {
  chats: IChat[];
  activeChat: IChat | null;
  messages: IMessage[];
  typingUsers: Map<string, IUser[]>;
  isLoading: boolean;
  hasMoreMessages: boolean;
  
  setChats: (chats: IChat[]) => void;
  setActiveChat: (chat: IChat | null) => void;
  addChat: (chat: IChat) => void;
  updateChat: (chatId: string, updates: Partial<IChat>) => void;
  removeChat: (chatId: string) => void;
  
  setMessages: (messages: IMessage[]) => void;
  addMessage: (message: IMessage) => void;
  updateMessage: (messageId: string, updates: Partial<IMessage>) => void;
  removeMessage: (messageId: string) => void;
  
  setTypingUser: (chatId: string, users: IUser[]) => void;
  addTypingUser: (chatId: string, user: IUser) => void;
  removeTypingUser: (chatId: string, userId: string) => void;
  
  setLoading: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  chats: [],
  activeChat: null,
  messages: [],
  typingUsers: new Map(),
  isLoading: false,
  hasMoreMessages: true,
  
  setChats: (chats) => set({ chats }),
  setActiveChat: (chat) => set({ activeChat: chat, messages: [] }),
  addChat: (chat) => set((state) => ({ 
    chats: [chat, ...state.chats.filter(c => c._id !== chat._id)] 
  })),
  updateChat: (chatId, updates) => set((state) => ({
    chats: state.chats.map(c => 
      c._id === chatId ? { ...c, ...updates } : c
    ),
    activeChat: state.activeChat?._id === chatId 
      ? { ...state.activeChat, ...updates } 
      : state.activeChat
  })),
  removeChat: (chatId) => set((state) => ({
    chats: state.chats.filter(c => c._id !== chatId),
    activeChat: state.activeChat?._id === chatId ? null : state.activeChat
  })),
  
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  updateMessage: (messageId, updates) => set((state) => ({
    messages: state.messages.map(m => 
      m._id === messageId ? { ...m, ...updates } : m
    )
  })),
  removeMessage: (messageId) => set((state) => ({
    messages: state.messages.filter(m => m._id !== messageId)
  })),
  
  setTypingUser: (chatId, users) => set((state) => {
    const newMap = new Map(state.typingUsers);
    newMap.set(chatId, users);
    return { typingUsers: newMap };
  }),
  addTypingUser: (chatId, user) => set((state) => {
    const newMap = new Map(state.typingUsers);
    const users = newMap.get(chatId) || [];
    if (!users.find(u => u._id === user._id)) {
      newMap.set(chatId, [...users, user]);
    }
    return { typingUsers: newMap };
  }),
  removeTypingUser: (chatId, userId) => set((state) => {
    const newMap = new Map(state.typingUsers);
    const users = newMap.get(chatId) || [];
    newMap.set(chatId, users.filter(u => u._id !== userId));
    return { typingUsers: newMap };
  }),
  
  setLoading: (isLoading) => set({ isLoading }),
  setHasMore: (hasMoreMessages) => set({ hasMoreMessages })
}));

import { useEffect, useRef } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { MoreVertical, Phone, Video, Info, ArrowLeft } from 'lucide-react';
import MessageInput from '../Message/MessageInput';

type MessageBubbleProps = {
  message: any;
  isOwn: boolean;
};

function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const bubbleClasses = isOwn
    ? 'self-end bg-primary text-white'
    : 'self-start bg-gray-100 text-text-primary';

  const content = message?.content ?? message?.text ?? '';

  return (
    <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${bubbleClasses}`}>
      <p>{content}</p>
    </div>
  );
}

export default function ChatWindow () {
  const { activeChat, messages, setMessages, hasMoreMessages, isLoading } = useChatStore();
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get the other participant for direct chats
  const otherParticipant = activeChat?.type === 'direct'
    ? activeChat.participants.find(p => p._id !== user?._id)
    : null;
  
  const displayName = activeChat?.type === 'group' 
    ? activeChat.name 
    : otherParticipant?.displayName || 'Select a chat';
  
  const status = otherParticipant?.status;
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Load messages when active chat changes
  useEffect(() => {
    if (activeChat) {
      // TODO: Fetch messages from API
      // For now, set empty messages
      setMessages([]);
    }
  }, [activeChat?._id]);
  
  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-4xl text-text-secondary">💬</span>
          </div>
          <h2 className="text-xl font-medium text-text-primary">WhatsApp Clone</h2>
          <p className="text-text-secondary mt-2">Select a chat to start messaging</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative">
            {otherParticipant?.avatar || activeChat.avatar ? (
              <img 
                src={otherParticipant?.avatar || activeChat.avatar} 
                alt={displayName}
                className="avatar-md" 
              />
            ) : (
              <div className="avatar-md bg-primary flex items-center justify-center text-white font-medium">
                {displayName?.charAt(0).toUpperCase()}
              </div>
            )}
            {status === 'online' && (
              <div className="absolute bottom-0 right-0 status-online" />
            )}
          </div>
          
          {/* Info */}
          <div>
            <h2 className="font-medium text-text-primary">{displayName}</h2>
            <p className="text-sm text-text-secondary">
              {status === 'online' ? 'online' : activeChat.type === 'group' 
                ? `${activeChat.participants.length} members`
                : 'offline'
              }
            </p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          <button className="p-2 rounded-full hover:bg-gray-100 text-text-secondary">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 text-text-secondary">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 text-text-secondary">
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {/* Date separator example */}
        <div className="flex justify-center">
          <span className="text-xs text-text-secondary bg-gray-200 px-3 py-1 rounded-full">
            Today
          </span>
        </div>
        
        {/* Messages */}
        {messages.length === 0 && !isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-text-secondary">No messages yet</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message._id}
              message={message}
              isOwn={message.sender._id === user?._id}
            />
          ))
        )}
        
        {/* Typing indicator */}
        {/* TODO: Add typing indicator component */}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <MessageInput chatId={activeChat._id} />
    </div>
  );
}

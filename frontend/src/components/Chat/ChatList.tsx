import { useEffect } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { format } from 'date-fns';
import { Search, Plus, MoreVertical, Phone, Video } from 'lucide-react';
import type { IChat, IUser } from '../../types';

// Chat item component
const ChatItem = ({ chat, isActive, onClick }: { chat: IChat; isActive: boolean; onClick: () => void }) => {
  const { user } = useAuthStore();
  
  // Get the other participant for direct chats
  const otherParticipant = chat.type === 'direct' 
    ? chat.participants.find(p => p._id !== user?._id)
    : null;
  
  const displayName = chat.type === 'group' ? chat.name : otherParticipant?.displayName || 'Unknown';
  const avatar = chat.type === 'group' ? chat.avatar : otherParticipant?.avatar;
  const status = otherParticipant?.status;
  
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
        isActive ? 'bg-gray-100' : 'hover:bg-gray-50'
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {avatar ? (
          <img src={avatar} alt={displayName} className="avatar-md" />
        ) : (
          <div className="avatar-md bg-primary flex items-center justify-center text-white font-medium">
            {displayName?.charAt(0).toUpperCase()}
          </div>
        )}
        {status === 'online' && (
          <div className="absolute bottom-0 right-0 status-online" />
        )}
      </div>
      
      {/* Chat info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-text-primary truncate">{displayName}</h3>
          {chat.lastActivity && (
            <span className="text-xs text-text-secondary">
              {format(new Date(chat.lastActivity), 'HH:mm')}
            </span>
          )}
        </div>
        <p className="text-sm text-text-secondary truncate">
          {chat.lastMessage 
            ? chat.lastMessage.content.substring(0, 50)
            : (chat.type === 'group' ? `${chat.participants.length} members` : 'No messages yet')
          }
        </p>
      </div>
    </div>
  );
};

export default function ChatList() {
  const { chats, activeChat, setActiveChat, setChats, isLoading } = useChatStore();
  const { user } = useAuthStore();
  
  // Load chats (mock for now)
  useEffect(() => {
    // TODO: Fetch chats from API
    // For demo, create a placeholder chat if none exists
    if (!chats.length && user) {
      setChats([{
        _id: 'demo-chat',
        type: 'direct',
        name: undefined,
        description: undefined,
        participants: [user],
        createdBy: user,
        admin: [],
        lastActivity: new Date(),
        isMuted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }]);
    }
  }, [user]);
  
  const handleSelectChat = (chat: IChat) => {
    setActiveChat(chat);
  };
  
  return (
    <div className="w-80 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-text-primary">Chats</h2>
          <div className="flex gap-2">
            <button className="p-2 rounded-full hover:bg-gray-100 text-text-secondary">
              <Plus className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 text-text-secondary">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Search"
            className="input pl-9 py-1.5 text-sm bg-gray-100 border-0 focus:bg-white"
          />
        </div>
      </div>
      
      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <p className="text-text-secondary">No chats yet</p>
            <p className="text-sm text-text-secondary">Start a new conversation</p>
          </div>
        ) : (
          chats.map(chat => (
            <ChatItem
              key={chat._id}
              chat={chat}
              isActive={activeChat?._id === chat._id}
              onClick={() => handleSelectChat(chat)}
            />
          ))
        )}
      </div>
    </div>
  );
}

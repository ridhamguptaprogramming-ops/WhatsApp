import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { 
  Send, 
  Paperclip, 
  Mic, 
  Image, 
  File, 
  Loader2,
  Smile
} from 'lucide-react';

interface MessageInputProps {
  chatId: string;
}

export default function MessageInput({ chatId }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { addMessage } = useChatStore();
  const { user } = useAuthStore();
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(
        textareaRef.current.scrollHeight,
        150
      ) + 'px';
    }
  }, [message]);
  
  const handleSend = async () => {
    if (!message.trim() || isSending) return;
    
    setIsSending(true);
    
    try {
      // TODO: Send message via API
      // For now, add to local state
      const newMessage = {
        _id: Date.now().toString(),
        chatId,
        sender: user!,
        type: 'text' as const,
        content: message.trim(),
        status: 'sent' as const,
        readBy: [],
        reactions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      addMessage(newMessage);
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <div className="px-4 py-3 bg-white border-t border-gray-200">
      {/* Attachments menu */}
{showAttachments && (
        <div className="mb-3 flex gap-3 p-2 bg-gray-100 rounded-lg">
          <button className="p-2 rounded-full hover:bg-gray-200 text-text-secondary">
            <Image className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-200 text-text-secondary">
            <File className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-200 text-text-secondary">
            <Smile className="w-5 h-5" />
          </button>
        </div>
      )}
      
      <div className="flex items-end gap-2">
        {/* Attachment button */}
        <button
          onClick={() => setShowAttachments(!showAttachments)}
          className={`p-2 rounded-full hover:bg-gray-100 ${
            showAttachments ? 'bg-gray-100 text-primary' : 'text-text-secondary'
          }`}
        >
          <Paperclip className="w-5 h-5" />
        </button>
        
        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message"
            className="w-full px-4 py-2 pr-10 bg-gray-100 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            rows={1}
          />
        </div>
        
        {/* Emoji button */}
<button className="p-2 rounded-full hover:bg-gray-100 text-text-secondary">
          <Smile className="w-5 h-5" />
        </button>
        
        {/* Send/Mic button */}
        {message.trim() ? (
          <button
            onClick={handleSend}
            disabled={isSending}
            className="p-2 rounded-full bg-primary text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        ) : (
          <button className="p-2 rounded-full hover:bg-gray-100 text-text-secondary">
            <Mic className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

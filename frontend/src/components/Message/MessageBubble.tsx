import { format } from 'date-fns';
import { Check, CheckCheck, Image, FileAudio, FileVideo, File } from 'lucide-react';
import type { IMessage } from '../../types';

interface MessageBubbleProps {
  message: IMessage;
  isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const time = format(new Date(message.createdAt), 'HH:mm');
  
  // Render media content
  const renderMedia = () => {
    if (!message.media) return null;
    
    switch (message.type) {
      case 'image':
        return (
          <img 
            src={message.media.url} 
            alt={message.media.fileName || 'image'}
            className="max-w-full rounded-lg"
          />
        );
      case 'video':
        return (
          <video 
            src={message.media.url} 
            controls 
            className="max-w-full rounded-lg"
          />
        );
      case 'audio':
        return (
          <audio 
            src={message.media.url} 
            controls 
            className="max-w-full"
          />
        );
      case 'file':
      default:
        return (
          <a 
            href={message.media.url} 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-2 bg-white/10 rounded-lg hover:bg-white/20"
          >
            <File className="w-5 h-5" />
            <span className="text-sm truncate">{message.media.fileName}</span>
          </a>
        );
    }
  };
  
  // Get status icon
  const getStatusIcon = () => {
    if (!isOwn) return null;
    
    switch (message.status) {
      case 'sent':
        return <Check className="w-4 h-4" />;
      case 'delivered':
        return <CheckCheck className="w-4 h-4" />;
      case 'read':
        return <CheckCheck className="w-4 h-4 text-blue-300" />;
      default:
        return null;
    }
  };
  
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={isOwn ? 'message-bubble-sent' : 'message-bubble-received'}>
        {/* Media */}
        {message.media && (
          <div className="mb-1">
            {renderMedia()}
          </div>
        )}
        
        {/* Text content */}
        {message.content && (
          <p className="break-words">{message.content}</p>
        )}
        
        {/* Time and status */}
        <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
          isOwn ? 'text-white/70' : 'text-text-secondary'
        }`}>
          <span>{time}</span>
          {getStatusIcon()}
        </div>
        
        {/* Reactions */}
        {message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {message.reactions.map((reaction, index) => (
              <span 
                key={index}
                className="text-xs bg-gray-100 px-1.5 py-0.5 rounded-full"
              >
                {reaction.emoji}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

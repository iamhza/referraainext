'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MoreHorizontal,
  Reply,
  Heart,
  MessageCircle,
  Bookmark,
  Share
} from 'lucide-react';
import FileAttachment from './FileAttachment';

interface Message {
  id: string;
  author: string;
  authorType: 'case_manager' | 'provider' | 'admin';
  content: string;
  timestamp: string;
  attachments?: {
    name: string;
    type: string;
    size: string;
    url?: string;
  }[];
  reactions?: {
    emoji: string;
    count: number;
    users: string[];
  }[];
  replies?: number;
}

interface MessageWithFileProps {
  message: Message;
  showThread?: boolean;
  onReply?: (messageId: string) => void;
}

export default function MessageWithFile({ message, showThread = false, onReply }: MessageWithFileProps) {
  const getAuthorInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getAuthorColor = (authorType: string) => {
    switch (authorType) {
      case 'case_manager': return 'bg-gray-200 text-gray-700';
      case 'provider': return 'bg-gray-200 text-gray-700';
      case 'admin': return 'bg-gray-200 text-gray-700';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  return (
    <div className="flex gap-3 hover:bg-gray-50 p-3 rounded-lg group transition-colors">
              <Avatar className="w-10 h-10 mt-1">
          <AvatarFallback className={`${getAuthorColor(message.authorType)} text-sm`}>
            {getAuthorInitials(message.author)}
          </AvatarFallback>
        </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-gray-900 text-sm">
            {message.author}
          </span>
          <Badge variant="outline" className="text-xs">
            {message.authorType === 'case_manager' ? 'Case Manager' : 
             message.authorType === 'provider' ? 'Provider' : 'Admin'}
          </Badge>
          <span className="text-xs text-gray-500">
            {message.timestamp}
          </span>
        </div>
        
        {message.content && (
          <div className="text-gray-700 text-sm leading-relaxed mb-3">
            {message.content}
          </div>
        )}

        {/* File Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="space-y-2 mb-3 max-w-lg">
            {message.attachments.map((attachment, idx) => (
              <FileAttachment
                key={idx}
                file={{
                  ...attachment,
                  uploadedBy: message.author,
                  uploadedAt: message.timestamp
                }}
                showActions={false}
              />
            ))}
          </div>
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex gap-2 mb-2">
            {message.reactions.map((reaction, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs hover:bg-gray-50 border-gray-200"
              >
                <span className="mr-1">{reaction.emoji}</span>
                {reaction.count}
              </Button>
            ))}
          </div>
        )}

        {/* Thread Replies */}
        {showThread && message.replies && message.replies > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 p-1 h-auto text-xs"
            onClick={() => onReply?.(message.id)}
          >
            <MessageCircle className="h-3 w-3 mr-1" />
            {message.replies} {message.replies === 1 ? 'reply' : 'replies'}
          </Button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-start gap-1">
        <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
          <Heart className="h-4 w-4 text-gray-500" />
        </Button>
        <Button variant="ghost" size="sm" className="p-1 h-8 w-8" onClick={() => onReply?.(message.id)}>
          <Reply className="h-4 w-4 text-gray-500" />
        </Button>
        <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
          <Bookmark className="h-4 w-4 text-gray-500" />
        </Button>
        <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
          <MoreHorizontal className="h-4 w-4 text-gray-500" />
        </Button>
      </div>
    </div>
  );
} 
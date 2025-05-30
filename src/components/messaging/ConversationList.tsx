'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Search, 
  Plus, 
  Hash, 
  BellOff,
  ChevronDown, 
  ChevronRight,
} from 'lucide-react';

export interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: {
    content: string;
    timestamp: string;
    senderId: string;
  };
  unreadCount: number;
  type: 'direct' | 'group';
  participants: {
    id: string;
    name: string;
    avatar?: string;
    status?: 'online' | 'offline' | 'away' | 'busy';
    role?: string;
    lastActive?: string;
    title?: string;
  }[];
  lastActivity: string; // ISO timestamp
  isPinned?: boolean;
  isMuted?: boolean;
  description?: string;
  createdAt?: string;
  messages?: any[]; // Array of messages
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  currentUserId: string;
  onSelectConversation: (conversationId: string) => void;
  onCreateNewConversation?: () => void;
}

// Helper function to get initials from name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();
};

// Helper to format the last message time
const formatLastActivity = (timestamp: string): string => {
  const now = new Date();
  const messageDate = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'now';
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d`;
  
  return `${messageDate.getMonth() + 1}/${messageDate.getDate()}`;
};

// Helper to truncate text
const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export function ConversationList({
  conversations,
  selectedConversationId,
  currentUserId,
  onSelectConversation,
  onCreateNewConversation
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showGroupsExpanded, setShowGroupsExpanded] = useState(true);
  const [showDirectExpanded, setShowDirectExpanded] = useState(true);
  
  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      conv.name.toLowerCase().includes(query) ||
      conv.participants.some(p => p.name.toLowerCase().includes(query)) ||
      (conv.lastMessage?.content.toLowerCase().includes(query))
    );
  });
  
  // Separate conversations by type
  const directConversations = filteredConversations.filter(c => c.type === 'direct');
  const groupConversations = filteredConversations.filter(c => c.type === 'group');
  
  // Sort conversations
  const sortConversations = (convs: Conversation[]) => {
    return [...convs].sort((a, b) => {
      // First sort by pinned status
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // Then by unread messages
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      
      // Finally by last activity
      return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
    });
  };
  
  const sortedDirectConversations = sortConversations(directConversations);
  const sortedGroupConversations = sortConversations(groupConversations);
  
  return (
    <div className="flex flex-col h-full bg-white text-gray-900 border-r border-gray-200">
      {/* Header with search */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold flex-1 text-gray-900">Messages</h2>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onCreateNewConversation}
            className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="mt-3 relative">
          <Input
            placeholder="Search messages"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-500 pl-8"
          />
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          {searchQuery && (
            <button 
              className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-700"
              onClick={() => setSearchQuery('')}
            >
              &times;
            </button>
          )}
        </div>
      </div>
      
      {/* Conversations list */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Group conversations section */}
          <div className="mb-4">
            <button 
              className="w-full flex items-center px-2 py-1 text-xs uppercase tracking-wider font-semibold text-gray-500 hover:text-gray-700"
              onClick={() => setShowGroupsExpanded(!showGroupsExpanded)}
            >
              {showGroupsExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 mr-1" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 mr-1" />
              )}
              Channels ({sortedGroupConversations.length})
            </button>
            
            {showGroupsExpanded && (
              <div>
                {sortedGroupConversations.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No channels found
                  </div>
                ) : (
                  sortedGroupConversations.map(conversation => (
                    <ConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      isSelected={conversation.id === selectedConversationId}
                      currentUserId={currentUserId}
                      onClick={() => onSelectConversation(conversation.id)}
                    />
                  ))
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onCreateNewConversation}
                  className="ml-2 mt-1 text-gray-500 hover:text-gray-700 text-xs flex items-center p-1"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add channel
                </Button>
              </div>
            )}
          </div>
          
          {/* Direct messages section */}
          <div>
            <button 
              className="w-full flex items-center px-2 py-1 text-xs uppercase tracking-wider font-semibold text-gray-500 hover:text-gray-700"
              onClick={() => setShowDirectExpanded(!showDirectExpanded)}
            >
              {showDirectExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 mr-1" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 mr-1" />
              )}
              Direct Messages ({sortedDirectConversations.length})
            </button>
            
            {showDirectExpanded && (
              <div>
                {sortedDirectConversations.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No direct messages found
                  </div>
                ) : (
                  sortedDirectConversations.map(conversation => (
                    <ConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      isSelected={conversation.id === selectedConversationId}
                      currentUserId={currentUserId}
                      onClick={() => onSelectConversation(conversation.id)}
                    />
                  ))
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onCreateNewConversation}
                  className="ml-2 mt-1 text-gray-500 hover:text-gray-700 text-xs flex items-center p-1"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add conversation
                </Button>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// Conversation list item component
function ConversationItem({
  conversation,
  isSelected,
  currentUserId,
  onClick
}: {
  conversation: Conversation;
  isSelected: boolean;
  currentUserId: string;
  onClick: () => void;
}) {
  const otherParticipant = conversation.type === 'direct' 
    ? conversation.participants.find(p => p.id !== currentUserId)
    : null;
  
  const displayName = conversation.type === 'direct' && otherParticipant
    ? otherParticipant.name
    : conversation.name;
  
  const status = otherParticipant?.status || null;
  
  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500'
  };
  
  const lastMessagePreview = conversation.lastMessage 
    ? truncateText(conversation.lastMessage.content, 26)
    : 'No messages yet';
  
  const lastActivityTime = conversation.lastActivity 
    ? formatLastActivity(conversation.lastActivity)
    : '';
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-2 py-1.5 rounded flex items-start gap-3 mb-1 hover:bg-gray-100 transition-colors",
        isSelected ? "bg-blue-100 hover:bg-blue-200" : "bg-transparent",
        conversation.unreadCount > 0 && !isSelected ? "font-medium" : ""
      )}
    >
      <div className="relative flex-shrink-0">
        {conversation.type === 'direct' ? (
          <Avatar className="h-6 w-6">
            {conversation.avatar ? (
              <AvatarImage src={conversation.avatar} alt={displayName} />
            ) : (
              <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                {getInitials(displayName)}
              </AvatarFallback>
            )}
          </Avatar>
        ) : (
          <div className="h-6 w-6 flex items-center justify-center bg-gray-200 rounded text-gray-600">
            <Hash className="h-3.5 w-3.5" />
          </div>
        )}
        
        {status && (
          <span 
            className={cn(
              "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white",
              statusColors[status]
            )}
          />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <p className={cn(
            "text-sm truncate",
            isSelected ? "text-gray-900 font-medium" : "text-gray-800",
            conversation.unreadCount > 0 && !isSelected ? "font-medium" : ""
          )}>
            {displayName}
            {conversation.isMuted && (
              <BellOff className="inline-block ml-1.5 h-3 w-3 text-gray-500" />
            )}
          </p>
          
          {lastActivityTime && (
            <span className={cn(
              "text-xs flex-shrink-0",
              isSelected ? "text-blue-600" : "text-gray-500"
            )}>
              {lastActivityTime}
            </span>
          )}
        </div>
        
        <div className="flex items-center">
          <p className={cn(
            "text-xs truncate flex-1",
            isSelected ? "text-blue-600" : "text-gray-500",
          )}>
            {lastMessagePreview}
          </p>
          
          {conversation.unreadCount > 0 && (
            <Badge className={cn(
              "ml-1.5 h-5 w-5 flex items-center justify-center rounded-full p-0 text-xs text-white",
              isSelected ? "bg-blue-500 hover:bg-blue-500" : "bg-green-500 hover:bg-green-500"
            )}>
              {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
} 
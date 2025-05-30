'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Info, 
  Bell, 
  BellOff, 
  X, 
  FileText, 
  Image as ImageIcon, 
  Link as LinkIcon,
  MoreHorizontal,
  Star,
  StarOff,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Conversation } from './ConversationList';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  title?: string;
  lastActive?: string;
}

interface SharedFile {
  id: string;
  name: string;
  type: 'image' | 'document' | 'link';
  url: string;
  previewUrl?: string;
  size?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface ConversationInfoProps {
  conversation: Conversation;
  currentUserId: string;
}

// Helper function to get initials from name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();
};

export function ConversationInfo({ conversation, currentUserId }: ConversationInfoProps) {
  const [activeTab, setActiveTab] = useState<'about' | 'files' | 'members'>('about');
  
  // Mocked shared files for demo
  const sharedFiles: SharedFile[] = [
    {
      id: '1',
      name: 'Client Documentation.pdf',
      type: 'document',
      url: '#',
      size: '2.3 MB',
      uploadedBy: conversation.participants[0]?.id || '',
      uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() // 2 days ago
    },
    {
      id: '2',
      name: 'Meeting Notes.docx',
      type: 'document',
      url: '#',
      size: '1.1 MB',
      uploadedBy: conversation.participants[1]?.id || currentUserId,
      uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
    },
    {
      id: '3',
      name: 'client_photo.jpg',
      type: 'image',
      url: '#',
      previewUrl: 'https://via.placeholder.com/300x200',
      size: '3.4 MB',
      uploadedBy: conversation.participants[0]?.id || '',
      uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() // 3 hours ago
    },
    {
      id: '4',
      name: 'Resources',
      type: 'link',
      url: 'https://example.com/resources',
      uploadedBy: currentUserId,
      uploadedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
    }
  ];
  
  // Get other participant name for direct messages
  const getConversationTitle = () => {
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(p => p.id !== currentUserId);
      return otherParticipant?.name || 'Direct Message';
    }
    return conversation.name;
  };
  
  // Find a participant by ID
  const findParticipant = (id: string): Participant | undefined => {
    return conversation.participants.find(p => p.id === id);
  };
  
  // Format the participant's role for display
  const formatRole = (role?: string): string => {
    if (!role) return '';
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Get status color
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-gray-400';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">Details</h3>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <MoreHorizontal className="h-5 w-5 text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="flex items-center">
              {conversation.isMuted ? (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  <span>Turn on notifications</span>
                </>
              ) : (
                <>
                  <BellOff className="h-4 w-4 mr-2" />
                  <span>Mute notifications</span>
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center">
              <Star className="h-4 w-4 mr-2" />
              <span>Pin conversation</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center text-red-600">
              <X className="h-4 w-4 mr-2" />
              <span>Leave conversation</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Conversation info with tabs */}
      <Tabs defaultValue="about" className="flex-1 flex flex-col" onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="w-full grid grid-cols-3 rounded-none bg-gray-50 p-0 h-auto">
          <TabsTrigger 
            value="about" 
            className={cn(
              "py-3 rounded-none data-[state=active]:bg-white data-[state=active]:shadow-none",
              activeTab === 'about' ? 'border-b-2 border-blue-500' : 'border-b border-gray-200'
            )}
          >
            About
          </TabsTrigger>
          <TabsTrigger 
            value="members" 
            className={cn(
              "py-3 rounded-none data-[state=active]:bg-white data-[state=active]:shadow-none",
              activeTab === 'members' ? 'border-b-2 border-blue-500' : 'border-b border-gray-200'
            )}
          >
            Members
          </TabsTrigger>
          <TabsTrigger 
            value="files" 
            className={cn(
              "py-3 rounded-none data-[state=active]:bg-white data-[state=active]:shadow-none",
              activeTab === 'files' ? 'border-b-2 border-blue-500' : 'border-b border-gray-200'
            )}
          >
            Files
          </TabsTrigger>
        </TabsList>
        
        <ScrollArea className="flex-1">
          <TabsContent value="about" className="m-0 p-4 h-full">
            <div className="space-y-6">
              {/* Conversation/Channel info */}
              <div className="flex flex-col items-center text-center p-4">
                {conversation.type === 'direct' ? (
                  <Avatar className="h-20 w-20 mb-3">
                    {conversation.avatar ? (
                      <AvatarImage src={conversation.avatar} alt={getConversationTitle()} />
                    ) : (
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                        {getInitials(getConversationTitle())}
                      </AvatarFallback>
                    )}
                  </Avatar>
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Users className="h-10 w-10 text-gray-500" />
                  </div>
                )}
                
                <h3 className="text-xl font-semibold text-gray-900">{getConversationTitle()}</h3>
                
                {conversation.type === 'direct' && (
                  <div className="flex items-center gap-1 mt-1">
                    {(() => {
                      const otherParticipant = conversation.participants.find(p => p.id !== currentUserId);
                      const status = otherParticipant?.status || 'offline';
                      const statusText = status.charAt(0).toUpperCase() + status.slice(1);
                      
                      return (
                        <>
                          <span className={cn(
                            "h-2 w-2 rounded-full",
                            getStatusColor(status)
                          )}></span>
                          <span className="text-sm text-gray-500">{statusText}</span>
                        </>
                      );
                    })()}
                  </div>
                )}
                
                {conversation.type !== 'direct' && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-sm text-gray-500">
                      {conversation.participants.length} members
                    </span>
                  </div>
                )}
                
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="rounded-full text-xs h-8">
                    {conversation.isMuted ? (
                      <>
                        <Bell className="h-3.5 w-3.5 mr-1.5" />
                        Unmute
                      </>
                    ) : (
                      <>
                        <BellOff className="h-3.5 w-3.5 mr-1.5" />
                        Mute
                      </>
                    )}
                  </Button>
                  
                  <Button variant="outline" size="sm" className="rounded-full text-xs h-8">
                    <Star className="h-3.5 w-3.5 mr-1.5" />
                    Pin
                  </Button>
                </div>
              </div>
              
              {/* About section */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">About</h4>
                <p className="text-sm text-gray-700">
                  {conversation.description || 'No description available for this conversation.'}
                </p>
                
                <div className="mt-4 text-sm">
                  <div className="flex items-start py-2">
                    <Clock className="h-4 w-4 text-gray-500 mt-0.5 mr-2" />
                    <div>
                      <p className="text-gray-700">Created</p>
                      <p className="text-gray-500">
                        {formatDistanceToNow(new Date(conversation.createdAt || Date.now()), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="members" className="m-0 p-4 h-full">
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-medium text-gray-500">
                  Members ({conversation.participants.length})
                </h4>
                
                <Button variant="ghost" size="sm" className="h-8 text-xs">
                  <Users className="h-3.5 w-3.5 mr-1.5" />
                  Add
                </Button>
              </div>
              
              {conversation.participants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      {participant.avatar ? (
                        <AvatarImage src={participant.avatar} alt={participant.name} />
                      ) : (
                        <AvatarFallback className={cn(
                          participant.role === 'case_manager' ? "bg-blue-100 text-blue-600" :
                          participant.role === 'provider' ? "bg-green-100 text-green-600" :
                          "bg-purple-100 text-purple-600"
                        )}>
                          {getInitials(participant.name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    
                    {participant.status && (
                      <span 
                        className={cn(
                          "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white",
                          getStatusColor(participant.status)
                        )}
                      />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {participant.name}
                        {participant.id === currentUserId && (
                          <span className="ml-1 text-gray-500 text-xs">(you)</span>
                        )}
                      </p>
                    </div>
                    
                    {participant.role && (
                      <p className="text-xs text-gray-500 truncate">
                        {formatRole(participant.role)}
                      </p>
                    )}
                  </div>
                  
                  {participant.status === 'online' ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 text-xs border-green-200">
                      Active
                    </Badge>
                  ) : participant.lastActive ? (
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(participant.lastActive), { addSuffix: true })}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="files" className="m-0 p-4 h-full">
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-medium text-gray-500">
                  Shared Files ({sharedFiles.length})
                </h4>
                
                <Button variant="ghost" size="sm" className="h-8 text-xs">
                  <FileText className="h-3.5 w-3.5 mr-1.5" />
                  Add File
                </Button>
              </div>
              
              {sharedFiles.map((file) => {
                const uploader = findParticipant(file.uploadedBy);
                
                return (
                  <div key={file.id} className="border border-gray-200 rounded-md overflow-hidden">
                    {file.type === 'image' && file.previewUrl && (
                      <div className="aspect-video bg-gray-100 relative">
                        <img 
                          src={file.previewUrl} 
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="p-3 bg-white">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {file.type === 'document' && (
                            <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
                          )}
                          {file.type === 'link' && (
                            <LinkIcon className="h-5 w-5 text-purple-500 flex-shrink-0" />
                          )}
                          {file.type === 'image' && !file.previewUrl && (
                            <ImageIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                          )}
                          
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">
                              {file.name}
                            </p>
                            
                            {file.size && (
                              <p className="text-xs text-gray-500">
                                {file.size}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full ml-2">
                          <MoreHorizontal className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center text-xs text-gray-500 mt-2">
                        <span>
                          Shared by {uploader?.name || 'Unknown'} 
                          {formatDistanceToNow(new Date(file.uploadedAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
} 
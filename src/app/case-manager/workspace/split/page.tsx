'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { 
  Hash, 
  MessageSquare, 
  FileText, 
  Plus, 
  Search,
  Settings,
  Phone,
  Info,
  Paperclip,
  Smile,
  Send,
  MoreHorizontal,
  Star,
  Video,
  X,
  ChevronRight,
  Users
} from 'lucide-react';
import MessageWithFile from '@/components/workspace/MessageWithFile';

interface SplitThread {
  id: string;
  title: string;
  client: string;
  participants: string[];
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isActive: boolean;
}

interface DetailedMessage {
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

export default function SplitWorkspaceView() {
  const { user } = useAuth();
  const [selectedThreads, setSelectedThreads] = useState<string[]>(['social-media', 'brand-awareness']);
  const [messageInputs, setMessageInputs] = useState<{[key: string]: string}>({});

  const threads: SplitThread[] = [
    {
      id: 'social-media',
      title: 'Social Media Marketing Strategies',
      client: 'Sarah Johnson',
      participants: ['Brandon Franci', 'Alfonso Vaccaro', 'Desirae Lipshutz'],
      lastMessage: "I'd like to start this thread to discuss social media marketing.",
      timestamp: '10:15 PM',
      unreadCount: 0,
      isActive: true
    },
    {
      id: 'brand-awareness',
      title: 'Building Brand Awareness',
      client: 'Michael Chen',
      participants: ['Kalya Lubin', 'Gretchen Bergon'],
      lastMessage: "Sounds like a plan! Let's brainstorm some content ideas!",
      timestamp: '56m',
      unreadCount: 2,
      isActive: false
    }
  ];

  const threadMessages: {[key: string]: DetailedMessage[]} = {
    'social-media': [
      {
        id: '1',
        author: 'Brandon Franci',
        authorType: 'provider',
        content: "I'd like to start this thread to discuss social media marketing.",
        timestamp: '10:49 PM'
      },
      {
        id: '2',
        author: 'Alfonso Vaccaro',
        authorType: 'provider',
        content: "I'm excited to explore strategies with you all 🎯",
        timestamp: '10:52 PM'
      },
      {
        id: '3',
        author: 'Desirae Lipshutz',
        authorType: 'case_manager',
        content: "Great idea! Let's make sure we align with client goals",
        timestamp: '11:05 PM',
        reactions: [
          { emoji: '👍', count: 2, users: ['Brandon Franci', 'Alfonso Vaccaro'] }
        ]
      }
    ],
    'brand-awareness': [
      {
        id: '1',
        author: 'Kalya Lubin',
        authorType: 'provider',
        content: "Hi, everyone! 🔥 Let's discuss building brand awareness!",
        timestamp: '10:15 PM'
      },
      {
        id: '2',
        author: 'Gretchen Bergon',
        authorType: 'provider',
        content: "Sounds like a plan! Let's brainstorm some content ideas!",
        timestamp: '56m',
        attachments: [
          {
            name: 'Brand_Strategy_Template.pdf',
            type: 'application/pdf',
            size: '245 KB'
          }
        ]
      }
    ]
  };

  const getAuthorInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleAddThread = () => {
    // Logic to add another thread to the split view
  };

  const handleCloseThread = (threadId: string) => {
    setSelectedThreads(prev => prev.filter(id => id !== threadId));
  };

  const handleMessageInput = (threadId: string, value: string) => {
    setMessageInputs(prev => ({ ...prev, [threadId]: value }));
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Thread Selector Sidebar */}
      <div className="w-80 bg-[#F8F9FA] border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-3">Active Conversations</h2>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start" 
            onClick={handleAddThread}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add to workspace
          </Button>
        </div>

        <div className="flex-1 p-4 space-y-3">
          {threads.map((thread) => (
            <div 
              key={thread.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedThreads.includes(thread.id) 
                  ? 'bg-blue-100 border-blue-200' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => {
                if (!selectedThreads.includes(thread.id)) {
                  setSelectedThreads(prev => [...prev, thread.id]);
                }
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Hash className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-sm text-gray-900 truncate">
                  {thread.title}
                </span>
                {thread.unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5">
                    {thread.unreadCount}
                  </Badge>
                )}
              </div>
              <div className="text-xs text-gray-600 mb-1">
                Client: {thread.client}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {thread.lastMessage}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {thread.timestamp}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Split Conversations View */}
      <div className="flex-1 flex">
        {selectedThreads.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Hash className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations selected</h3>
              <p className="text-gray-600">Select conversations from the sidebar to view them here</p>
            </div>
          </div>
        ) : (
          selectedThreads.map((threadId, index) => {
            const thread = threads.find(t => t.id === threadId);
            const messages = threadMessages[threadId] || [];
            
            return (
              <div key={threadId} className="flex-1 flex flex-col border-r border-gray-200 min-w-0">
                {/* Thread Header */}
                <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Hash className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate text-sm">
                        {thread?.title}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">
                        {thread?.client}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="p-1">
                      <Users className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-1"
                      onClick={() => handleCloseThread(threadId)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((message) => (
                    <MessageWithFile
                      key={message.id}
                      message={message}
                      showThread={true}
                    />
                  ))}
                </div>

                {/* Message Input */}
                <div className="border-t border-gray-200 p-3">
                  <div className="relative">
                    <Input
                      value={messageInputs[threadId] || ''}
                      onChange={(e) => handleMessageInput(threadId, e.target.value)}
                      placeholder={`Message #${thread?.title}`}
                      className="pr-16 py-2 text-sm"
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="p-1 h-7 w-7">
                        <Paperclip className="h-3 w-3 text-gray-500" />
                      </Button>
                      <Button variant="ghost" size="sm" className="p-1 h-7 w-7">
                        <Smile className="h-3 w-3 text-gray-500" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-1 h-7 w-7" 
                        disabled={!(messageInputs[threadId]?.trim())}
                      >
                        <Send className="h-3 w-3 text-gray-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
} 
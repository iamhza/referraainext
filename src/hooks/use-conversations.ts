'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

export type Participant = {
  id: string;
  name: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  role?: string;
  lastActive?: string;
  title?: string;
};

export type Attachment = {
  id: string;
  type: 'image' | 'document' | 'link';
  name: string;
  url: string;
  size?: string;
  previewUrl?: string;
};

export type Reaction = {
  emoji: string;
  count: number;
  userIds: string[];
};

export type Message = {
  id: string;
  content: string;
  timestamp: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  reactions?: Reaction[];
  formattedContent?: boolean;
  attachments?: Attachment[];
  hasThread?: boolean;
  threadCount?: number;
  isOwn?: boolean; // Indicates if the message was sent by the current user
};

export type LastMessage = {
  content: string;
  timestamp: string;
  senderId: string;
};

export type Conversation = {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: LastMessage;
  unreadCount: number;
  type: 'direct' | 'group';
  participants: Participant[];
  lastActivity: string;
  isPinned?: boolean;
  isMuted?: boolean;
  description?: string;
  createdAt?: string;
  messages?: Message[];
  isLoadingMessages?: boolean;
};

// Generate mock data
const generateMockConversations = (currentUserId: string): Conversation[] => {
  // Common roles
  const roles = ['case_manager', 'provider', 'admin'];

  // Helper to create a participant
  const createParticipant = (id: string, name: string, role: string, status: 'online' | 'offline' | 'away' | 'busy' = 'offline') => ({
    id,
    name,
    status,
    role,
    lastActive: new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 48)).toISOString(),
  });

  // Create some mock participants
  const participants = [
    createParticipant(currentUserId, 'Current User', 'case_manager', 'online'),
    createParticipant('user2', 'Jane Smith', 'provider', 'online'),
    createParticipant('user3', 'Bob Johnson', 'provider', 'away'),
    createParticipant('user4', 'Sarah Williams', 'case_manager', 'offline'),
    createParticipant('user5', 'Michael Brown', 'admin', 'busy'),
  ];

  // Helper to create a message
  const createMessage = (
    senderId: string,
    content: string,
    minutesAgo: number,
    hasReactions = false,
    hasThread = false
  ): Message => {
    const sender = participants.find(p => p.id === senderId) || participants[0];
    
    const message: Message = {
      id: uuidv4(),
      content,
      timestamp: new Date(Date.now() - minutesAgo * 60 * 1000).toISOString(),
      senderId: sender.id,
      senderName: sender.name,
      senderRole: sender.role || 'unknown',
      status: 'read',
      formattedContent: content.includes('*') || content.includes('_') || content.includes('`'),
    };

    if (hasReactions) {
      message.reactions = [
        {
          emoji: '👍',
          count: Math.floor(Math.random() * 3) + 1,
          userIds: [participants[Math.floor(Math.random() * participants.length)].id],
        },
      ];
    }

    if (hasThread) {
      message.hasThread = true;
      message.threadCount = Math.floor(Math.random() * 5) + 1;
    }

    return message;
  };

  // Generate direct conversations
  const directConversations: Conversation[] = [
    {
      id: uuidv4(),
      name: 'Jane Smith',
      type: 'direct',
      participants: [participants[0], participants[1]],
      unreadCount: 3,
      lastActivity: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      description: 'Direct message with Jane Smith, who is a service provider specialized in housing assistance.',
      messages: [
        createMessage('user2', 'Hi there! I just got assigned to the Johnson family case.', 120),
        createMessage(currentUserId, 'Great! They need housing assistance ASAP.', 115),
        createMessage('user2', 'I saw the referral details. Do they have any preferences for location?', 110),
        createMessage(currentUserId, 'They mentioned staying close to the children\'s school in the north district.', 105),
        createMessage('user2', 'Got it. I have a few options we can explore. I\'ll send them over shortly.', 100, true),
        createMessage('user2', 'Here are the housing options I found:\n• 2 bedroom apartment on Maple Street\n• 3 bedroom townhouse on Oak Avenue\n• Small house on Pine Lane with a fenced yard', 95, false, true),
        createMessage(currentUserId, 'These look promising! The townhouse might be the best fit for their needs.', 90),
        createMessage('user2', 'I agree. I\'ll set up a viewing for tomorrow afternoon if that works for them.', 85),
        createMessage(currentUserId, 'Perfect, I\'ll let them know. Thanks for the quick response!', 80, true),
        createMessage('user2', 'No problem! Happy to help. Let me know if anything changes.', 10),
        createMessage('user2', 'Just checking in - were they able to view the property?', 5),
      ],
    },
    {
      id: uuidv4(),
      name: 'Bob Johnson',
      type: 'direct',
      participants: [participants[0], participants[2]],
      unreadCount: 0,
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      isPinned: true,
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
      description: 'Direct message with Bob Johnson, employment specialist helping clients find job opportunities.',
      messages: [
        createMessage(currentUserId, 'Hi Bob, I have a new client who needs job placement assistance', 180),
        createMessage('user3', 'I\'d be happy to help. Can you send me their resume and employment history?', 175),
        createMessage(currentUserId, 'Will do. They have experience in retail and food service.', 170),
        createMessage('user3', 'Great, those are high-demand sectors right now.', 165),
        createMessage(currentUserId, 'They\'re also interested in job training for office work if possible.', 160, true),
        createMessage('user3', 'We have a computer skills program starting next month that would be perfect.', 155),
        createMessage('user3', 'I\'ll also check with some of our employer partners who are hiring.', 130, false, true),
      ],
    },
    {
      id: uuidv4(),
      name: 'Sarah Williams',
      type: 'direct',
      participants: [participants[0], participants[3]],
      unreadCount: 0,
      lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      isMuted: true,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
      description: 'Direct message with Sarah Williams, another case manager from the north district office.',
      messages: [
        createMessage('user4', 'Hey, do you have time to discuss the new referral process?', 2880), // 2 days ago
        createMessage(currentUserId, 'Sure, what\'s up?', 2875),
        createMessage('user4', 'I\'m having trouble with the new system. The forms are confusing.', 2870),
        createMessage(currentUserId, 'I had the same issue. I found that starting with the client info section first helps.', 2865),
        createMessage('user4', 'I\'ll try that approach. Thanks!', 2860),
      ],
    },
  ];

  // Generate group conversations
  const groupConversations: Conversation[] = [
    {
      id: uuidv4(),
      name: 'Housing Assistance Team',
      type: 'group',
      participants: [participants[0], participants[1], participants[2]],
      unreadCount: 5,
      lastActivity: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
      isPinned: true,
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
      description: 'Team channel for coordinating housing assistance services and discussing client needs.',
      messages: [
        createMessage('user2', 'Good morning team! We have three new housing applications to review today.', 120),
        createMessage(currentUserId, 'I\'ll take a look at them this morning.', 115),
        createMessage('user3', 'I can help with the background checks.', 110),
        createMessage('user2', '*Important update*: The city announced a new affordable housing initiative yesterday.', 90, true),
        createMessage('user2', 'Here\'s the link to the program details: `https://example.com/housing-initiative`', 85),
        createMessage(currentUserId, 'This is great news! Many of our clients will qualify for this.', 80),
        createMessage('user3', 'I\'ll create a summary of the eligibility requirements to share with everyone.', 75, false, true),
        createMessage('user2', 'The Martinez family was approved for the Oak Street apartment!', 15),
      ],
    },
    {
      id: uuidv4(),
      name: 'Case Manager Office',
      type: 'group',
      participants: [participants[0], participants[3], participants[4]],
      unreadCount: 0,
      lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(), // 120 days ago
      description: 'Internal channel for case managers to collaborate and share resources.',
      messages: [
        createMessage('user4', 'Reminder: Team meeting tomorrow at 10 AM.', 1500),
        createMessage(currentUserId, 'Will we be discussing the new client intake process?', 1490),
        createMessage('user5', 'Yes, and we\'ll also cover updates to the referral system.', 1480),
        createMessage('user4', 'I\'ve prepared some documentation on the changes. I\'ll share it during the meeting.', 1470),
        createMessage(currentUserId, 'Sounds good. I have some feedback from my recent referrals to share as well.', 1460),
        createMessage('user5', 'Perfect! We want to make sure the new process is working well for everyone.', 1450),
      ],
    },
  ];

  return [...directConversations, ...groupConversations];
};

export function useConversations(userId = 'current_user', userRole = 'case_manager') {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all conversations
  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      try {
        // Fetch conversations from API
        const res = await fetch(`/api/conversations`);
        if (!res.ok) {
          throw new Error('Failed to fetch conversations');
        }
        
        const data = await res.json();
        setConversations(data.conversations);
        
        // Auto-select the first conversation with unread messages, or the first one
        if (data.conversations.length > 0 && !selectedConversationId) {
          const unreadConvo = data.conversations.find((c: Conversation) => c.unreadCount > 0);
          setSelectedConversationId(unreadConvo?.id || data.conversations[0].id);
        }
      } catch (err: any) {
        console.error('Failed to load conversations:', err);
        setError(err.message || 'Failed to load conversations');
        
        // If API fails, fall back to mock data for development
        if (process.env.NODE_ENV === 'development') {
          console.log('Using mock data as fallback');
          const mockData = generateMockConversations(userId);
          setConversations(mockData);
          
          if (mockData.length > 0 && !selectedConversationId) {
            const unreadConvo = mockData.find(c => c.unreadCount > 0);
            setSelectedConversationId(unreadConvo?.id || mockData[0].id);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [userId, selectedConversationId]);

  // Get conversation by ID
  const getConversationById = (id: string): Conversation | null => {
    return conversations.find(c => c.id === id) || null;
  };

  // Get messages for a selected conversation
  const getMessages = async (conversationId: string) => {
    try {
      // Set existing conversation to loading state by updating its messages
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, messages: conv.messages || [], isLoadingMessages: true } 
            : conv
        )
      );
      
      // Fetch messages from API
      const res = await fetch(`/api/messages?conversationId=${conversationId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await res.json();
      
      // Update the conversation with messages
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { 
                ...conv, 
                messages: data.messages,
                unreadCount: 0, // Mark as read
                isLoadingMessages: false
              } 
            : conv
        )
      );
      
      return data.messages;
    } catch (err: any) {
      console.error('Failed to fetch messages:', err);
      toast({
        title: "Failed to load messages",
        description: "Couldn't load conversation messages. Please try again.",
        variant: "destructive",
      });
      
      // Update the conversation to remove loading state
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, isLoadingMessages: false } 
            : conv
        )
      );
      
      return [];
    }
  };

  // Mark conversation as read
  const markAsRead = async (conversationId: string) => {
    try {
      // Optimistically update UI
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unreadCount: 0 } 
            : conv
        )
      );
      
      // When the user views a conversation, we'll fetch the messages which also marks them as read
      await getMessages(conversationId);
    } catch (err) {
      console.error('Failed to mark conversation as read:', err);
    }
  };

  // Send a message
  const sendMessage = async (
    conversationId: string, 
    content: string, 
    attachments?: File[],
    threadId?: string
  ) => {
    if (!content.trim() && (!attachments || attachments.length === 0)) {
      return;
    }

    // Create a temporary ID for the message
    const tempId = uuidv4();
    const now = new Date();
    
    // Find the conversation to update
    const conversation = getConversationById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Create a temporary message for optimistic update
    const tempMessage: Message = {
      id: tempId,
      content: content.trim(),
      timestamp: now.toISOString(),
      senderId: userId,
      senderName: 'You', // Will be updated with real data from API
      senderRole: userRole,
      isOwn: true,
      status: 'sending',
      formattedContent: content.includes('*') || content.includes('_') || content.includes('`'),
      attachments: attachments ? 
        attachments.map(file => ({
          id: uuidv4(),
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'document',
          url: URL.createObjectURL(file),
          size: formatFileSize(file.size),
        })) : 
        undefined
    };
    
    // Update the conversation with the temporary message
    setConversations(prev => 
      prev.map(conv => {
        if (conv.id === conversationId) {
          // If this is a thread reply, update the thread count
          if (threadId) {
            return {
              ...conv,
              messages: conv.messages?.map(msg => {
                if (msg.id === threadId) {
                  return {
                    ...msg,
                    hasThread: true,
                    threadCount: (msg.threadCount || 0) + 1,
                  };
                }
                return msg;
              }) || []
            };
          } else {
            // Add the new message to the conversation
            return {
              ...conv,
              messages: [...(conv.messages || []), tempMessage],
              lastMessage: {
                content: content,
                timestamp: now.toISOString(),
                senderId: userId,
              },
              lastActivity: now.toISOString(),
            };
          }
        }
        return conv;
      })
    );

    // Actually send the message to the API
    try {
      const formData = new FormData();
      
      // If there are attachments, handle file uploads
      if (attachments && attachments.length > 0) {
        // In a real implementation, you'd upload files to a storage service
        // For now, we'll just simulate it
        // TODO: Implement file uploads to your storage service
      }
      
      // Prepare the message data
      const messageData = {
        conversationId,
        content,
        threadId: threadId || undefined,
        attachments: attachments ? 
          attachments.map(file => ({
            name: file.name,
            type: file.type.startsWith('image/') ? 'image' : 'document',
            // In a real app, this would be the URL from your file upload service
            url: `/api/mock-file-url/${file.name}`,
            size: formatFileSize(file.size),
          })) : 
          undefined
      };
      
      // Send the message
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });
      
      if (!res.ok) {
        throw new Error('Failed to send message');
      }
      
      const responseData = await res.json();
      
      // Update the message status with the real message from the API
      setConversations(prev => 
        prev.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              messages: conv.messages?.map(msg => 
                msg.id === tempId ? { ...responseData.messageData, status: 'sent' } : msg
              ) || [],
            };
          }
          return conv;
        })
      );
      
      // Update message status after some delay to simulate delivery/read
      simulateMessageStatus(conversationId, responseData.messageData.id);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Update the message status to error
      setConversations(prev => 
        prev.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              messages: conv.messages?.map(msg => 
                msg.id === tempId ? { ...msg, status: 'error' } : msg
              ) || [],
            };
          }
          return conv;
        })
      );
      
      toast({
        title: "Failed to send message",
        description: "Your message could not be sent. Please try again.",
        variant: "destructive",
      });
      
      throw error;
    }
  };
  
  // Helper to simulate message status updates
  const simulateMessageStatus = (conversationId: string, messageId: string) => {
    // Simulate delivered status after 1 second
    setTimeout(() => {
      setConversations(prev => 
        prev.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              messages: conv.messages?.map(msg => 
                msg.id === messageId ? { ...msg, status: 'delivered' } : msg
              ) || [],
            };
          }
          return conv;
        })
      );
      
      // Simulate read status after another 2 seconds
      setTimeout(() => {
        setConversations(prev => 
          prev.map(conv => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                messages: conv.messages?.map(msg => 
                  msg.id === messageId ? { ...msg, status: 'read' } : msg
                ) || [],
              };
            }
            return conv;
          })
        );
      }, 2000);
    }, 1000);
  };

  // Toggle reaction on a message
  const toggleReaction = async (conversationId: string, messageId: string, emoji: string) => {
    try {
      // Optimistically update UI
      setConversations(prev => 
        prev.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              messages: conv.messages?.map(msg => {
                if (msg.id === messageId) {
                  // Check if message already has reactions
                  if (!msg.reactions) {
                    return {
                      ...msg,
                      reactions: [{
                        emoji,
                        count: 1,
                        userIds: [userId],
                      }],
                    };
                  }
                  
                  // Check if user already reacted with this emoji
                  const existingReaction = msg.reactions.find(r => r.emoji === emoji);
                  if (existingReaction) {
                    if (existingReaction.userIds.includes(userId)) {
                      // Remove user's reaction
                      if (existingReaction.count <= 1) {
                        // Remove the reaction completely if it's the only one
                        return {
                          ...msg,
                          reactions: msg.reactions.filter(r => r.emoji !== emoji),
                        };
                      } else {
                        // Decrement the count
                        return {
                          ...msg,
                          reactions: msg.reactions.map(r => 
                            r.emoji === emoji 
                              ? { 
                                  ...r, 
                                  count: r.count - 1,
                                  userIds: r.userIds.filter(id => id !== userId),
                                }
                              : r
                          ),
                        };
                      }
                    } else {
                      // Add user to existing reaction
                      return {
                        ...msg,
                        reactions: msg.reactions.map(r => 
                          r.emoji === emoji 
                            ? { 
                                ...r, 
                                count: r.count + 1,
                                userIds: [...r.userIds, userId],
                              }
                            : r
                        ),
                      };
                    }
                  } else {
                    // Add new reaction type
                    return {
                      ...msg,
                      reactions: [
                        ...msg.reactions,
                        {
                          emoji,
                          count: 1,
                          userIds: [userId],
                        },
                      ],
                    };
                  }
                }
                return msg;
              }) || [],
            };
          }
          return conv;
        })
      );
      
      // Send to API
      const res = await fetch('/api/messages/reactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageId, emoji }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to update reaction');
      }
      
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
      toast({
        title: "Failed to update reaction",
        description: "Could not update your reaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Create a new conversation
  const createNewConversation = async (params?: {
    name: string;
    type: 'direct' | 'group';
    participantIds: string[];
    description?: string;
  }) => {
    try {
      if (!params) {
        toast({
          title: "Coming Soon",
          description: "Creating new conversations will be available soon.",
        });
        return;
      }
      
      // Send to API
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      
      if (!res.ok) {
        throw new Error('Failed to create conversation');
      }
      
      const data = await res.json();
      
      // Refresh conversations
      const conversationsRes = await fetch(`/api/conversations`);
      if (!conversationsRes.ok) {
        throw new Error('Failed to fetch conversations');
      }
      
      const conversationsData = await conversationsRes.json();
      setConversations(conversationsData.conversations);
      
      // Select the new conversation
      setSelectedConversationId(data.conversationId);
      
      toast({
        title: "Conversation Created",
        description: "Your new conversation has been created.",
      });
      
    } catch (error) {
      console.error('Failed to create conversation:', error);
      toast({
        title: "Failed to Create Conversation",
        description: "Could not create a new conversation. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    conversations,
    selectedConversationId,
    setSelectedConversationId,
    getConversationById,
    sendMessage,
    markAsRead,
    toggleReaction,
    createNewConversation,
    loading,
    error,
    getMessages,
  };
}

// Helper to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 
// User types
export type UserRole = 'case_manager' | 'provider' | 'admin';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
}

// Messaging types
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'error';

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  timestamp: string;
  status: MessageStatus;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'document';
  name: string;
  url: string;
  size?: string;
}

export type ConversationType = 'direct' | 'group' | 'referral';

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string;
  participants: ConversationParticipant[];
  lastMessage?: {
    content: string;
    timestamp: string;
    isRead: boolean;
  };
  unreadCount: number;
  referralId?: string;
  referralType?: string;
  clientName?: string;
}

export interface ConversationParticipant {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

// Add other existing types from your application below 
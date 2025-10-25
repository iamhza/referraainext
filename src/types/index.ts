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

import { 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  UserCheck, 
  Activity 
} from 'lucide-react';

// Official referral status definitions
export type ReferralStatus = 
  // Flow States
  | 'draft'                  // Case manager started referral form but hasn't submitted
  | 'submitted'              // Referral officially submitted
  | 'matched'                // Platform/admin/AI provides shortlist of providers
  | 'sent_to_provider'       // Case manager selects a provider and referral is delivered
  | 'accepted'               // Provider accepts referral
  | 'active'                 // Services started (distinct from accepted)
  | 'completed'              // Services finished and referral closed
  
  // Stop States
  | 'rejected'               // Provider declined
  | 'cancelled'              // Case manager/org withdrew
  | 'expired';               // Referral timed out with no action

// Client status definitions for board columns
export type ClientStatus = 
  | 'UNPLACED'               // Unplaced - no referrals sent yet
  | 'REFERRAL_SENT'          // Referral Sent - referrals sent but not yet in process
  | 'IN_PROCESS'             // In Process - referrals being processed
  | 'ACTIVE_STABLE'          // Active – Stable - receiving services, stable
  | 'ACTIVE_NEEDS_ATTENTION' // Active – Needs Attention - receiving services but needs attention
  | 'CLOSED_DISCHARGED'      // Closed/Discharged - services completed or discharged
  // Legacy support
  | 'ACTIVE_FRUSTRATED'      // Legacy: maps to ACTIVE_NEEDS_ATTENTION
  | 'UNPLACED_NEW';          // Legacy: maps to UNPLACED

// Official status flow mapping with all UI properties
export const STATUS_FLOW = {
  // Flow States
  draft: {
    label: 'Draft',
    description: 'Case manager started referral form but hasn\'t submitted',
    nextStatuses: ['submitted', 'cancelled'],
    color: 'gray',
    icon: Clock,
    progressValue: 10,
    className: 'bg-gray-100 text-gray-800 border-gray-200'
  },
  submitted: {
    label: 'Submitted',
    description: 'Referral officially submitted',
    nextStatuses: ['matched', 'expired', 'cancelled'],
    color: 'blue',
    icon: AlertCircle,
    progressValue: 20,
    className: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  matched: {
    label: 'Matched',
    description: 'Platform/admin/AI provides shortlist of providers',
    nextStatuses: ['sent_to_provider', 'expired', 'cancelled'],
    color: 'purple',
    icon: UserCheck,
    progressValue: 40,
    className: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  sent_to_provider: {
    label: 'Sent to Provider',
    description: 'Case manager selects a provider and referral is delivered',
    nextStatuses: ['accepted', 'rejected', 'expired'],
    color: 'blue',
    icon: Clock,
    progressValue: 60,
    className: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  accepted: {
    label: 'Accepted',
    description: 'Provider accepts referral',
    nextStatuses: ['active', 'cancelled'],
    color: 'green',
    icon: CheckCircle,
    progressValue: 75,
    className: 'bg-green-100 text-green-800 border-green-200'
  },
  active: {
    label: 'Active',
    description: 'Services started (distinct from accepted)',
    nextStatuses: ['completed', 'cancelled'],
    color: 'green',
    icon: Activity,
    progressValue: 90,
    className: 'bg-green-100 text-green-800 border-green-200'
  },
  completed: {
    label: 'Completed',
    description: 'Services finished and referral closed',
    nextStatuses: [],
    color: 'green',
    icon: CheckCircle,
    progressValue: 100,
    className: 'bg-green-100 text-green-800 border-green-200'
  },
  
  // Stop States
  rejected: {
    label: 'Rejected',
    description: 'Provider declined',
    nextStatuses: ['cancelled'],
    color: 'red',
    icon: XCircle,
    progressValue: 0,
    className: 'bg-red-100 text-red-800 border-red-200'
  },
  cancelled: {
    label: 'Cancelled',
    description: 'Case manager/org withdrew',
    nextStatuses: [],
    color: 'red',
    icon: XCircle,
    progressValue: 0,
    className: 'bg-red-100 text-red-800 border-red-200'
  },
  expired: {
    label: 'Expired',
    description: 'Referral timed out with no action',
    nextStatuses: ['cancelled'],
    color: 'gray',
    icon: Clock,
    progressValue: 0,
    className: 'bg-gray-100 text-gray-800 border-gray-200'
  }
} as const;

// Client status configuration for board columns
export const CLIENT_STATUS_CONFIG = {
  UNPLACED: {
    label: 'Seeking Services',
    description: 'Client needs services, no referrals sent yet',
    color: 'red',
    icon: AlertCircle,
    className: 'bg-red-100 text-red-800 border-red-200'
  },
  REFERRAL_SENT: {
    label: 'Referrals Pending',
    description: 'Waiting for provider response',
    color: 'blue',
    icon: Clock,
    className: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  IN_PROCESS: {
    label: 'Getting Connected',
    description: 'Provider accepted, intake in progress',
    color: 'purple',
    icon: Activity,
    className: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  ACTIVE_STABLE: {
    label: 'Services Active',
    description: 'Client is successfully receiving services',
    color: 'green',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 border-green-200'
  },
  ACTIVE_NEEDS_ATTENTION: {
    label: 'Services At Risk',
    description: 'Services broken down or stalled, intervention needed',
    color: 'yellow',
    icon: AlertCircle,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  CLOSED_DISCHARGED: {
    label: 'Case Closed',
    description: 'Services completed or client discharged',
    color: 'gray',
    icon: XCircle,
    className: 'bg-gray-100 text-gray-800 border-gray-200'
  }
} as const;

// Helper function to get status config
export function getStatusConfig(status: ReferralStatus) {
  return STATUS_FLOW[status] || STATUS_FLOW.draft;
}

// Helper function to get client status config
export function getClientStatusConfig(status: ClientStatus) {
  // Handle legacy status mapping
  let mappedStatus = status;
  if (status === 'ACTIVE_FRUSTRATED') mappedStatus = 'ACTIVE_NEEDS_ATTENTION';
  if (status === 'UNPLACED_NEW') mappedStatus = 'UNPLACED';
  
  return CLIENT_STATUS_CONFIG[mappedStatus as keyof typeof CLIENT_STATUS_CONFIG] || CLIENT_STATUS_CONFIG.UNPLACED;
}

// Helper function to check if status is active (not completed/cancelled/rejected/expired)
export function isActiveStatus(status: ReferralStatus): boolean {
  return !['completed', 'cancelled', 'rejected', 'expired'].includes(status);
}

// Helper function to check if client status needs attention
export function clientNeedsAttention(status: ClientStatus): boolean {
  return ['UNPLACED', 'ACTIVE_NEEDS_ATTENTION'].includes(status);
}

// Helper function to check if client is actively receiving services
export function clientIsActive(status: ClientStatus): boolean {
  return ['ACTIVE_STABLE', 'ACTIVE_NEEDS_ATTENTION'].includes(status);
}

// Helper function to check if status needs case manager attention
export function needsCaseManagerAttention(status: ReferralStatus): boolean {
  return ['draft', 'selection_required', 'sent_to_provider'].includes(status);
}

// Helper function to check if status needs provider attention
export function needsProviderAttention(status: ReferralStatus): boolean {
  return ['sent_to_provider', 'accepted', 'active'].includes(status);
}

// Add other existing types from your application below 
import 'react';
import type { Connection } from '@/types/actions';

// Ensure JSX namespace is properly defined
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// Add missing module declarations
declare module 'lucide-react';
declare module 'next/link';
declare module 'next/navigation';
declare module 'react';
declare module 'react/jsx-runtime';

// Add any global type declarations here 

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

export interface Client {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex?: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | 'other';
  email?: string;
  phone: string;
  preferredContactMethod: 'email' | 'phone' | 'both';
  
  // Address Information
  address: string | {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  city: string;
  state: string;
  zipCode: string;
  county?: string;
  
  // Insurance Information
  insurance?: {
    type: 'medicaid' | 'medicare' | 'private' | 'none';
    provider?: string;
    number?: string;
  };
  insuranceProvider?: string;
  insuranceNumber?: string;
  pmiNumber?: string;
  waiverType?: string;
  
  // Additional Information
  primaryLanguage?: string;
  needsTranslator?: boolean;
  historyOfViolence?: boolean;
  mobilityStatus?: 'ambulatory' | 'wheelchair-bound' | 'bed-bound' | 'other';
  livingSituation?: 'alone' | 'with-family' | 'group-setting' | 'other';
  primaryDiagnosis?: string;
  culturalConsiderations?: string;
  additionalNotes?: string;
  
  // Status and tracking
  status?: ClientStatus;
  
  // Provider relationship fields
  currentProvider?: string;
  linkedProviderId?: string;
  providerOnboarded?: boolean;
  providerInfo?: {
    id: string;
    name?: string;
    organization?: string;
    email?: string;
  };
  
  // Profile completion tracking
  profileComplete?: boolean;
  
  tasks?: Array<{
    _id: string;
    title: string;
    description?: string;
    completed: boolean;
    dueDate?: string;
    createdAt: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
  source?: string;
  referralDate?: string;
  createdBy?: string;
  caseManagerId?: string;
  caseManager?: {
    id: string;
    name?: string;
    email?: string;
  };
  notes?: string;
  
  // Pending connection tracking
  hasPendingConnection?: boolean;
  pendingConnectionId?: string;
  
  // NEW: ServiceConnection fields
  pmi?: string;
  serviceType?: string;
  serviceType1?: string;
  
  // Board dashboard enhancements
  activeReferrals?: number;
  pendingReferrals?: number;
  unreadMessages?: number;
  
  // Assignment tracking
  assignedBy?: string;
  assignedAt?: string;
  
  // COMPUTED FIELDS (populated by data layer for enhanced client cards)
  referralSummary?: {
    active: number;
    pending: number;
    total: number;
    latest?: {
      status: string;
      date: string;
      serviceType?: string;
    };
  };
  connectionSummary?: {
    active: Connection[];
    count: number;
    primary?: Connection;
    hasMultiple: boolean;
  };
  lastActivitySummary?: {
    type: 'referral' | 'connection' | 'update' | 'action';
    date: string;
    description: string;
    relativeTime: string;
  };
  primaryWaiverType?: string; // Computed from connections or referrals
  
  // NEW: Smart Status System - Computed from actions library
  smartStatus?: {
    text: string;
    subtext?: string;
    color: 'red' | 'orange' | 'yellow' | 'gray';
    urgencyScore: number;
    actionId: string;
    actionType: string;
    serviceContext?: string;
    dueDate?: string;
  };
}

export interface ClientRelationship {
  clientId: string;
  providerId: string;
  status: 'active' | 'inactive' | 'pending';
  startDate: string;
  endDate?: string;
  notes?: string;
  lastUpdate?: string;
}

export interface RelationshipEvent {
  id: string;
  clientId: string;
  providerId?: string;
  type: 'referral_created' | 'provider_accepted' | 'service_started' | 'milestone' | 'service_ended';
  title: string;
  description: string;
  date: string;
  isRecent?: boolean;
  actions?: { type: string; label: string }[];
} 
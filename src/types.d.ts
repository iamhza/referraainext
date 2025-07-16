import 'react';

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

export type ClientStatus = 'ACTIVE_STABLE' | 'ACTIVE_FRUSTRATED' | 'UNPLACED_NEW';

export interface Client {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email?: string;
  phone: string;
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
  preferredContactMethod: string;
  status?: ClientStatus;
  
  // Provider relationship fields
  currentProvider?: string;
  linkedProviderId?: string;
  providerOnboarded?: boolean;
  
  // Profile completion tracking
  profileComplete?: boolean;
  
  insurance?: {
    type: string;
    provider?: string;
    number?: string;
  };
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
  caseManagerId?: string;
  notes?: string;
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
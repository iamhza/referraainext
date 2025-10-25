import { Clock, Play, Pause, CheckCircle, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type ServiceRelationshipStatus =
  | 'REFERRAL_SENT'
  | 'PENDING_START'
  | 'ACTIVE'
  | 'PAUSED'
  | 'CLOSED';

interface ServiceRelationshipStatusConfig {
  label: string;
  description: string;
  color: 'blue' | 'amber' | 'green' | 'orange' | 'slate';
  icon: LucideIcon;
  gradient: string;
  textColor: string;
  borderColor: string;
  dotColor: string;
  badgeClass: string;
}

export const SERVICE_RELATIONSHIP_STATUS_CONFIG: Record<ServiceRelationshipStatus, ServiceRelationshipStatusConfig> = {
  REFERRAL_SENT: {
    label: 'Referral Sent',
    description: 'Referral sent to provider, awaiting response',
    color: 'blue',
    icon: Clock,
    gradient: 'bg-gradient-to-br from-blue-50 to-blue-100/50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200/60',
    dotColor: 'bg-blue-500',
    badgeClass: 'bg-gradient-to-br from-blue-50 to-blue-100/50 text-blue-700 border-blue-200/60',
  },
  PENDING_START: {
    label: 'Pending Start',
    description: 'Provider accepted, intake/onboarding in progress',
    color: 'amber',
    icon: Play,
    gradient: 'bg-gradient-to-br from-amber-50 to-amber-100/50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200/60',
    dotColor: 'bg-amber-500',
    badgeClass: 'bg-gradient-to-br from-amber-50 to-amber-100/50 text-amber-700 border-amber-200/60',
  },
  ACTIVE: {
    label: 'Active',
    description: 'Service is actively being delivered',
    color: 'green',
    icon: CheckCircle,
    gradient: 'bg-gradient-to-br from-green-50 to-green-100/50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200/60',
    dotColor: 'bg-green-500',
    badgeClass: 'bg-gradient-to-br from-green-50 to-green-100/50 text-green-700 border-green-200/60',
  },
  PAUSED: {
    label: 'Paused',
    description: 'Service temporarily halted (hospitalization, client request, etc.)',
    color: 'purple',
    icon: Pause,
    gradient: 'bg-gradient-to-br from-purple-50 to-purple-100/50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200/60',
    dotColor: 'bg-purple-500',
    badgeClass: 'bg-gradient-to-br from-purple-50 to-purple-100/50 text-purple-700 border-purple-200/60',
  },
  CLOSED: {
    label: 'Closed',
    description: 'Service ended, client discharged or completed',
    color: 'slate',
    icon: XCircle,
    gradient: 'bg-gradient-to-br from-slate-50 to-slate-100/50',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-200/60',
    dotColor: 'bg-slate-400',
    badgeClass: 'bg-gradient-to-br from-slate-50 to-slate-100/50 text-slate-700 border-slate-200/60',
  },
} as const;

export function getServiceRelationshipStatusConfig(status: ServiceRelationshipStatus) {
  return SERVICE_RELATIONSHIP_STATUS_CONFIG[status] || SERVICE_RELATIONSHIP_STATUS_CONFIG.CLOSED;
}

/**
 * Service Relationship (Production-Ready v1.1)
 * 
 * Clean, normalized data structure with NO denormalized fields.
 * All names are fetched via joins in the API layer.
 */
export interface ServiceRelationship {
  _id: string;
  organizationId: string;         // Multi-tenant isolation
  
  // Foreign Keys - Single Source of Truth
  clientId: string;               // FK → clients
  providerId: string;             // FK → providers
  serviceId: string;              // FK → services
  caseManagerMemberId: string;    // FK → org_members (v1.1)
  
  // Relationship-Specific Data
  status: ServiceRelationshipStatus;
  
  // Optional Status Details
  pendingReason?: 'AWAITING_DOCS' | 'AWAITING_CONSENT' | 'AWAITING_STAFFING' | 'SCHEDULING_INTAKE';
  pauseReason?: 'TEMP_HOLD' | 'HOSPITALIZED' | 'CLIENT_UNAVAILABLE' | 'PROVIDER_UNAVAILABLE';
  closeReason?: 'GOALS_MET' | 'FUNDING_ENDED' | 'CLIENT_MOVED' | 'PROVIDER_SWITCH';
  
  // Note: Flags have been replaced by the issues collection (see src/types/issues.ts)
  
  // Dates
  startDate?: string;
  endDate?: string;
  lastActivityAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Service (Production-Ready v1.1)
 * 
 * Service catalog with multi-tenancy support.
 */
export interface Service {
  _id: string;
  name: string;
  category: string;
  id: string;                     // Human-readable ID (e.g., 'ihs_without_training')
  residential: boolean;
  
  // Multi-Tenancy
  organizationId: string | null;  // null = platform-wide, set = org-specific
  isActive: boolean;              // Soft delete/disable
  
  createdAt: string;
  updatedAt: string;
}

/**
 * Service Relationship with Joined Data (API Response)
 * 
 * This is what the API returns after joining with clients, providers, and services.
 * Names are computed dynamically, not stored in the database.
 */
export interface ServiceRelationshipWithDetails extends ServiceRelationship {
  // Joined from clients collection
  client?: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  
  // Joined from providers collection
  providerName?: string;
  
  // Joined from services collection
  serviceName?: string;
  serviceCategory?: string;
}

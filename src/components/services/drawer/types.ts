// Types for Service Detail Drawer (v1.1 Model)

export interface ServiceDrawerProps {
  serviceRelationshipId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export interface ServiceDetails {
  _id: string;
  clientId: string;
  providerId: string;
  serviceType: string;
  status: 'PENDING_START' | 'ACTIVE' | 'PAUSED' | 'CLOSED';
  
  // Populated fields
  clientName: string;
  providerName: string;
  serviceName?: string;
  
  // Provider contact
  providerEmail?: string;
  providerPhone?: string;
  
  // Dates
  startDate?: string;
  endDate?: string;
  lastActivityAt?: string;
  
  // Counts
  activeIssuesCount?: number;
  openActionsCount?: number;
  documentsCount?: number;
  
  // Authorization
  authorization?: {
    status: string;
    startDate?: string;
    endDate?: string;
    units?: number;
    daysUntilExpiration?: number;
  };
  
  // Reasons
  pendingReason?: 'AWAITING_DOCS' | 'AWAITING_CONSENT' | 'AWAITING_STAFFING' | 'SCHEDULING_INTAKE';
  pauseReason?: 'TEMP_HOLD' | 'HOSPITALIZED' | 'CLIENT_UNAVAILABLE' | 'PROVIDER_UNAVAILABLE';
  closeReason?: 'GOALS_MET' | 'FUNDING_ENDED' | 'CLIENT_MOVED' | 'PROVIDER_SWITCH';
}

export interface ServiceMessage {
  _id: string;
  content: string;
  senderName: string;
  senderType: 'CASE_MANAGER' | 'PROVIDER_USER';
  linkedIssue?: {
    _id: string;
    type: string;
    status: string;
  };
  isIssueTrigger?: boolean;
  createdAt: string;
}

export type ServiceTab = 'overview' | 'messages' | 'issues' | 'documents';


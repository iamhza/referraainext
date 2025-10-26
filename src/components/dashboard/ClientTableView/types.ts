import type { Client as ClientType } from '@/types';
import type { ServiceRelationship, ServiceRelationshipStatus } from '@/types/service-relationships';

// Authorization status types
export type AuthorizationStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'DENIED' | 'EXPIRED';

// Extended service relationship with client and provider details
export interface ServiceRelationshipWithDetails extends ServiceRelationship {
  client: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  } | null;
  providerName: string;
  serviceName?: string;
  serviceCategory?: string;
  authorization?: {
    _id?: string;
    status: AuthorizationStatus;
    units?: number;
    unitType?: string;
    startDate?: string;
    endDate?: string;
    approvalNumber?: string;
    fundingSource?: string;
    notes?: string;
    daysUntilExpiration?: number;
  };
  openActionsCount?: number;
  documentsCount?: number;
  activeIssuesCount?: number;
  phiReleased?: {
    at: string;
    byMemberId: string;
  };
}

// Client group with aggregated service data
export interface ClientGroup {
  clientId: string;
  client: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  services: ServiceRelationshipWithDetails[];
  totalServices: number;
  totalActiveIssues: number;
  totalOpenActions: number;
  totalDocuments: number;
}

// Provider summary for a client group
export interface ProviderSummary {
  count: number;
  names: string[];
  isSingle: boolean;
  isMultiple: boolean;
  isEmpty: boolean;
}

// Authorization summary for a client group
export interface AuthorizationSummary {
  approved: number;
  pending: number;
  denied: number;
  expired: number;
  draft: number;
  none: number;
  totalActive: number;
  hasMixed: boolean;
}

// Status summary for a client group
export interface StatusSummary {
  counts: Record<ServiceRelationshipStatus, number>;
  total: number;
  isSingle: boolean;
  isMultiple: boolean;
}

// Component props
export interface ClientTableViewProps {
  onClientsLoaded?: (count: number, clients?: ClientType[]) => void;
  refreshTrigger?: number;
  className?: string;
  clientToOpen?: { clientId: string; actionId?: string } | null;
  onClientOpened?: () => void;
}

export interface ClientSummaryRowProps {
  group: ClientGroup;
  isExpanded: boolean;
  onToggleExpand: (e: React.MouseEvent) => void;
  onClientClick: () => void;
  index: number;
}

export interface ServiceRowProps {
  service: ServiceRelationshipWithDetails;
  index: number;
  isLastService: boolean;
  onStatusChange: (serviceId: string, newStatus: string) => void;
  onRaiseIssue: () => void;
  onViewDetails: () => void;
  onEditAuth: () => void;
}

export interface AuthorizationCellProps {
  authorization?: ServiceRelationshipWithDetails['authorization'];
}

export interface ServiceActionsMenuProps {
  service: ServiceRelationshipWithDetails;
  onViewDetails: () => void;
  onMessage: () => void;
  onRaiseIssue: () => void;
  onEditAuth: () => void;
}

export interface ClientTableModalsProps {
  // Issue dialog
  issueDialogOpen: boolean;
  setIssueDialogOpen: (open: boolean) => void;
  selectedServiceForIssue: ServiceRelationshipWithDetails | null;
  setSelectedServiceForIssue: (service: ServiceRelationshipWithDetails | null) => void;
  
  // Service drawer
  serviceDrawerOpen: boolean;
  setServiceDrawerOpen: (open: boolean) => void;
  selectedServiceForDrawer: string | null;
  setSelectedServiceForDrawer: (id: string | null) => void;
  
  // Auth modal
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  selectedServiceForAuth: ServiceRelationshipWithDetails | null;
  setSelectedServiceForAuth: (service: ServiceRelationshipWithDetails | null) => void;
  
  // Client drawer
  clientDrawerOpen: boolean;
  setClientDrawerOpen: (open: boolean) => void;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  
  // Refresh function
  onRefresh: () => void;
}


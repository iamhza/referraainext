// Types based on Referra Data Model v1.1

export interface Client {
  _id: string;
  organizationId: string;
  status: 'ACTIVE' | 'INACTIVE';
  identity: {
    firstName: string;
    lastName: string;
    dob: string;
    externalId?: string;
  };
  contact: {
    address: {
      line1: string;
      city: string;
      state: string;
      zip: string;
      county?: string;
    };
    phone?: string;
    email?: string;
  };
  bands: {
    language?: string;
    accessibility?: string[];
  };
  clinical: {
    primaryDiagnosis?: string;
    mentalHealthNeeds?: string;
    physicalLimitations?: string;
  };
  insurance?: {
    type: 'medicaid' | 'medicare' | 'private' | 'none';
    provider?: string;
    number?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRelationship {
  _id: string;
  organizationId: string;
  clientId: string;
  providerId: string;
  serviceType: string;
  caseManagerMemberId: string;
  clientName: string;
  providerName: string;
  status: 'PENDING_START' | 'ACTIVE' | 'PAUSED' | 'CLOSED';
  pendingReason?: 'AWAITING_DOCS' | 'AWAITING_CONSENT' | 'AWAITING_STAFFING' | 'SCHEDULING_INTAKE';
  pauseReason?: 'TEMP_HOLD' | 'HOSPITALIZED' | 'CLIENT_UNAVAILABLE' | 'PROVIDER_UNAVAILABLE';
  closeReason?: 'GOALS_MET' | 'FUNDING_ENDED' | 'CLIENT_MOVED' | 'PROVIDER_SWITCH';
  phiReleased?: {
    at: string;
    byMemberId: string;
  };
  startDate?: string;
  endDate?: string;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientDrawerProps {
  clientId: string;
  open: boolean;
  onClose: () => void;
}

export type ClientDrawerTab = 'profile' | 'services' | 'documents' | 'timeline';


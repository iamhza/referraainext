/**
 * Service Messages Types (v1.1)
 * Secure communication between case managers and providers
 */

export const SENDER_TYPES = ['CASE_MANAGER', 'PROVIDER_USER'] as const;
export type SenderType = typeof SENDER_TYPES[number];

export interface ServiceMessage {
  _id: string;
  organizationId: string;
  serviceRelationshipId: string;
  clientId: string;
  
  content: string;
  
  // Sender identity
  senderMemberId: string;
  senderType: SenderType;
  
  // Issue escalation
  linkedIssueId?: string;
  isIssueTrigger?: boolean;
  
  // Read tracking
  readAt?: Date | string;
  readByMemberId?: string;
  
  // Attachments (future)
  attachmentUris?: string[];
  
  createdAt: Date | string;
}

// Message with sender details populated
export interface ServiceMessageWithDetails extends ServiceMessage {
  senderName: string;
  senderEmail?: string;
  
  // If linked to issue
  linkedIssue?: {
    _id: string;
    type: string;
    status: string;
    createdAt: string;
  };
}

// Create message payload
export interface CreateMessagePayload {
  content: string;
  linkedIssueId?: string;
}

// Update message payload (for linking to issue after creation)
export interface UpdateMessagePayload {
  linkedIssueId?: string;
  isIssueTrigger?: boolean;
}

// For "Raise Issue from Message" feature
export interface MessageToIssuePayload {
  messageId: string;
  issueType: 'QUALITY_CONCERN' | 'INCIDENT_REVIEW' | 'FUNDING_ISSUE' | 'OTHER';
  additionalContext?: string;
}


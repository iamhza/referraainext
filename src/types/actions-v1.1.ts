/**
 * Actions v1.1 - Simplified Action System
 * 
 * Reduced from 18 complex action types to 4 simple types:
 * - REQUEST_INTAKE (intake scheduling)
 * - REQUEST_UPDATE (progress updates)
 * - REQUEST_DOCUMENT (documentation requests)
 * - GENERAL_MESSAGE (everything else)
 */

// V1.1 Simplified Action Types
export type ActionTypeV1_1 =
  | 'REQUEST_INTAKE'
  | 'REQUEST_UPDATE'
  | 'REQUEST_DOCUMENT'
  | 'GENERAL_MESSAGE';

// Status (simplified)
export type ActionStatusV1_1 =
  | 'OPEN'
  | 'COMPLETED'
  | 'CANCELLED';

// Priority (simplified)
export type ActionPriorityV1_1 =
  | 'NORMAL'
  | 'HIGH'
  | 'CRITICAL';

// Subject type (what the action is about)
export type SubjectType =
  | 'SERVICE_RELATIONSHIP' // Most common - action about a specific service connection
  | 'CLIENT'               // General client action (not service-specific)
  | 'REFERRAL';            // Pre-connection referral

// V1.1 Action Structure
export interface ActionV1_1 {
  _id: string;
  organizationId: string;
  
  // Subject (what this action is about)
  subjectType: SubjectType;
  subjectId: string; // service_relationship_id, client_id, or referral_id
  
  // Action details
  type: ActionTypeV1_1;
  status: ActionStatusV1_1;
  priority: ActionPriorityV1_1;
  
  // Request payload (what was requested)
  requestPayload: {
    notes: string;
    docType?: string;        // For REQUEST_DOCUMENT
    scheduledDate?: Date;    // For REQUEST_INTAKE
    [key: string]: any;      // Custom fields
  };
  
  // Response payload (provider's response)
  responsePayload?: {
    notes: string;
    documentId?: string;     // Link to uploaded document
    [key: string]: any;      // Custom fields
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  dueAt?: Date;              // Renamed from targetDate
  completedAt?: Date;
  
  // Created by
  createdByMemberId: string;     // References org_members
  completedByMemberId?: string;  // References org_members
}

// Action Library (simplified)
export interface ActionDefinitionV1_1 {
  id: ActionTypeV1_1;
  label: string;
  icon: string;
  description: string;
  placeholder: string;
  fields: string[]; // List of custom fields to prompt for
}

export const ACTION_LIBRARY_V1_1: ActionDefinitionV1_1[] = [
  {
    id: 'REQUEST_INTAKE',
    label: 'Request Intake Appointment',
    icon: '📅',
    description: 'Request provider to schedule intake appointment',
    placeholder: 'When would you like to schedule the intake? Any special requirements?',
    fields: ['scheduledDate', 'location', 'notes']
  },
  {
    id: 'REQUEST_UPDATE',
    label: 'Request Progress Update',
    icon: '🔔',
    description: 'Request status or progress update from provider',
    placeholder: 'What specific update do you need? (e.g., attendance, behavior, progress)',
    fields: ['updateType', 'notes']
  },
  {
    id: 'REQUEST_DOCUMENT',
    label: 'Request Documentation',
    icon: '📄',
    description: 'Request specific documents from provider',
    placeholder: 'What documents do you need? (e.g., progress notes, support plan, incident report)',
    fields: ['docType', 'dueAt', 'notes']
  },
  {
    id: 'GENERAL_MESSAGE',
    label: 'Send Message',
    icon: '💬',
    description: 'General communication or note',
    placeholder: 'Type your message...',
    fields: ['notes']
  }
];

// Helper: Get action definition
export function getActionDefinitionV1_1(type: ActionTypeV1_1): ActionDefinitionV1_1 {
  return ACTION_LIBRARY_V1_1.find(a => a.id === type) || ACTION_LIBRARY_V1_1[3]; // Default to GENERAL_MESSAGE
}

// Helper: Map old action types to new v1.1 types
export function mapLegacyActionType(oldType: string): ActionTypeV1_1 {
  const mapping: Record<string, ActionTypeV1_1> = {
    // Intake related
    'request_intake_date': 'REQUEST_INTAKE',
    'confirm_intake_scheduled': 'REQUEST_INTAKE',
    
    // Status/Progress updates
    'request_status_update': 'REQUEST_UPDATE',
    'request_progress_update': 'REQUEST_UPDATE',
    'service_update': 'REQUEST_UPDATE',
    'confirm_service_started': 'REQUEST_UPDATE',
    'services_paused': 'REQUEST_UPDATE',
    'services_resumed': 'REQUEST_UPDATE',
    'services_ended': 'REQUEST_UPDATE',
    'request_auth_update': 'REQUEST_UPDATE',
    
    // Documentation
    'request_documentation': 'REQUEST_DOCUMENT',
    'submit_documentation': 'REQUEST_DOCUMENT',
    
    // Everything else
    'flag_concern': 'GENERAL_MESSAGE',
    'report_incident': 'GENERAL_MESSAGE',
    'authorization_submitted': 'GENERAL_MESSAGE',
    'authorization_approved': 'GENERAL_MESSAGE',
    'switch_transfer_request': 'GENERAL_MESSAGE',
    'urgent_alert': 'GENERAL_MESSAGE',
    'general_message': 'GENERAL_MESSAGE',
    'follow_up_reminder': 'GENERAL_MESSAGE',
    'roi_request': 'GENERAL_MESSAGE',
    'roi_approved': 'GENERAL_MESSAGE',
  };
  
  return mapping[oldType] || 'GENERAL_MESSAGE';
}

// Helper: Map old status to new v1.1 status
export function mapLegacyActionStatus(oldStatus: string): ActionStatusV1_1 {
  const mapping: Record<string, ActionStatusV1_1> = {
    'pending': 'OPEN',
    'in_progress': 'OPEN',
    'completed': 'COMPLETED',
    'cancelled': 'CANCELLED',
  };
  
  return mapping[oldStatus] || 'OPEN';
}

// Helper: Map old urgency to new v1.1 priority
export function mapLegacyActionPriority(oldUrgency: string): ActionPriorityV1_1 {
  const mapping: Record<string, ActionPriorityV1_1> = {
    'low': 'NORMAL',
    'medium': 'NORMAL',
    'normal': 'NORMAL',
    'high': 'HIGH',
    'urgent': 'CRITICAL',
    'critical': 'CRITICAL',
  };
  
  return mapping[oldUrgency] || 'NORMAL';
}

// Helper: Get priority color
export function getPriorityColor(priority: ActionPriorityV1_1): string {
  const colors = {
    NORMAL: 'text-slate-600',
    HIGH: 'text-orange-600',
    CRITICAL: 'text-red-600',
  };
  return colors[priority];
}

// Helper: Get priority badge
export function getPriorityBadge(priority: ActionPriorityV1_1): string {
  const badges = {
    NORMAL: '',
    HIGH: '🟠',
    CRITICAL: '🔴',
  };
  return badges[priority];
}

// Helper: Get status badge
export function getStatusBadge(status: ActionStatusV1_1): { label: string; color: string } {
  const badges = {
    OPEN: { label: 'Open', color: 'bg-blue-100 text-blue-800' },
    COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-800' },
    CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
  };
  return badges[status];
}


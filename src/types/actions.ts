// Action Types for Case Manager ↔ Provider Workflow

export type ActionStatus = 'pending' | 'complete';
export type ActionUrgency = 'normal' | 'urgent' | 'issue';
export type UserRole = 'case_manager' | 'provider';

// Service Context Types - NEW
export type ContextType = 'referral' | 'connection' | 'general';

export interface ServiceContext {
  id: string;
  type: ContextType;
  label: string; // e.g., "ARMHS @ Independence Plus"
  providerId?: string;
  providerName?: string;
  serviceType?: string;
  status: 'active' | 'pending' | 'paused' | 'ended';
  lastActivity?: string;
  pendingActionsCount: number;
}

export interface Connection {
  _id: string;
  clientId: string;
  providerId: string;
  providerName: string;
  serviceType: string;
  status: 'active' | 'paused' | 'ended';
  createdAt: string;
  lastActivity?: string;
  // Link back to original referral
  sourceReferralId?: string;
}

export type DocumentType = 
  | 'support_plan'
  | 'progress_notes'
  | 'incident_report'
  | 'roi'
  | 'discharge_summary'
  | 'eligibility'
  | 'service_plan'
  | 'treatment_plan'
  | 'care_team_notes'
  | 'authorization_packet'
  | 'approval_letter';

export type ActionType = 
  // Case Manager Actions
  | 'request_intake_date'
  | 'request_status_update'
  | 'request_documentation'
  | 'submit_documentation'
  | 'authorization_submitted'
  | 'authorization_approved'
  | 'flag_concern'
  | 'switch_transfer_request'
  | 'urgent_alert'
  // Provider Actions
  | 'confirm_intake_scheduled'
  | 'confirm_service_started'
  | 'service_update'
  | 'request_documentation'
  | 'submit_documentation'
  | 'request_auth_update'
  | 'report_incident'
  | 'services_paused'
  | 'services_resumed'
  | 'services_ended'
  // Shared Actions
  | 'general_message'
  | 'follow_up_reminder'
  | 'roi_request'
  | 'roi_approved';

export interface ActionDefinition {
  id: ActionType;
  label: string;
  icon: string;
  description: string;
  roles: UserRole[];
  urgency?: ActionUrgency;
  requiresROI?: boolean;
  fields: ActionField[];
}

export interface ActionField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'datetime' | 'select' | 'number' | 'file';
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

export interface Action {
  _id: string;
  clientId: string;
  
  // Context Information - NEW
  contextType: 'referral' | 'connection' | 'general';
  contextId?: string; // referralId or connectionId
  
  // Service Context (denormalized for routing) - NEW
  providerId?: string;
  serviceType?: string;
  
  // Action Details
  type: ActionType;
  title: string;
  description?: string;
  notes?: string;
  status: ActionStatus;
  urgency: ActionUrgency;
  
  // Actor info
  createdBy: string;
  createdByRole: UserRole;
  createdByName: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  targetDate?: string;
  scheduledDate?: string;
  completedAt?: string;
  
  // Action-specific data
  data?: Record<string, any>;
  
  // Attachments
  attachments?: ActionAttachment[];
  
  // Comments
  comments?: ActionComment[];
  
  // ROI gating
  requiresROI?: boolean;
  roiApproved?: boolean;
  
  // Routing Information - NEW
  routing?: {
    primaryRecipient: 'case_manager' | 'provider' | 'both';
    recipientIds: string[];
  };
}

export interface ActionAttachment {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  documentType?: DocumentType;
}

export interface ActionComment {
  _id: string;
  content: string;
  createdBy: string;
  createdByName: string;
  createdByRole: UserRole;
  createdAt: string;
}

// Action Library Definitions
export const ACTION_LIBRARY: ActionDefinition[] = [
  // Case Manager Actions
  {
    id: 'request_intake_date',
    label: 'Request Intake Date',
    icon: '📅',
    description: 'Ask provider to schedule/confirm intake appointment',
    roles: ['case_manager'],
    fields: [
      { name: 'target_date', label: 'Preferred Date', type: 'date' },
      { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any scheduling preferences or requirements?' }
    ]
  },
  {
    id: 'request_status_update',
    label: 'Request Status Update',
    icon: '🔔',
    description: 'Request progress update from provider',
    roles: ['case_manager'],
    fields: [
      { name: 'target_date', label: 'Target Date', type: 'date' },
      { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'What specific information do you need?' }
    ]
  },
  {
    id: 'request_documentation',
    label: 'Request Documentation',
    icon: '📄',
    description: 'Request specific documents from provider',
    roles: ['case_manager'],
    fields: [
      { 
        name: 'doc_type', 
        label: 'Document Type', 
        type: 'select', 
        required: true,
        options: ['Support Plan', 'Progress Notes', 'Incident Report', 'ROI', 'Discharge Summary', 'Eligibility', 'Service Plan']
      },
      { name: 'target_date', label: 'Target Date', type: 'date' },
      { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any specific requirements or details?' }
    ]
  },
  {
    id: 'flag_concern',
    label: 'Flag Concern / Issue',
    icon: '❗',
    description: 'Report a concern or issue that needs attention',
    roles: ['case_manager'],
    urgency: 'issue',
    fields: [
      { 
        name: 'category', 
        label: 'Category', 
        type: 'select', 
        required: true,
        options: ['Quality', 'No-show', 'Safety', 'Family Request', 'Other']
      },
      { name: 'notes', label: 'Description', type: 'textarea', required: true, placeholder: 'Describe the concern or issue...' }
    ]
  },
  {
    id: 'authorization_submitted',
    label: 'Authorization Submitted',
    icon: '📝',
    description: 'Service authorization packet submitted',
    roles: ['case_manager'],
    fields: [
      { name: 'submitted_date', label: 'Submitted Date', type: 'date', required: true },
      { name: 'notes', label: 'Notes', type: 'textarea' },
      { name: 'files', label: 'SA Packet', type: 'file' }
    ]
  },
  {
    id: 'authorization_approved',
    label: 'Authorization Approved',
    icon: '✅',
    description: 'Service authorization has been approved',
    roles: ['case_manager'],
    fields: [
      { name: 'approval_date', label: 'Approval Date', type: 'date', required: true },
      { name: 'auth_number', label: 'Authorization Number', type: 'text', required: true },
      { name: 'start_date', label: 'Start Date', type: 'date', required: true },
      { name: 'end_date', label: 'End Date', type: 'date', required: true },
      { name: 'units_or_hours', label: 'Units/Hours', type: 'number', required: true },
      { name: 'notes', label: 'Notes', type: 'textarea' },
      { name: 'files', label: 'Approval Letter', type: 'file' }
    ]
  },
  {
    id: 'switch_transfer_request',
    label: 'Switch/Transfer Request',
    icon: '🔄',
    description: 'Explore provider switch for client',
    roles: ['case_manager'],
    fields: [
      { 
        name: 'reason', 
        label: 'Reason for Switch', 
        type: 'select', 
        required: true,
        options: ['Client Request', 'Service Quality', 'Location', 'Availability', 'Other']
      },
      { name: 'notes', label: 'Details', type: 'textarea', required: true, placeholder: 'Explain the reason for requesting a provider switch...' }
    ]
  },
  {
    id: 'urgent_alert',
    label: 'Urgent Alert',
    icon: '📢',
    description: 'Send urgent alert to provider',
    roles: ['case_manager'],
    urgency: 'urgent',
    fields: [
      { name: 'reason', label: 'Reason', type: 'text', required: true, placeholder: 'Brief reason for urgency' },
      { name: 'notes', label: 'Details', type: 'textarea', required: true, placeholder: 'Detailed explanation...' }
    ]
  },

  // Provider Actions
  {
    id: 'confirm_intake_scheduled',
    label: 'Confirm Intake Scheduled',
    icon: '📅',
    description: 'Confirm intake appointment has been scheduled',
    roles: ['provider'],
    fields: [
      { name: 'scheduled_date', label: 'Scheduled Date', type: 'datetime', required: true },
      { name: 'location', label: 'Location', type: 'text', placeholder: 'Where will the intake take place?' },
      { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any preparation instructions or notes...' }
    ]
  },
  {
    id: 'confirm_service_started',
    label: 'Confirm Service Started',
    icon: '✅',
    description: 'Confirm that services have begun',
    roles: ['provider'],
    fields: [
      { name: 'start_date', label: 'Start Date', type: 'date' },
      { name: 'plan_hours_per_week', label: 'Planned Hours/Week', type: 'number' },
      { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any initial observations or notes...' }
    ]
  },
  {
    id: 'service_update',
    label: 'Service Update',
    icon: '📈',
    description: 'Provide progress update on services',
    roles: ['provider'],
    fields: [
      { 
        name: 'period', 
        label: 'Reporting Period', 
        type: 'select', 
        required: true,
        options: ['This Week', 'This Month', 'Custom Period']
      },
      { name: 'sessions_count', label: 'Number of Sessions', type: 'number' },
      { name: 'outcomes', label: 'Outcomes/Progress', type: 'textarea', required: true, placeholder: 'Describe progress, outcomes, and observations...' },
      { name: 'attachments', label: 'Supporting Documents', type: 'file' }
    ]
  },
  {
    id: 'submit_documentation',
    label: 'Submit Documentation',
    icon: '📤',
    description: 'Upload required documentation',
    roles: ['provider', 'case_manager'],
    fields: [
      { 
        name: 'doc_type', 
        label: 'Document Type', 
        type: 'select', 
        required: true,
        options: ['Intake Forms', 'Assessments', 'Service Plans', 'Progress Notes', 'Discharge Summaries', 'Release of Information', 'Incident Reports', 'Treatment Plan', 'Support Plan', 'Other']
      },
      { name: 'files', label: 'Documents', type: 'file', required: true },
      { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any additional context about these documents...' }
    ]
  },
  {
    id: 'report_incident',
    label: 'Report Incident / Concern',
    icon: '⚠️',
    description: 'Report an incident or concern',
    roles: ['provider'],
    urgency: 'issue',
    fields: [
      { name: 'incident_date', label: 'Incident Date', type: 'date', required: true },
      { 
        name: 'category', 
        label: 'Category', 
        type: 'select', 
        required: true,
        options: ['No-show', 'Safety', 'Behavior', 'Hospitalization', 'Other']
      },
      { name: 'notes', label: 'Description', type: 'textarea', required: true, placeholder: 'Detailed description of the incident...' },
      { name: 'files', label: 'Supporting Documents', type: 'file' }
    ]
  },
  {
    id: 'request_auth_update',
    label: 'Request Authorization Update',
    icon: '🔔',
    description: 'Request service authorization update',
    roles: ['provider'],
    fields: [
      { name: 'target_date', label: 'Needed By', type: 'date' },
      { name: 'notes', label: 'Reason', type: 'textarea', required: true, placeholder: 'Why is the authorization update needed?' }
    ]
  },
  {
    id: 'services_paused',
    label: 'Services Paused',
    icon: '⏸️',
    description: 'Temporary stop of services',
    roles: ['provider'],
    fields: [
      { name: 'pause_date', label: 'Pause Date', type: 'date', required: true },
      { 
        name: 'reason', 
        label: 'Reason', 
        type: 'select', 
        required: true,
        options: ['Hospitalization', 'Family Travel', 'Client Request', 'Provider Unavailable', 'Other']
      },
      { name: 'expected_resume_date', label: 'Expected Resume Date', type: 'date' },
      { name: 'notes', label: 'Details', type: 'textarea', placeholder: 'Additional details about the pause...' }
    ]
  },
  {
    id: 'services_resumed',
    label: 'Services Resumed',
    icon: '▶️',
    description: 'Services restarted after pause',
    roles: ['provider'],
    fields: [
      { name: 'resume_date', label: 'Resume Date', type: 'date', required: true },
      { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any changes or updates since resuming...' }
    ]
  },
  {
    id: 'services_ended',
    label: 'Services Ended',
    icon: '🏁',
    description: 'Provider closes services (discharge, funding ended, etc.)',
    roles: ['provider'],
    fields: [
      { name: 'end_date', label: 'End Date', type: 'date', required: true },
      { 
        name: 'reason', 
        label: 'Reason', 
        type: 'select', 
        required: true,
        options: ['Goals Met', 'Funding Ended', 'Client Discharged', 'Client Request', 'Provider Decision', 'Other']
      },
      { name: 'notes', label: 'Summary', type: 'textarea', required: true, placeholder: 'Summary of services and outcomes...' },
      { name: 'files', label: 'Discharge Summary', type: 'file' }
    ]
  },

  // Shared Actions
  {
    id: 'general_message',
    label: 'General Message',
    icon: '💬',
    description: 'Send a general message or clarification',
    roles: ['case_manager', 'provider'],
    fields: [
      { name: 'notes', label: 'Message', type: 'textarea', required: true, placeholder: 'Your message...' }
    ]
  },
  {
    id: 'follow_up_reminder',
    label: 'Follow-Up Reminder',
    icon: '⏰',
    description: 'Set a reminder for pending actions',
    roles: ['case_manager', 'provider'],
    fields: [
      { name: 'reminder_date', label: 'Reminder Date', type: 'datetime', required: true },
      { name: 'notes', label: 'Reminder Note', type: 'textarea', placeholder: 'What should be followed up on?' }
    ]
  },
  {
    id: 'roi_request',
    label: 'Request ROI',
    icon: '🔐',
    description: 'Request Release of Information',
    roles: ['provider'],
    requiresROI: true,
    fields: [
      { name: 'notes', label: 'Reason for ROI', type: 'textarea', required: true, placeholder: 'Why is ROI needed?' }
    ]
  },
  {
    id: 'roi_approved',
    label: 'ROI Approved',
    icon: '🔐',
    description: 'Release of Information has been approved',
    roles: ['case_manager'],
    fields: [
      { name: 'approval_date', label: 'Approval Date', type: 'date', required: true },
      { name: 'files', label: 'Signed ROI', type: 'file', required: true },
      { name: 'notes', label: 'Notes', type: 'textarea' }
    ]
  }
];

// Helper functions
export const getActionDefinition = (type: ActionType): ActionDefinition | undefined => {
  return ACTION_LIBRARY.find(action => action.id === type);
};

export const getActionsForRole = (role: UserRole): ActionDefinition[] => {
  return ACTION_LIBRARY.filter(action => action.roles.includes(role));
};

export const getActionsByCategory = (role: UserRole) => {
  const actions = getActionsForRole(role);
  
  if (role === 'case_manager') {
    return {
      priority: actions.filter(a => ['request_intake_date', 'request_status_update', 'request_documentation', 'flag_concern', 'switch_transfer_request', 'urgent_alert'].includes(a.id)),
      authorization: actions.filter(a => ['authorization_submitted', 'authorization_approved', 'submit_documentation'].includes(a.id)),
      general: actions.filter(a => ['general_message', 'follow_up_reminder', 'roi_approved'].includes(a.id))
    };
  } else {
    return {
      priority: actions.filter(a => ['confirm_service_started', 'service_update', 'report_incident'].includes(a.id)),
      documentation: actions.filter(a => ['submit_documentation', 'request_auth_update'].includes(a.id)),
      general: actions.filter(a => ['general_message', 'roi_request'].includes(a.id))
    };
  }
};

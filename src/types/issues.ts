/**
 * Issues Collection Types
 * Replaces legacy flag system with dynamic issue tracking
 */

export const ISSUE_TYPES = [
  'QUALITY_CONCERN',
  'INCIDENT_REVIEW',
  'FUNDING_ISSUE',
  'OTHER',
] as const;

export type IssueType = typeof ISSUE_TYPES[number];

export const ISSUE_STATUSES = [
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'CANCELLED',
] as const;

export type IssueStatus = typeof ISSUE_STATUSES[number];

export interface IssueComment {
  _id: string;
  content: string;
  createdByMemberId: string;
  createdByName?: string;
  createdByAvatar?: string;
  createdAt: Date;
  updatedAt?: Date;
  parentCommentId?: string; // For threading
  replies?: IssueComment[]; // Nested replies
}

export interface Issue {
  _id: string;
  organizationId: string;
  serviceRelationshipId: string;
  clientId: string;
  
  type: IssueType;
  status: IssueStatus;
  
  comments: IssueComment[];
  relatedTaskIds: string[];  // v1.1: Changed from relatedActionIds
  
  createdByMemberId: string;
  createdAt: Date;
  resolvedByMemberId?: string;
  resolvedAt?: Date;
}

/**
 * UI Configuration for Issue Types
 */
export const ISSUE_TYPE_CONFIG: Record<IssueType, { label: string; color: string; icon: string; description: string }> = {
  QUALITY_CONCERN: {
    label: 'Quality Concern',
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    icon: '⚠️',
    description: 'Service quality or delivery issues requiring attention',
  },
  INCIDENT_REVIEW: {
    label: 'Incident Review',
    color: 'text-red-600 bg-red-50 border-red-200',
    icon: '🚨',
    description: 'Serious incident requiring documentation and review',
  },
  FUNDING_ISSUE: {
    label: 'Funding Issue',
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    icon: '💰',
    description: 'Authorization, billing, or payment concerns',
  },
  OTHER: {
    label: 'Other Issue',
    color: 'text-slate-600 bg-slate-50 border-slate-200',
    icon: '❓',
    description: 'General issue that doesn\'t fit other categories',
  },
};

/**
 * UI Configuration for Issue Status
 */
export const ISSUE_STATUS_CONFIG: Record<IssueStatus, { label: string; color: string }> = {
  OPEN: {
    label: 'Open',
    color: 'text-red-600 bg-red-50 border-red-200',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  RESOLVED: {
    label: 'Resolved',
    color: 'text-green-600 bg-green-50 border-green-200',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'text-slate-600 bg-slate-50 border-slate-200',
  },
};


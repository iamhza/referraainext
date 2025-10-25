/**
 * Tasks Collection Types (v1.1)
 * Flexible task management system replacing the legacy actions collection
 */

export const TASK_STATUSES = [
  'TODO',
  'IN_PROGRESS',
  'DONE',
  'CANCELLED',
] as const;

export type TaskStatus = typeof TASK_STATUSES[number];

export interface Task {
  _id: string;
  organizationId: string;
  
  ownerMemberId: string;      // User who created the task
  assigneeMemberId: string;   // User responsible for completing it
  
  title: string;
  description?: string;
  
  status: TaskStatus;
  dueDate?: Date | string;
  
  // Context Links (optional - for client/service-related tasks)
  clientId?: string;
  serviceRelationshipId?: string;
  issueId?: string;           // If task is linked to an issue
  
  createdAt: Date | string;
  completedAt?: Date | string;
  completedByMemberId?: string;
}

/**
 * UI Configuration for Task Status
 */
export const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; icon: string }> = {
  TODO: {
    label: 'To Do',
    color: 'text-slate-600 bg-slate-50 border-slate-200',
    icon: 'Circle',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    icon: 'CircleDot',
  },
  DONE: {
    label: 'Done',
    color: 'text-green-600 bg-green-50 border-green-200',
    icon: 'CheckCircle2',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'text-slate-400 bg-slate-50 border-slate-200',
    icon: 'XCircle',
  },
};

/**
 * Helper Types
 */

// Task with creator/assignee details populated
export interface TaskWithDetails extends Task {
  owner?: {
    _id: string;
    name: string;
  };
  assignee?: {
    _id: string;
    name: string;
  };
  client?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

// Task creation payload
export interface CreateTaskPayload {
  title: string;
  description?: string;
  assigneeMemberId: string;
  dueDate?: string;
  clientId?: string;
  serviceRelationshipId?: string;
  issueId?: string;
}

// Task update payload
export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
  assigneeMemberId?: string;
  dueDate?: string | null;
}


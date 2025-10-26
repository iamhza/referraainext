/**
 * Smart Status Computer
 * Computes intelligent, human-readable status from actions library
 */

import type { Action, ActionUrgency } from '@/types/actions';
import type { SmartStatus } from '@/components/dashboard/SmartStatusBar';

/**
 * Compute smart status for a client based on their pending actions
 */
export function computeSmartStatus(actions: Action[]): SmartStatus | null {
  // Filter to only pending actions
  const pendingActions = actions.filter(a => a.status === 'pending');
  
  if (pendingActions.length === 0) {
    return null; // No pending actions = no status bar
  }

  // Find highest priority action
  const urgentAction = findHighestPriorityAction(pendingActions);
  
  if (!urgentAction) {
    return null;
  }

  // Compute urgency score (0-100)
  const urgencyScore = calculateUrgencyScore(urgentAction);
  
  // Get color based on score and due date
  const color = getStatusColor(urgentAction, urgencyScore);
  
  // Generate human-readable text
  const text = generateStatusText(urgentAction);
  
  // Generate subtext (time context)
  const subtext = generateSubtext(urgentAction);
  
  return {
    text,
    subtext,
    color,
    urgencyScore,
    actionId: urgentAction._id,
    actionType: urgentAction.type,
    serviceContext: urgentAction.serviceType || undefined,
    dueDate: urgentAction.targetDate,
  };
}

/**
 * Find the highest priority action from a list
 */
function findHighestPriorityAction(actions: Action[]): Action | null {
  if (actions.length === 0) return null;

  const now = new Date();
  
  // Priority order:
  // 1. Critical + overdue
  // 2. High + overdue
  // 3. Critical + due soon
  // 4. High + due today
  // 5. Normal + overdue
  // 6. Critical (any)
  // 7. High (any)
  // 8. Normal (any)

  const sorted = [...actions].sort((a, b) => {
    const scoreA = getPriorityScore(a, now);
    const scoreB = getPriorityScore(b, now);
    return scoreB - scoreA; // Descending
  });

  return sorted[0];
}

/**
 * Get numeric priority score for sorting
 */
function getPriorityScore(action: Action, now: Date): number {
  let score = 0;
  
  // Base urgency points
  switch (action.urgency) {
    case 'critical':
      score += 100;
      break;
    case 'high':
      score += 60;
      break;
    case 'normal':
      score += 30;
      break;
    default:
      score += 10;
  }
  
  // Due date multipliers
  if (action.targetDate) {
    const dueDate = new Date(action.targetDate);
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      // Overdue - massive boost
      score += Math.abs(diffDays) * 20;
    } else if (diffDays === 0) {
      // Due today
      score += 40;
    } else if (diffDays <= 3) {
      // Due within 3 days
      score += 20;
    } else if (diffDays <= 7) {
      // Due this week
      score += 10;
    }
  }
  
  return score;
}

/**
 * Calculate 0-100 urgency score for client
 */
function calculateUrgencyScore(action: Action): number {
  const now = new Date();
  let score = 0;
  
  // Base score from urgency
  switch (action.urgency) {
    case 'critical':
      score = 70;
      break;
    case 'high':
      score = 50;
      break;
    case 'normal':
      score = 30;
      break;
    default:
      score = 10;
  }
  
  // Add points for overdue
  if (action.targetDate) {
    const dueDate = new Date(action.targetDate);
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      // Overdue - add 10 points per day (capped at +30)
      score += Math.min(Math.abs(diffDays) * 10, 30);
    } else if (diffDays === 0) {
      // Due today
      score += 15;
    }
  }
  
  return Math.min(score, 100);
}

/**
 * Get status color based on urgency and due date
 */
function getStatusColor(action: Action, urgencyScore: number): 'red' | 'orange' | 'yellow' | 'gray' {
  const now = new Date();
  const dueDate = action.targetDate ? new Date(action.targetDate) : null;
  const isOverdue = dueDate && dueDate < now;
  
  // Red: Critical or overdue
  if (action.urgency === 'critical' || isOverdue) {
    return 'red';
  }
  
  // Orange: High priority or due very soon
  if (action.urgency === 'high') {
    return 'orange';
  }
  
  if (dueDate) {
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return 'orange'; // Due today/tomorrow
    if (diffDays <= 3) return 'yellow'; // Due within 3 days
  }
  
  // Yellow: Normal priority
  if (action.urgency === 'normal') {
    return 'yellow';
  }
  
  return 'gray';
}

/**
 * Generate human-readable status text from action type
 */
function generateStatusText(action: Action): string {
  const textMap: Record<string, string> = {
    'request_status_update': 'Follow-up needed',
    'request_documentation': 'Documentation needed',
    'flag_concern': 'Issue flagged',
    'request_intake_date': 'Intake pending',
    'request_progress_update': 'Update requested',
    'schedule_meeting': 'Meeting needed',
    'approve_service': 'Approval pending',
    'complete_assessment': 'Assessment due',
  };
  
  return textMap[action.type] || 'Action needed';
}

/**
 * Generate subtext with time context
 */
function generateSubtext(action: Action): string | undefined {
  if (!action.targetDate) {
    return undefined;
  }
  
  const now = new Date();
  const dueDate = new Date(action.targetDate);
  const diffTime = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return overdueDays === 1 ? '1 day overdue' : `${overdueDays} days overdue`;
  }
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  if (diffDays <= 7) return `Due in ${diffDays} days`;
  
  return undefined; // Don't show subtext for far future dates
}

/**
 * Compute aggregate urgency for sorting multiple clients
 */
export function computeAggregateUrgency(actions: Action[]): number {
  const status = computeSmartStatus(actions);
  return status?.urgencyScore || 0;
}

/**
 * Check if client has any overdue actions
 */
export function hasOverdueActions(actions: Action[]): boolean {
  const now = new Date();
  return actions.some(action => 
    action.status === 'pending' && 
    action.targetDate && 
    new Date(action.targetDate) < now
  );
}

/**
 * Count pending actions by urgency
 */
export function countActionsByUrgency(actions: Action[]): {
  critical: number;
  high: number;
  normal: number;
  total: number;
} {
  const pending = actions.filter(a => a.status === 'pending');
  
  return {
    critical: pending.filter(a => a.urgency === 'critical').length,
    high: pending.filter(a => a.urgency === 'high').length,
    normal: pending.filter(a => a.urgency === 'normal').length,
    total: pending.length,
  };
}


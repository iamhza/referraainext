/**
 * MongoDB Collection Schemas for Sandbox System
 * 
 * These schemas define the structure for sandbox organizations,
 * tour progress tracking, challenge completions, and analytics events.
 */

import { ObjectId } from 'mongodb';

// ============================================================================
// SANDBOX ORGANIZATION SCHEMA
// ============================================================================

export interface SandboxOrganization {
  _id: ObjectId;
  organizationId: ObjectId;          // References organizations collection
  userId: ObjectId;                   // User who created the sandbox
  tier: 'micro' | 'mid' | 'enterprise';
  role: 'case_manager' | 'supervisor' | 'org_admin';
  createdAt: Date;
  expiresAt: Date;                   // Tier-based: Micro(7d), Mid(14d), Enterprise(30d)
  status: 'active' | 'expired' | 'converted' | 'archived';
  convertedToOrgId?: ObjectId;       // Production org ID after conversion
  convertedAt?: Date;
  extensionRequested?: boolean;      // User requested 7-day extension
  extensionGranted?: boolean;
  metadata?: {
    signupSource?: string;           // Where they came from (landing, email, etc)
    referralCode?: string;
    initialFeatures?: string[];      // Features they expressed interest in
  };
}

// ============================================================================
// TOUR PROGRESS SCHEMA
// ============================================================================

export interface SandboxTourProgress {
  _id: ObjectId;
  sandboxOrgId: ObjectId;            // References sandbox_organizations
  userId: ObjectId;
  role: 'case_manager' | 'supervisor' | 'org_admin';
  currentStep: number;               // 0-indexed current step
  totalSteps: number;                // Total steps in this tour
  completedSteps: number[];          // Array of completed step indices
  completedAt?: Date;                // Tour completion timestamp
  restartCount: number;              // How many times user restarted tour
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    averageStepDuration?: number;    // Seconds per step
    skippedSteps?: number[];         // Steps user skipped
    helpRequested?: number[];        // Steps where user requested help
  };
}

// ============================================================================
// CHALLENGE COMPLETION SCHEMA
// ============================================================================

export interface SandboxChallenge {
  _id: ObjectId;
  sandboxOrgId: ObjectId;
  userId: ObjectId;
  challengeKey: string;              // e.g., 'quick-match', 'rebalancing-act'
  challengeRole: 'case_manager' | 'supervisor' | 'org_admin';
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  timeTakenSeconds?: number;         // Time from start to completion
  hintsUsed: number;                 // 0-3 hints available per challenge
  attempts: number;                  // Number of attempts (retries)
  score?: number;                    // Optional scoring (0-100)
  createdAt: Date;
  metadata?: {
    specificHintsViewed?: number[];  // Which hint numbers were viewed
    errorsMade?: string[];           // Track common mistakes for product insights
  };
}

// ============================================================================
// ANALYTICS EVENT SCHEMA
// ============================================================================

export interface SandboxAnalyticsEvent {
  _id: ObjectId;
  sandboxOrgId: ObjectId;
  userId: ObjectId;
  eventType: 
    | 'page_view'
    | 'tour_step_completed'
    | 'tour_completed'
    | 'tour_skipped'
    | 'tour_restarted'
    | 'challenge_started'
    | 'challenge_completed'
    | 'challenge_failed'
    | 'challenge_hint_used'
    | 'feature_used'
    | 'conversion_clicked'
    | 'conversion_completed'
    | 'extension_requested'
    | 'session_start'
    | 'session_end';
  eventData: {
    page?: string;                   // For page_view events
    feature?: string;                // For feature_used events
    stepNumber?: number;             // For tour events
    challengeKey?: string;           // For challenge events
    duration?: number;               // Session or activity duration
    metadata?: Record<string, any>; // Flexible additional data
  };
  sessionId?: string;                // Track user sessions
  userAgent?: string;                // Browser/device info
  ipAddress?: string;                // For geolocation insights (anonymized)
  createdAt: Date;
}

// ============================================================================
// LEAD SCORE CALCULATION (Derived Data)
// ============================================================================

export interface SandboxLeadScore {
  userId: ObjectId;
  sandboxOrgId: ObjectId;
  score: number;                     // 0-100+ score
  tier: 'cold' | 'warm' | 'hot' | 'ultra_hot';
  lastActivityAt: Date;
  scoreBreakdown: {
    tourCompleted: number;           // +20 points
    challengesCompleted: number;     // +30 per challenge
    multipleSessionsBonus: number;   // +10 per session
    conversionClicked: number;       // +50 points
    featureEngagement: number;       // +1-10 based on features used
    timeInPlatform: number;          // +1 per hour
  };
  conversionProbability: number;     // 0-100% predicted conversion likelihood
  calculatedAt: Date;
}

// ============================================================================
// INDEX DEFINITIONS
// ============================================================================

export const SANDBOX_INDEXES = {
  sandbox_organizations: [
    { key: { userId: 1, status: 1 } },
    { key: { expiresAt: 1, status: 1 } },
    { key: { organizationId: 1 } },
    { key: { status: 1, tier: 1 } },
    { key: { createdAt: -1 } },
  ],
  
  sandbox_tour_progress: [
    { key: { userId: 1, sandboxOrgId: 1 }, unique: true },
    { key: { sandboxOrgId: 1 } },
    { key: { completedAt: 1 } },
    { key: { role: 1, completedAt: 1 } },
  ],
  
  sandbox_challenges: [
    { key: { userId: 1, challengeKey: 1, sandboxOrgId: 1 } },
    { key: { sandboxOrgId: 1, status: 1 } },
    { key: { completedAt: -1 } },
    { key: { challengeRole: 1, status: 1 } },
  ],
  
  sandbox_analytics_events: [
    { key: { sandboxOrgId: 1, eventType: 1, createdAt: -1 } },
    { key: { userId: 1, createdAt: -1 } },
    { key: { eventType: 1, createdAt: -1 } },
    { key: { sessionId: 1, createdAt: -1 } },
    { key: { createdAt: -1 } }, // For time-based queries
  ],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate expiration date based on tier
 */
export function calculateExpirationDate(tier: 'micro' | 'mid' | 'enterprise'): Date {
  const now = new Date();
  const days = tier === 'micro' ? 7 : tier === 'mid' ? 14 : 30;
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Calculate lead score tier
 */
export function getLeadScoreTier(score: number): 'cold' | 'warm' | 'hot' | 'ultra_hot' {
  if (score >= 90) return 'ultra_hot';  // Immediate sales outreach
  if (score >= 70) return 'hot';         // High priority follow-up
  if (score >= 40) return 'warm';        // Standard nurture sequence
  return 'cold';                         // Automated nurture only
}

/**
 * Validate sandbox status transitions
 */
export function isValidStatusTransition(
  from: SandboxOrganization['status'],
  to: SandboxOrganization['status']
): boolean {
  const validTransitions: Record<string, string[]> = {
    active: ['expired', 'converted', 'archived'],
    expired: ['converted', 'archived', 'active'], // Can reactivate with extension
    converted: ['archived'],
    archived: [], // Terminal state
  };
  
  return validTransitions[from]?.includes(to) || false;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isSandboxOrg(org: any): org is SandboxOrganization {
  return (
    org &&
    typeof org._id === 'object' &&
    typeof org.organizationId === 'object' &&
    typeof org.userId === 'object' &&
    ['micro', 'mid', 'enterprise'].includes(org.tier) &&
    ['case_manager', 'supervisor', 'org_admin'].includes(org.role) &&
    ['active', 'expired', 'converted', 'archived'].includes(org.status)
  );
}


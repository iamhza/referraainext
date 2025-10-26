/**
 * Sandbox Analytics Tracker
 * 
 * Tracks user events in sandbox for sales intelligence and product insights.
 * Calculates lead scores and identifies hot prospects.
 */

import clientPromise from '@/lib/mongodb/client';
import { ObjectId } from 'mongodb';

// ============================================================================
// EVENT TRACKING
// ============================================================================

export interface TrackEventParams {
  userId: string;
  sandboxOrgId: string;
  eventType: string;
  eventData?: Record<string, any>;
  sessionId?: string;
  userAgent?: string;
}

/**
 * Track a sandbox analytics event
 */
export async function trackEvent(params: TrackEventParams): Promise<void> {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    await db.collection('sandbox_analytics_events').insertOne({
      sandboxOrgId: new ObjectId(params.sandboxOrgId),
      userId: new ObjectId(params.userId),
      eventType: params.eventType,
      eventData: params.eventData || {},
      sessionId: params.sessionId,
      userAgent: params.userAgent,
      createdAt: new Date(),
    });
  } catch (error) {
    // Silent fail for analytics - don't break user experience
    console.error('Analytics tracking error:', error);
  }
}

// ============================================================================
// LEAD SCORING
// ============================================================================

export interface LeadScore {
  userId: string;
  sandboxOrgId: string;
  score: number;
  tier: 'cold' | 'warm' | 'hot' | 'ultra_hot';
  breakdown: {
    tourCompleted: number;
    challengesCompleted: number;
    multipleSessionsBonus: number;
    conversionClicked: number;
    featureEngagement: number;
    timeInPlatform: number;
  };
  conversionProbability: number;
  lastActivityAt: Date;
}

/**
 * Calculate lead score for a sandbox user
 * 
 * Scoring breakdown:
 * - Tour completed: +20 points
 * - Challenge completed: +30 points each
 * - Multiple sessions: +10 points per session
 * - Conversion clicked: +50 points
 * - Feature engagement: +1-10 based on features used
 * - Time in platform: +1 per hour
 */
export async function calculateLeadScore(
  userId: string,
  sandboxOrgId: string
): Promise<LeadScore> {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    const userObjectId = new ObjectId(userId);
    const sandboxObjectId = new ObjectId(sandboxOrgId);
    
    // Fetch all events for this user/sandbox
    const events = await db.collection('sandbox_analytics_events')
      .find({ 
        userId: userObjectId,
        sandboxOrgId: sandboxObjectId
      })
      .toArray();
    
    if (events.length === 0) {
      return {
        userId,
        sandboxOrgId,
        score: 0,
        tier: 'cold',
        breakdown: {
          tourCompleted: 0,
          challengesCompleted: 0,
          multipleSessionsBonus: 0,
          conversionClicked: 0,
          featureEngagement: 0,
          timeInPlatform: 0,
        },
        conversionProbability: 0,
        lastActivityAt: new Date(),
      };
    }
    
    const breakdown = {
      tourCompleted: 0,
      challengesCompleted: 0,
      multipleSessionsBonus: 0,
      conversionClicked: 0,
      featureEngagement: 0,
      timeInPlatform: 0,
    };
    
    // Tour completed
    const tourCompletedEvents = events.filter(e => e.eventType === 'tour_completed');
    if (tourCompletedEvents.length > 0) {
      breakdown.tourCompleted = 20;
    }
    
    // Challenges completed
    const challengeCompletedEvents = events.filter(e => e.eventType === 'challenge_completed');
    breakdown.challengesCompleted = challengeCompletedEvents.length * 30;
    
    // Multiple sessions (unique session IDs)
    const uniqueSessions = new Set(events.map(e => e.sessionId).filter(Boolean));
    breakdown.multipleSessionsBonus = Math.min(uniqueSessions.size * 10, 50); // Cap at 50
    
    // Conversion clicked
    const conversionClickedEvents = events.filter(e => e.eventType === 'conversion_clicked');
    if (conversionClickedEvents.length > 0) {
      breakdown.conversionClicked = 50;
    }
    
    // Feature engagement (count unique features used)
    const featureUsedEvents = events.filter(e => e.eventType === 'feature_used');
    const uniqueFeatures = new Set(featureUsedEvents.map(e => e.eventData?.feature).filter(Boolean));
    breakdown.featureEngagement = Math.min(uniqueFeatures.size * 2, 10); // Cap at 10
    
    // Time in platform (hours between first and last event)
    const sortedEvents = events.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const firstEvent = sortedEvents[0];
    const lastEvent = sortedEvents[sortedEvents.length - 1];
    const hoursInPlatform = Math.floor(
      (new Date(lastEvent.createdAt).getTime() - new Date(firstEvent.createdAt).getTime()) / (1000 * 60 * 60)
    );
    breakdown.timeInPlatform = Math.min(hoursInPlatform, 10); // Cap at 10
    
    // Calculate total score
    const totalScore = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
    
    // Determine tier
    let tier: LeadScore['tier'] = 'cold';
    if (totalScore >= 90) tier = 'ultra_hot';
    else if (totalScore >= 70) tier = 'hot';
    else if (totalScore >= 40) tier = 'warm';
    
    // Estimate conversion probability (simple formula, can be ML-based later)
    const conversionProbability = Math.min(Math.round((totalScore / 150) * 100), 100);
    
    return {
      userId,
      sandboxOrgId,
      score: totalScore,
      tier,
      breakdown,
      conversionProbability,
      lastActivityAt: new Date(lastEvent.createdAt),
    };
    
  } catch (error) {
    console.error('Lead score calculation error:', error);
    throw error;
  }
}

// ============================================================================
// ANALYTICS QUERIES
// ============================================================================

/**
 * Get all hot leads (score >= 70)
 */
export async function getHotLeads(): Promise<LeadScore[]> {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    const activeSandboxes = await db.collection('sandbox_organizations')
      .find({ status: 'active' })
      .toArray();
    
    const hotLeads: LeadScore[] = [];
    
    for (const sandbox of activeSandboxes) {
      const score = await calculateLeadScore(
        sandbox.userId.toString(),
        sandbox._id.toString()
      );
      
      if (score.score >= 70) {
        hotLeads.push(score);
      }
    }
    
    return hotLeads.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('Error fetching hot leads:', error);
    return [];
  }
}

/**
 * Get sandboxes expiring soon (within 2 days)
 */
export async function getExpiringSoon(): Promise<any[]> {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    const twoDaysFromNow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    
    const expiringSandboxes = await db.collection('sandbox_organizations')
      .find({
        status: 'active',
        expiresAt: { $lte: twoDaysFromNow },
      })
      .toArray();
    
    return expiringSandboxes;
  } catch (error) {
    console.error('Error fetching expiring sandboxes:', error);
    return [];
  }
}

/**
 * Get conversion funnel data
 */
export interface ConversionFunnel {
  totalSignups: number;
  tourStarted: number;
  tourCompleted: number;
  challengeAttempted: number;
  conversionClicked: number;
  converted: number;
  conversionRate: number;
}

export async function getConversionFunnel(): Promise<ConversionFunnel> {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    const [
      totalSignups,
      tourCompleted,
      challengeAttempted,
      conversionClicked,
      converted
    ] = await Promise.all([
      db.collection('sandbox_organizations').countDocuments({}),
      db.collection('sandbox_analytics_events').distinct('sandboxOrgId', { eventType: 'tour_completed' }).then(arr => arr.length),
      db.collection('sandbox_analytics_events').distinct('sandboxOrgId', { eventType: 'challenge_started' }).then(arr => arr.length),
      db.collection('sandbox_analytics_events').distinct('sandboxOrgId', { eventType: 'conversion_clicked' }).then(arr => arr.length),
      db.collection('sandbox_organizations').countDocuments({ status: 'converted' }),
    ]);
    
    const tourStarted = totalSignups; // All signups get tour
    const conversionRate = totalSignups > 0 ? (converted / totalSignups) * 100 : 0;
    
    return {
      totalSignups,
      tourStarted,
      tourCompleted,
      challengeAttempted,
      conversionClicked,
      converted,
      conversionRate,
    };
  } catch (error) {
    console.error('Error calculating conversion funnel:', error);
    throw error;
  }
}

/**
 * Get feature engagement heatmap
 */
export async function getFeatureEngagement(): Promise<Record<string, number>> {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    const featureEvents = await db.collection('sandbox_analytics_events')
      .find({ eventType: 'feature_used' })
      .toArray();
    
    const heatmap: Record<string, number> = {};
    
    for (const event of featureEvents) {
      const feature = event.eventData?.feature;
      if (feature) {
        heatmap[feature] = (heatmap[feature] || 0) + 1;
      }
    }
    
    return heatmap;
  } catch (error) {
    console.error('Error calculating feature engagement:', error);
    return {};
  }
}


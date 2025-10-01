/**
 * Client Data Enhancement Utilities
 * Enhances client data with computed fields for rich client cards
 * Reuses existing data patterns and APIs
 */

import { formatDistanceToNow, parseISO } from 'date-fns';
import type { Client } from '@/types.d';
import type { Connection } from '@/types/actions';

interface ReferralData {
  _id: string;
  clientId: string;
  status: string;
  serviceDetails?: {
    type?: string;
    waiverType?: string;
  };
  waiverType?: string;
  createdAt: string;
  updatedAt: string;
}

interface ActivityData {
  type: 'referral' | 'connection' | 'update' | 'action';
  date: string;
  description: string;
  clientId: string;
}

/**
 * Enhance a single client with computed fields
 */
export function enhanceClientData(
  client: Client,
  referrals: ReferralData[] = [],
  connections: Connection[] = [],
  activities: ActivityData[] = []
): Client {
  // Convert IDs to strings for consistent comparison
  const clientId = client._id?.toString();
  
  const clientReferrals = referrals.filter(r => r.clientId?.toString() === clientId);
  const clientConnections = connections.filter(c => c.clientId?.toString() === clientId);
  const clientActivities = activities.filter(a => a.clientId?.toString() === clientId);
  
  

  const enhanced = {
    ...client,
    referralSummary: computeReferralSummary(clientReferrals),
    connectionSummary: computeConnectionSummary(clientConnections),
    lastActivitySummary: computeLastActivitySummary(client, clientActivities),
    primaryWaiverType: computePrimaryWaiverType(client, clientConnections, clientReferrals)
  };


  return enhanced;
}

/**
 * Enhance multiple clients with computed fields
 */
export function enhanceClientsData(
  clients: Client[],
  referrals: ReferralData[] = [],
  connections: Connection[] = [],
  activities: ActivityData[] = []
): Client[] {
  return clients.map(client => 
    enhanceClientData(client, referrals, connections, activities)
  );
}

/**
 * Compute referral summary from referral data
 */
function computeReferralSummary(referrals: ReferralData[]) {
  const active = referrals.filter(r => 
    ['accepted', 'in_progress', 'active'].includes(r.status.toLowerCase())
  ).length;
  
  const pending = referrals.filter(r => 
    ['pending', 'sent', 'submitted'].includes(r.status.toLowerCase())
  ).length;

  const latest = referrals.length > 0 
    ? referrals.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
    : undefined;

  return {
    active,
    pending,
    total: referrals.length,
    latest: latest ? {
      status: latest.status,
      date: latest.updatedAt,
      serviceType: latest.serviceDetails?.type || 'Unknown Service'
    } : undefined
  };
}

/**
 * Compute connection summary from connection data
 */
function computeConnectionSummary(connections: Connection[]) {
  const activeConnections = connections.filter(c => c.status === 'active');
  const primary = activeConnections.length > 0 ? activeConnections[0] : undefined;

  return {
    active: activeConnections,
    count: activeConnections.length,
    primary,
    hasMultiple: activeConnections.length > 1
  };
}

/**
 * Compute last activity summary
 */
function computeLastActivitySummary(client: Client, activities: ActivityData[]) {
  // Combine different activity sources
  const allActivities = [
    ...activities,
    // Add client update as activity
    ...(client.updatedAt ? [{
      type: 'update' as const,
      date: client.updatedAt,
      description: 'Client information updated',
      clientId: client._id
    }] : []),
    // Add creation as activity if no other activities
    ...(activities.length === 0 && client.createdAt ? [{
      type: 'update' as const,
      date: client.createdAt,
      description: 'Client added to system',
      clientId: client._id
    }] : [])
  ];

  if (allActivities.length === 0) {
    return {
      type: 'update' as const,
      date: new Date().toISOString(),
      description: 'No recent activity',
      relativeTime: 'No recent updates'
    };
  }

  // Get most recent activity
  const latest = allActivities.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];

  return {
    type: latest.type,
    date: latest.date,
    description: latest.description,
    relativeTime: formatDistanceToNow(parseISO(latest.date), { addSuffix: true })
  };
}

/**
 * Compute primary waiver type using your specified logic
 */
function computePrimaryWaiverType(
  client: Client,
  connections: Connection[],
  referrals: ReferralData[]
): string | undefined {
  // 1. Priority: Active connection waiver (ongoing service)
  const activeConnection = connections.find(c => c.status === 'active');
  if (activeConnection && (activeConnection as any).waiverType) {
    return (activeConnection as any).waiverType;
  }

  // 2. Fallback: Most recent referral waiver (latest intent)
  if (referrals.length > 0) {
    const sortedReferrals = referrals.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    
    const latestReferral = sortedReferrals[0];
    const waiverType = latestReferral.serviceDetails?.waiverType || latestReferral.waiverType;
    if (waiverType) return waiverType;
  }

  // 3. Fallback: Client's waiver type field
  if (client.waiverType) return client.waiverType;

  return undefined;
}

/**
 * Get primary contact info with phone priority
 */
export function getPrimaryContact(client: Client): { type: 'phone' | 'email'; value: string } | null {
  // Phone is primary
  if (client.phone) {
    return { type: 'phone', value: client.phone };
  }
  
  // Email as fallback
  if (client.email) {
    return { type: 'email', value: client.email };
  }
  
  return null;
}

/**
 * Get PMI with fallback handling
 */
export function getPrimaryPMI(client: Client): string | null {
  return client.pmi || client.pmiNumber || null;
}

/**
 * Format connection summary for display
 */
export function formatConnectionSummary(connectionSummary?: Client['connectionSummary']): {
  display: string;
  clickable: boolean;
  target?: string;
} | null {
  if (!connectionSummary || connectionSummary.count === 0) {
    return null;
  }

  if (connectionSummary.count === 1 && connectionSummary.primary) {
    return {
      display: `Connected to ${connectionSummary.primary.providerName}`,
      clickable: true,
      target: 'overview' // Navigate to overview tab
    };
  }

  return {
    display: `${connectionSummary.count} Provider Connections`,
    clickable: true,
    target: 'overview' // Navigate to overview tab
  };
}

/**
 * Format referral summary for display
 */
export function formatReferralSummary(referralSummary?: Client['referralSummary']): {
  display: string;
  clickable: boolean;
  target?: string;
} | null {
  if (!referralSummary || referralSummary.total === 0) {
    return null; // Hide field entirely when no referrals
  }

  if (referralSummary.total === 1 && referralSummary.latest) {
    return {
      display: `1 Referral - ${referralSummary.latest.status}`,
      clickable: true,
      target: 'referrals'
    };
  }

  return {
    display: `${referralSummary.total} Referrals`,
    clickable: true,
    target: 'referrals'
  };
}

import type {
  ServiceRelationshipWithDetails,
  ClientGroup,
  ProviderSummary,
  AuthorizationSummary,
  StatusSummary,
} from '../types';
import { getServiceRelationshipStatusConfig, type ServiceRelationshipStatus } from '@/types/service-relationships';

/**
 * Groups service relationships by client
 */
export function groupServicesByClient(
  serviceRelationships: ServiceRelationshipWithDetails[]
): ClientGroup[] {
  const grouped = new Map<string, ClientGroup>();

  serviceRelationships.forEach(sr => {
    if (!sr.client) return;

    const clientId = sr.clientId;
    if (!grouped.has(clientId)) {
      grouped.set(clientId, {
        clientId,
        client: sr.client,
        services: [],
        totalServices: 0,
        totalActiveIssues: 0,
        totalOpenActions: 0,
        totalDocuments: 0,
      });
    }

    const group = grouped.get(clientId)!;
    group.services.push(sr);
    group.totalServices++;
    group.totalActiveIssues += sr.activeIssuesCount || 0;
    group.totalOpenActions += sr.openActionsCount || 0;
    group.totalDocuments += sr.documentsCount || 0;
  });

  return Array.from(grouped.values());
}

/**
 * Calculates provider summary for a list of services
 */
export function calculateProviderSummary(
  services: ServiceRelationshipWithDetails[]
): ProviderSummary {
  const uniqueProviders = new Set(
    services.map(s => s.providerName).filter(Boolean)
  );
  const count = uniqueProviders.size;

  return {
    count,
    names: [...uniqueProviders],
    isSingle: count === 1,
    isMultiple: count > 1,
    isEmpty: count === 0,
  };
}

/**
 * Calculates authorization summary for a list of services
 */
export function calculateAuthSummary(
  services: ServiceRelationshipWithDetails[]
): AuthorizationSummary {
  const counts = {
    approved: 0,
    pending: 0,
    denied: 0,
    expired: 0,
    draft: 0,
    none: 0,
  };

  services.forEach(svc => {
    if (!svc.authorization) {
      counts.none++;
    } else {
      switch (svc.authorization.status) {
        case 'APPROVED':
          counts.approved++;
          break;
        case 'SUBMITTED':
          counts.pending++;
          break;
        case 'DENIED':
          counts.denied++;
          break;
        case 'EXPIRED':
          counts.expired++;
          break;
        case 'DRAFT':
          counts.draft++;
          break;
        default:
          counts.none++;
      }
    }
  });

  const totalActive = counts.approved + counts.pending + counts.denied + counts.expired + counts.draft;
  const activeStatuses = Object.entries(counts)
    .filter(([key, count]) => key !== 'none' && count > 0);

  return {
    ...counts,
    totalActive,
    hasMixed: activeStatuses.length > 1,
  };
}

/**
 * Calculates status summary for a list of services
 */
export function calculateStatusSummary(
  services: ServiceRelationshipWithDetails[]
): StatusSummary {
  const statusCounts: Record<string, number> = {};

  services.forEach(svc => {
    statusCounts[svc.status] = (statusCounts[svc.status] || 0) + 1;
  });

  const entries = Object.entries(statusCounts);

  return {
    counts: statusCounts as Record<ServiceRelationshipStatus, number>,
    total: services.length,
    isSingle: entries.length === 1,
    isMultiple: entries.length > 1,
  };
}

/**
 * Gets service count display text
 */
export function getServiceCountText(count: number): string {
  return `${count} ${count === 1 ? 'Service' : 'Services'}`;
}

/**
 * Checks if authorization is expired
 */
export function isAuthExpired(daysUntilExpiration?: number): boolean {
  return daysUntilExpiration !== undefined && daysUntilExpiration <= 0;
}

/**
 * Checks if authorization is expiring soon
 */
export function isAuthExpiringSoon(daysUntilExpiration?: number): boolean {
  return daysUntilExpiration !== undefined && daysUntilExpiration < 30 && daysUntilExpiration > 0;
}

/**
 * Gets authorization display text
 */
export function getAuthDisplayText(
  status: string,
  daysUntilExpiration?: number,
  units?: number,
  unitType?: string
): { label: string; sublabel: string | null } {
  const isExpired = isAuthExpired(daysUntilExpiration);
  const isExpiringSoon = isAuthExpiringSoon(daysUntilExpiration);

  let label: string;
  let sublabel: string | null = null;

  if (isExpired) {
    label = 'Expired';
    sublabel = daysUntilExpiration !== undefined 
      ? `${Math.abs(daysUntilExpiration)}d ago`
      : null;
  } else if (isExpiringSoon) {
    label = 'Approved';
    sublabel = `Expires in ${daysUntilExpiration}d`;
  } else {
    label = status === 'APPROVED' ? 'Approved' :
             status === 'SUBMITTED' ? 'Pending' :
             status === 'DENIED' ? 'Denied' :
             status === 'DRAFT' ? 'Draft' :
             status === 'EXPIRED' ? 'Expired' :
             status;
    sublabel = units && unitType
      ? `${units} ${unitType.toLowerCase().replace(/_/g, ' ')}`
      : null;
  }

  return { label, sublabel };
}


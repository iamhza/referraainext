'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { capitalizeName, formatWaiverTypeShort } from '@/lib/formatting';
import { useWorkspaceStatus } from '@/hooks/use-workspace-status';
import { 
  getPrimaryContact, 
  getPrimaryPMI, 
  formatConnectionSummary, 
  formatReferralSummary 
} from '@/lib/client-data-enhancer';
import { SmartStatusBar } from './SmartStatusBar';
import type { Client as ClientType } from '@/types';

interface ClientCardProps {
  client: ClientType;
  onClick?: () => void;
  onRequestUpdate?: () => void;
  onCreateReferral?: () => void;
  onNavigateToTab?: (tab: string) => void; // New: Navigate to specific drawer tab
  onDelete?: (clientId: string) => void; // New: Delete client callback
  className?: string;
  connections?: any[]; // Connection data from the connections API
  viewDensity?: 'comfortable' | 'compact';
  shouldHideDetails?: boolean; // From responsive system
  isSelected?: boolean; // Selected state for drawer/panel
}

export function ClientCard({ 
  client, 
  onClick, 
  onRequestUpdate, 
  onCreateReferral, 
  onNavigateToTab,
  onDelete,
  className = '', 
  connections = [], 
  viewDensity = 'comfortable',
  shouldHideDetails = false,
  isSelected = false 
}: ClientCardProps) {
  const [isRequestingUpdate, setIsRequestingUpdate] = useState(false);
  
  // Get workspace status for this client
  const { getStatusForClient } = useWorkspaceStatus({ 
    clientIds: [client._id], 
    enabled: true 
  });
  const workspaceStatus = getStatusForClient(client._id);

  // Get client initials
  const getInitials = (firstName: string, lastName: string) => {
    const first = (firstName || '').charAt(0);
    const last = (lastName || '').charAt(0);
    return `${first}${last}`.toUpperCase() || 'UC';
  };

  // Normalize key for connection matching (same logic as table)
  const normalizeKey = (firstName: string, lastName: string, dateOfBirth: string) => {
    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${normalize(firstName || '')}-${normalize(lastName || '')}-${normalize(dateOfBirth || '')}`;
  };

  // Get connection status (same logic as ClientsTable)
  const getClientConnection = () => {
    // First check if the backend has flagged this client as having a pending connection
    if (client.hasPendingConnection) {
      return {
        status: 'pending',
        isActivated: false,
        isBackendFlag: true
      };
    }
    
    // Fallback to normal connection lookup
    if (!client.firstName || !client.lastName || !client.dateOfBirth) return null;
    
    const clientKey = normalizeKey(client.firstName, client.lastName, client.dateOfBirth);
    const connection = connections.find(conn => conn.matchKey === clientKey);
    
    return connection;
  };

  // Format last update time - Compact version
  const getLastUpdateText = () => {
    if (client.updatedAt) {
      return `Updated ${formatDistanceToNow(parseISO(client.updatedAt), { addSuffix: true })}`;
    }
    if (client.createdAt) {
      return `Added ${formatDistanceToNow(parseISO(client.createdAt), { addSuffix: true })}`;
    }
    return 'No recent updates';
  };

  // Compact time formatter for card display
  const getCompactTimeAgo = () => {
    const timestamp = client.updatedAt || client.createdAt;
    if (!timestamp) return 'N/A';

    const date = parseISO(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffYears > 0) return `${diffYears}Y ago`;
    if (diffMonths > 0) return `${diffMonths}mo ago`;
    if (diffDays > 0) return `${diffDays}D ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}min ago`;
    return '< 1min ago';
  };

  // Get status indicator
  const getStatusIndicator = () => {
    switch (client.status) {
      case 'UNPLACED':
      case 'UNPLACED_NEW': // Legacy support
        return { 
          dotColor: 'bg-red-500', 
          ringColor: 'ring-red-100', 
          label: 'Unplaced' 
        };
      case 'REFERRAL_SENT':
        return { 
          dotColor: 'bg-blue-500', 
          ringColor: 'ring-blue-100', 
          label: 'Referral Sent' 
        };
      case 'IN_PROCESS':
        return { 
          dotColor: 'bg-purple-500', 
          ringColor: 'ring-purple-100', 
          label: 'In Process' 
        };
      case 'ACTIVE_STABLE':
        return { 
          dotColor: 'bg-green-500', 
          ringColor: 'ring-green-100', 
          label: 'Active' 
        };
      case 'ACTIVE_NEEDS_ATTENTION':
      case 'ACTIVE_FRUSTRATED': // Legacy support
        return { 
          dotColor: 'bg-yellow-500', 
          ringColor: 'ring-yellow-100', 
          label: 'Needs Attention' 
        };
      case 'CLOSED_DISCHARGED':
        return { 
          dotColor: 'bg-gray-500', 
          ringColor: 'ring-gray-100', 
          label: 'Closed' 
        };
      default:
        return { 
          dotColor: 'bg-gray-400', 
          ringColor: 'ring-gray-100', 
          label: 'Unknown' 
        };
    }
  };

  // Get connection status (using same logic as table)
  const getConnectionStatus = () => {
    const connection = getClientConnection();
    
    if (!connection) {
      return { badge: '❌', label: 'Not Connected', color: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
    
    // Check if connection is fully established (both parties accepted)
    if (connection.isActivated) {
      return { badge: '✅', label: 'Connected', color: 'bg-green-100 text-green-700 border-green-200' };
    }
    
    // Any other case is pending
    return { badge: '⏳', label: 'Pending', color: 'bg-red-100 text-red-700 border-red-200' };
  };

  // Get referral counts from client data or calculate from props
  const getReferralCounts = () => {
    // Use actual referral data if available, otherwise show 0
    // This will be populated by the parent component fetching real data
    return {
      active: client.activeReferrals || 0,
      pending: client.pendingReferrals || 0,
      total: (client.activeReferrals || 0) + (client.pendingReferrals || 0)
    };
  };

  // Get primary provider info (same logic as table)
  const getPrimaryProvider = () => {
    if (client.currentProvider) {
      return {
        name: client.providerInfo?.name || client.providerInfo?.organization || client.currentProvider,
        organization: client.providerInfo?.organization,
        hasMultiple: false, // TODO: Implement multiple provider logic
        onboarded: client.providerOnboarded
      };
    }
    return null;
  };

  const handleRequestUpdate = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (onRequestUpdate) {
      setIsRequestingUpdate(true);
      try {
        await onRequestUpdate();
      } finally {
        setIsRequestingUpdate(false);
      }
    }
  };

  const statusIndicator = getStatusIndicator();
  const connectionStatus = getConnectionStatus();
  const referralCounts = getReferralCounts();
  const primaryProvider = getPrimaryProvider();

  const isUrgent = client.status === 'ACTIVE_FRUSTRATED' || client.status === 'ACTIVE_NEEDS_ATTENTION';
  
  return (
    <div 
      className={`
        group bg-white rounded-xl border border-slate-300 shadow-sm hover:shadow-md
        cursor-pointer transition-all flex flex-col
        hover:scale-[1.01] hover:-translate-y-0.5 hover:border-slate-400
        ${isUrgent 
          ? 'border-2 border-red-300 ring-1 ring-red-100/50' 
          : ''
        }
        ${className}
      `}
      style={{
        width: '100%',
        minHeight: 'var(--card-min-height)',
        padding: 'var(--card-padding)',
        marginBottom: 'var(--card-gap)',
        fontSize: 'var(--font-sm)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all var(--transition-medium) var(--easing-smooth)',
      }}
      onClick={onClick}
    >
      {/* Smart Status Bar - Tiered visual weight based on urgency */}
      {client.smartStatus && (
        <div className={viewDensity === 'compact' ? 'mb-1.5' : 'mb-2'}>
          <SmartStatusBar 
            status={client.smartStatus} 
            compact={viewDensity === 'compact'}
            onClick={() => {
              // Open client drawer to handle action
              if (onClick) onClick();
            }}
          />
        </div>
      )}

      {/* Header: Name + Status + Priority - Optimized for narrow layout */}
      <div className={viewDensity === 'compact' ? 'mb-1.5' : 'mb-2'}>
        <div className="flex items-start justify-between mb-1">
          <h3 className={`font-bold text-slate-900 leading-snug flex-1 mr-2 ${
            viewDensity === 'compact' ? 'text-[13px]' : 'text-[15px]'
          }`} style={{ 
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordBreak: 'break-word',
            hyphens: 'auto'
          }}>
            {capitalizeName(client.firstName || 'Unknown')} {capitalizeName(client.lastName || 'Client')}
          </h3>
          
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Delete button */}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click
                  onDelete(client._id);
                }}
                className={`
                  p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 
                  transition-all duration-200 opacity-0 group-hover:opacity-100
                  ${viewDensity === 'compact' ? 'w-5 h-5' : 'w-6 h-6'}
                `}
                title="Delete client"
              >
                <Trash2 className={viewDensity === 'compact' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
              </button>
            )}
            
            {/* Status indicator - polished Tailwind dot */}
            <div 
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-white shadow-sm ${statusIndicator.dotColor}`}
              title={statusIndicator.label}
            />
          </div>
        </div>
        
        {/* Critical info row - Enhanced with primary contact logic */}
        <div className={`flex items-center gap-1.5 text-slate-600 ${
          viewDensity === 'compact' ? 'text-[10px]' : 'text-[12px]'
        }`}>
          <span className="font-medium whitespace-nowrap">
            {(() => {
              const contact = getPrimaryContact(client);
              if (!contact) return 'No contact';
              const icon = contact.type === 'phone' ? '📞' : '✉️';
              return `${icon} ${contact.value}`;
            })()}
          </span>
          <span className="text-[9px] text-gray-500 font-medium whitespace-nowrap ml-auto">
            {getCompactTimeAgo()}
          </span>
        </div>
      </div>

      {/* Key info section - Enhanced with real data */}
      <div className={`flex-1 overflow-hidden ${viewDensity === 'compact' ? 'space-y-0.5' : 'space-y-0.5'}`}>
        {/* PMI - Compact display */}
        {(() => {
          const pmi = getPrimaryPMI(client);
          return pmi ? (
            <div className="flex items-center">
              <span className={`font-mono text-gray-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-semibold shadow-sm flex-shrink-0 ${
                viewDensity === 'compact' ? 'text-[9px]' : 'text-[10px]'
              }`}>
                PMI: {pmi}
              </span>
            </div>
          ) : null;
        })()}

        {/* Service Types - Full display with wrapping */}
        {(() => {
          const services = (client as any).serviceTypes || [];
          if (services.length === 0) return null;
          
          // Always show only 1 service to prevent cramping
          const firstService = services[0];
          const remainingCount = services.length - 1;
          
          return (
            <div className="flex items-start gap-1 overflow-hidden">
              <span 
                className={`inline-flex items-center bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold shadow-sm hover:bg-emerald-100 transition-colors leading-snug ${
                  viewDensity === 'compact' ? 'text-[9px]' : 'text-[10px]'
                }`}
                style={{
                  wordBreak: 'break-word',
                  hyphens: 'auto',
                  maxWidth: '100%',
                  flexShrink: 1
                }}
                title={firstService}
              >
                {firstService}
              </span>
              {remainingCount > 0 && (
                <span 
                  className={`inline-flex items-center bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 font-semibold shadow-sm hover:bg-blue-100 transition-colors cursor-help flex-shrink-0 whitespace-nowrap ${
                    viewDensity === 'compact' ? 'text-[9px]' : 'text-[10px]'
                  }`}
                  title={`All services:\n• ${services.join('\n• ')}`}
                >
                  +{remainingCount}
                </span>
              )}
            </div>
          );
        })()}

        {/* Waiver Type - Always render for consistent card height */}
        {!shouldHideDetails && (() => {
          const waiverType = (client as any).waiverType || client.primaryWaiverType;
          const formattedWaiver = waiverType ? formatWaiverTypeShort(waiverType) : null;
          
          return (
            <div className="flex items-center overflow-hidden min-h-[16px]">
              {formattedWaiver ? (
                <span className={`text-gray-700 font-medium truncate ${
                  viewDensity === 'compact' ? 'text-[9px]' : 'text-[10px]'
                }`} title={`Waiver: ${formattedWaiver}`}>
                  <span className="text-gray-500 font-semibold">Waiver:</span> {formattedWaiver}
                </span>
              ) : (
                <span className={`text-gray-400 italic ${
                  viewDensity === 'compact' ? 'text-[9px]' : 'text-[10px]'
                }`}>
                  No waiver
                </span>
              )}
            </div>
          );
        })()}

        {/* Provider Connections - Using computed summary with compact display */}
        {(() => {
          const connectionSummary = formatConnectionSummary(client.connectionSummary);
          
          return connectionSummary ? (
            <div className={`text-gray-600 ${viewDensity === 'compact' ? 'text-[10px]' : 'text-[12px]'}`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onNavigateToTab && connectionSummary.target) {
                    onNavigateToTab(connectionSummary.target);
                  }
                }}
                className="text-left hover:text-blue-600 transition-colors truncate"
              >
                <span className="font-semibold text-gray-700">Provider:</span> {connectionSummary.display.replace('Connected to ', '')}
              </button>
            </div>
          ) : (
            // Show fallback if no connectionSummary but client has currentProvider
            client.currentProvider && !shouldHideDetails ? (
              <div className={`text-gray-600 ${viewDensity === 'compact' ? 'text-[10px]' : 'text-[12px]'}`}>
                <span className="font-semibold text-gray-700">Provider:</span> <span className="truncate">{client.currentProvider}</span>
              </div>
            ) : null
          );
        })()}

        {/* Referrals - Using computed summary */}
        {(() => {
          const referralSummary = formatReferralSummary(client.referralSummary);
          return referralSummary ? (
            <div className={`text-gray-600 ${viewDensity === 'compact' ? 'text-[10px]' : 'text-[12px]'}`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onNavigateToTab && referralSummary.target) {
                    onNavigateToTab(referralSummary.target);
                  }
                }}
                className="text-left hover:text-blue-600 transition-colors"
              >
                <span className="font-semibold text-gray-700">Referrals:</span> {referralSummary.display}
              </button>
            </div>
          ) : null;
        })()}
      </div>

      {/* Create Referral Button - compact and consistent */}
      {onCreateReferral && (
        <div className={`mt-auto border-t border-gray-200/60 ${
          viewDensity === 'compact' ? 'pt-1.5' : 'pt-2'
        }`}>
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click
              onCreateReferral();
            }}
            className={`w-full text-center font-medium text-white bg-secondary-500 hover:bg-secondary-600 border border-secondary-500 rounded-md transition-all duration-200 flex items-center justify-center hover:shadow-sm active:scale-95 ${
              viewDensity === 'compact' 
                ? 'py-1 px-2 text-[10px] gap-1' 
                : 'py-1.5 px-3 text-[11px] gap-1'
            }`}
          >
            <svg className={viewDensity === 'compact' ? 'w-2.5 h-2.5' : 'w-3 h-3'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Referral
          </button>
        </div>
      )}
    </div>
  );
}

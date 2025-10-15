'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { capitalizeName } from '@/lib/formatting';
import { useWorkspaceStatus } from '@/hooks/use-workspace-status';
import type { Client as ClientType } from '@/types';

interface ClientListItemProps {
  client: ClientType;
  onClick?: () => void;
  onRequestUpdate?: () => void;
  onCreateReferral?: () => void;
  onDelete?: (clientId: string) => void;
  className?: string;
  connections?: any[];
  isSelected?: boolean;
}

export function ClientListItem({ 
  client, 
  onClick, 
  onRequestUpdate, 
  onCreateReferral, 
  onDelete,
  className = '', 
  connections = [], 
  isSelected = false 
}: ClientListItemProps) {
  const [isRequestingUpdate, setIsRequestingUpdate] = useState(false);
  
  // Get workspace status for this client
  const { getStatusForClient } = useWorkspaceStatus({ 
    clientIds: [client._id], 
    connections 
  });
  
  const workspaceStatus = getStatusForClient(client._id);

  // Get last update text
  const getLastUpdateText = () => {
    if (client.updatedAt) {
      try {
        const updateDate = typeof client.updatedAt === 'string' 
          ? parseISO(client.updatedAt) 
          : client.updatedAt;
        return formatDistanceToNow(updateDate, { addSuffix: true });
      } catch (error) {
        console.error('Error parsing updatedAt:', error);
      }
    }
    if (client.createdAt) {
      try {
        const createDate = typeof client.createdAt === 'string' 
          ? parseISO(client.createdAt) 
          : client.createdAt;
        return `Added ${formatDistanceToNow(createDate, { addSuffix: true })}`;
      } catch (error) {
        console.error('Error parsing createdAt:', error);
      }
    }
    return 'Recently added';
  };

  // Compact time formatter for card display
  const getCompactTimeAgo = () => {
    const timestamp = client.updatedAt || client.createdAt;
    if (!timestamp) return 'N/A';

    try {
      const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp;
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
    } catch (error) {
      console.error('Error formatting compact time:', error);
      return 'N/A';
    }
  };

  // Status indicator
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

  const statusIndicator = getStatusIndicator();
  const isUrgent = client.status === 'ACTIVE_FRUSTRATED' || client.status === 'ACTIVE_NEEDS_ATTENTION';

  return (
    <div 
      className={`
        group relative bg-white border border-slate-200 hover:border-blue-300
        hover:shadow-sm transition-all duration-300 rounded-lg overflow-x-hidden
        ${isUrgent ? 'ring-1 ring-red-200 border-red-300' : ''}
        ${className}
      `}
      onClick={onClick}
      style={{ 
        cursor: 'pointer',
        minHeight: 'calc(var(--card-min-height) + 1rem)',
        padding: 'var(--space-md)',
        fontSize: 'var(--font-xs)'
      }}
    >
      
      {/* Compact row - Fixed height layout with better spacing */}
      <div className="h-full flex flex-col justify-center gap-1.5">
        {/* Row 1: Name + Status */}
        <div className="flex items-center gap-2">
          <div 
            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-white shadow-sm ${statusIndicator.dotColor}`}
            title={statusIndicator.label}
          />
          <h3 className="text-[12px] font-bold text-slate-900 flex-1 truncate">
            {capitalizeName(client.firstName || 'Unknown')} {capitalizeName(client.lastName || 'Client')}
          </h3>
          {isUrgent && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700 flex-shrink-0">
              !
            </span>
          )}
        </div>
        
        {/* Row 2: Contact + PMI */}
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-slate-600 font-medium whitespace-nowrap flex-shrink-0">
            {client.phone ? `📞 ${client.phone}` : client.email ? `✉️ ${client.email?.slice(0, 18)}...` : 'No contact'}
          </span>
          {(client.pmi || client.pmiNumber) && (
            <span className="font-mono text-[9px] text-slate-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 whitespace-nowrap font-semibold flex-shrink-0">
              PMI: {client.pmi || client.pmiNumber}
            </span>
          )}
        </div>
        
        {/* Row 3: Services */}
        {(() => {
          const services = (client as any).serviceTypes || [];
          if (services.length === 0) return (
            <div className="flex items-center min-h-[18px]">
              <span className="text-gray-400 italic text-[9px]">No services</span>
            </div>
          );
          
          const firstService = services[0];
          const remainingCount = services.length - 1;
          
          return (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span 
                className="inline-flex items-center bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200 font-semibold text-[9px] shadow-sm hover:bg-emerald-100 transition-colors"
                title={`Service: ${firstService}`}
              >
                {firstService.length > 18 ? `${firstService.slice(0, 18)}...` : firstService}
              </span>
              {remainingCount > 0 && (
                <span 
                  className="inline-flex items-center bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md border border-blue-200 font-semibold text-[9px] shadow-sm hover:bg-blue-100 transition-colors cursor-help"
                  title={`${remainingCount} more service${remainingCount > 1 ? 's' : ''}:\n• ${services.slice(1).join('\n• ')}`}
                >
                  +{remainingCount}
                </span>
              )}
            </div>
          );
        })()}
      </div>
      
      {/* Actions - Hover buttons in top right */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1">
        {/* Delete Button */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(client._id);
            }}
            className="inline-flex items-center p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all duration-200"
            title="Delete client"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
        
        {/* Create Referral Button */}
        {onCreateReferral && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateReferral();
            }}
            className="inline-flex items-center px-1.5 py-1 text-xs font-medium text-white bg-secondary-500 hover:bg-secondary-600 rounded transition-colors duration-200"
            title="Create Referral"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

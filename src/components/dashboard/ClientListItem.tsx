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
          label: 'Closed/Discharged' 
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
        group relative bg-white border border-slate-200 hover:border-slate-300
        hover:shadow-sm transition-all duration-300 rounded-lg overflow-hidden
        ${isUrgent ? 'ring-1 ring-red-200 border-red-200' : ''}
        ${isSelected ? 'ring-2 ring-gray-400 bg-gray-50/50' : 'hover:bg-gray-50/30'}
        ${className}
      `}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-gray-500 rounded-full animate-pulse z-10" />
      )}
      
      {/* Main content row - Fixed width columns */}
      <div className="flex items-center px-4 py-3">
        {/* Status indicator */}
        <div 
          className={`w-3 h-3 rounded-full flex-shrink-0 mr-3 ring-2 ring-white shadow-sm ${statusIndicator.dotColor}`}
          title={statusIndicator.label}
        />
        
        {/* Name - Fixed width column */}
        <div className="w-40 sm:w-48 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {capitalizeName(client.firstName || 'Unknown')} {capitalizeName(client.lastName || 'Client')}
                        </h3>
                      </div>
          <div className="text-xs text-slate-500 truncate">
            {client.phone ? `📞 ${client.phone}` : client.email ? `✉️ ${client.email}` : 'No contact'}
          </div>
        </div>

        {/* Service - Fixed width */}
        <div className="hidden sm:block w-32 text-xs text-slate-600 font-medium truncate">
          {client.serviceType || client.serviceType1 || '—'}
        </div>

        {/* PMI - Fixed width, centered */}
        <div className="hidden md:block w-24 text-xs font-mono text-slate-500 text-center truncate">
          {client.pmi || client.pmiNumber || '—'}
        </div>

        {/* Last Update - Fixed width, centered */}
        <div className="hidden lg:block w-20 text-xs text-slate-500 text-center truncate">
          {getLastUpdateText().replace('Updated ', '').replace('Added ', '')}
        </div>

        {/* Actions - Fixed width, centered */}
        <div className="w-16 flex justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1">
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
      </div>
    </div>
  );
}

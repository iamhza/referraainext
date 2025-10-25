'use client';

import { Phone, Mail, MapPin, Calendar, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { SmartStatusBar } from './SmartStatusBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Client } from '@/types';

interface ClientListCardProps {
  client: Client;
  onClick?: () => void;
  onCreateReferral?: () => void;
  viewDensity?: 'comfortable' | 'compact';
  isSelected?: boolean;
}

export function ClientListCard({ 
  client, 
  onClick, 
  onCreateReferral,
  viewDensity = 'comfortable',
  isSelected = false 
}: ClientListCardProps) {
  
  // Get service status badge
  const getServiceStatus = () => {
    switch (client.status) {
      case 'UNPLACED':
        return { label: 'Seeking Services', color: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'REFERRAL_SENT':
        return { label: 'Referrals Pending', color: 'bg-blue-100 text-blue-700 border-blue-200' };
      case 'IN_PROCESS':
        return { label: 'Getting Connected', color: 'bg-purple-100 text-purple-700 border-purple-200' };
      case 'ACTIVE_STABLE':
        return { label: 'Services Active', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
      case 'ACTIVE_NEEDS_ATTENTION':
        return { label: 'Services At Risk', color: 'bg-amber-100 text-amber-700 border-amber-200' };
      case 'CLOSED_DISCHARGED':
        return { label: 'Case Closed', color: 'bg-gray-100 text-gray-600 border-gray-200' };
      default:
        return { label: client.status, color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const serviceStatus = getServiceStatus();
  const isCompact = viewDensity === 'compact';

  return (
    <div
      className={cn(
        'group relative bg-white border rounded-lg transition-all duration-200',
        'hover:shadow-sm',
        isSelected 
          ? 'border-primary-400 bg-primary-50/30 shadow-sm' 
          : 'border-slate-200 hover:border-slate-300',
        onClick && 'cursor-pointer',
        isCompact ? 'p-2.5' : 'p-3'
      )}
      onClick={onClick}
    >
      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 rounded-l-lg" />
      )}

      {/* Main Content - Horizontal Layout */}
      <div className="flex items-start gap-3 pl-1">
        
        {/* Avatar */}
        <div className={cn(
          'shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white font-semibold shadow-sm',
          isCompact ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-sm'
        )}>
          {client.firstName?.[0]}{client.lastName?.[0]}
        </div>

        {/* Left Section: Client Info + Smart Status */}
        <div className="flex-1 min-w-0 space-y-2">
          
          {/* Name + Service Status Badge */}
          <div className="flex items-center gap-2">
            <h3 className={cn(
              'font-bold text-slate-900 truncate',
              isCompact ? 'text-base' : 'text-lg'
            )}>
              {client.firstName} {client.lastName}
            </h3>
            
            <Badge className={cn(
              'shrink-0 border',
              serviceStatus.color,
              isCompact ? 'text-xs px-2 py-0' : 'text-xs px-2 py-0.5'
            )}>
              {serviceStatus.label}
            </Badge>
          </div>

          {/* Smart Status - Full Width */}
          <div className="max-w-2xl">
            <SmartStatusBar 
              status={client.smartStatus} 
              compact={isCompact}
              onClick={() => onClick?.()}
            />
          </div>

          {/* Contact Info - Horizontal */}
          {!isCompact && (
            <div className="flex items-center gap-4 text-sm text-slate-600">
              {client.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[200px]">{client.email}</span>
                </div>
              )}
              {client.city && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{client.city}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Section: Metadata + Actions */}
        <div className={cn(
          'shrink-0 flex flex-col items-end gap-2',
          isCompact ? 'w-32' : 'w-40'
        )}>
          
          {/* Last Updated */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar className="w-3 h-3" />
            <span>
              {client.updatedAt 
                ? formatDistanceToNow(new Date(client.updatedAt), { addSuffix: true })
                : 'Recently'
              }
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onClick?.();
              }}
              className={cn(
                'shrink-0',
                isCompact && 'h-7 text-xs'
              )}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Open
            </Button>
            
            {onCreateReferral && (
              <Button
                variant="default"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateReferral();
                }}
                className={cn(
                  'shrink-0',
                  isCompact && 'h-7 text-xs'
                )}
              >
                Refer
              </Button>
            )}
          </div>

          {/* Active Services Count */}
          {client.activeServicesCount && client.activeServicesCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {client.activeServicesCount} {client.activeServicesCount === 1 ? 'service' : 'services'}
            </Badge>
          )}
        </div>
      </div>

      {/* Hover Indicator */}
      <div className={cn(
        'absolute inset-0 rounded-lg border-2 border-primary-400 opacity-0 transition-opacity pointer-events-none',
        'group-hover:opacity-100'
      )} />
    </div>
  );
}


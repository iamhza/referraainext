import React, { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { cn } from '@/lib/shared/utils';
import { getAuthStatusConfig } from '../utils/colors';
import { isAuthExpired, isAuthExpiringSoon, getAuthDisplayText } from '../utils/calculations';
import type { AuthorizationCellProps } from '../types';

/**
 * Renders authorization status with tooltip
 * Extracted because it was 111 lines of complex inline logic
 */
export const AuthorizationCell = React.memo(({ authorization }: AuthorizationCellProps) => {
  const authDisplay = useMemo(() => {
    if (!authorization) {
      return {
        show: 'no-auth',
        label: null,
        sublabel: null,
        config: null,
        isExpired: false,
        isExpiringSoon: false,
      };
    }

    const isExpired = isAuthExpired(authorization.daysUntilExpiration);
    const isExpiringSoon = isAuthExpiringSoon(authorization.daysUntilExpiration);
    const config = getAuthStatusConfig(authorization.status, authorization.daysUntilExpiration);
    const { label, sublabel } = getAuthDisplayText(
      authorization.status,
      authorization.daysUntilExpiration,
      authorization.units,
      authorization.unitType
    );

    return {
      show: 'with-auth',
      label,
      sublabel,
      config,
      isExpired,
      isExpiringSoon,
    };
  }, [authorization]);

  if (authDisplay.show === 'no-auth') {
    return (
      <span className="text-xs text-slate-400">No Auth</span>
    );
  }

  const { label, sublabel, config, isExpired, isExpiringSoon } = authDisplay;
  const Icon = config!.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5">
            <Icon className={cn('w-3.5 h-3.5', config!.textColor)} />
            <div className="flex flex-col">
              <span className={cn('text-xs font-medium', config!.textColor)}>
                {label}
              </span>
              {sublabel && (
                <span className={cn(
                  'text-[10px] font-semibold',
                  isExpired ? 'text-[#991B1B]' :
                  isExpiringSoon ? 'text-orange-600' :
                  'text-slate-500'
                )}>
                  {sublabel}
                </span>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs bg-white border-2 border-slate-300 shadow-2xl p-4 z-[9999]"
        >
          <div className="space-y-2">
            <p className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-2">
              Authorization Details
            </p>
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-slate-900">
                <span className="text-slate-600">Status:</span> {
                  authorization!.status === 'APPROVED' ? 'Approved' :
                  authorization!.status === 'SUBMITTED' ? 'Pending Review' :
                  authorization!.status === 'DRAFT' ? 'Draft' :
                  authorization!.status === 'DENIED' ? 'Denied' :
                  authorization!.status === 'EXPIRED' ? 'Expired' :
                  authorization!.status
                }
              </p>
              {authorization!.units && authorization!.unitType && (
                <p className="text-sm font-semibold text-slate-900">
                  <span className="text-slate-600">Units:</span> {authorization!.units} {authorization!.unitType.toLowerCase().replace(/_/g, ' ')}
                </p>
              )}
              {authorization!.startDate && (
                <p className="text-sm font-semibold text-slate-900">
                  <span className="text-slate-600">Start:</span> {format(new Date(authorization!.startDate), 'MMM d, yyyy')}
                </p>
              )}
              {authorization!.endDate && (
                <p className="text-sm font-semibold text-slate-900">
                  <span className="text-slate-600">End:</span> {format(new Date(authorization!.endDate), 'MMM d, yyyy')}
                </p>
              )}
              {authorization!.approvalNumber && (
                <p className="text-sm font-semibold text-slate-900">
                  <span className="text-slate-600">Approval #:</span> {authorization!.approvalNumber}
                </p>
              )}
            </div>
            {isExpired && (
              <div 
                className="mt-3 pt-2 border-t -mx-4 -mb-4 px-4 py-2" 
                style={{ borderColor: '#991B1B', backgroundColor: '#FEE2E2' }}
              >
                <p className="text-sm font-bold" style={{ color: '#991B1B' }}>
                  ⚠️ Renewal Required
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

AuthorizationCell.displayName = 'AuthorizationCell';

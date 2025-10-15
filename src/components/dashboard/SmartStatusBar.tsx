'use client';

import { cn } from '@/lib/utils';
import { Clock, AlertCircle, FileText, Calendar, Flag } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface SmartStatus {
  text: string;
  subtext?: string;
  color: 'red' | 'orange' | 'yellow' | 'gray';
  urgencyScore: number;
  actionId: string;
  actionType: string;
  serviceContext?: string;
  dueDate?: string;
}

interface SmartStatusBarProps {
  status: SmartStatus | null;
  compact?: boolean;
  onClick?: () => void;
  className?: string;
}

const colorConfig = {
  red: {
    border: 'border-red-600',
    bg: 'bg-red-50',
    bgHover: 'hover:bg-red-100',
    text: 'text-red-900',
    subtext: 'text-red-700',
    icon: 'text-red-600',
  },
  orange: {
    border: 'border-orange-600',
    bg: 'bg-orange-50',
    bgHover: 'hover:bg-orange-100',
    text: 'text-orange-900',
    subtext: 'text-orange-700',
    icon: 'text-orange-600',
  },
  yellow: {
    border: 'border-yellow-600',
    bg: 'bg-yellow-50',
    bgHover: 'hover:bg-yellow-100',
    text: 'text-yellow-900',
    subtext: 'text-yellow-700',
    icon: 'text-yellow-600',
  },
  gray: {
    border: 'border-gray-400',
    bg: 'bg-gray-50',
    bgHover: 'hover:bg-gray-100',
    text: 'text-gray-900',
    subtext: 'text-gray-700',
    icon: 'text-gray-600',
  },
};

const actionTypeIcons = {
  request_status_update: AlertCircle,
  request_documentation: FileText,
  flag_concern: Flag,
  request_intake_date: Calendar,
  default: Clock,
};

export function SmartStatusBar({ status, compact = false, onClick, className }: SmartStatusBarProps) {
  if (!status) {
    return (
      <div className="px-3 py-2 text-xs text-gray-500 italic font-normal">
        All services stable
      </div>
    );
  }

  const colors = colorConfig[status.color];
  const Icon = actionTypeIcons[status.actionType as keyof typeof actionTypeIcons] || actionTypeIcons.default;

  if (compact) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'h-1 w-full rounded-full transition-all duration-200',
                colors.border.replace('border-', 'bg-'),
                onClick && 'cursor-pointer hover:h-1.5',
                className
              )}
              onClick={onClick}
              role={onClick ? 'button' : undefined}
              tabIndex={onClick ? 0 : undefined}
            />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">{status.text}</p>
              {status.subtext && <p className="text-xs opacity-90">{status.subtext}</p>}
              {status.serviceContext && (
                <p className="text-xs opacity-75">Service: {status.serviceContext}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg border-l-4 transition-all duration-200',
        colors.border,
        colors.bg,
        onClick && cn('cursor-pointer', colors.bgHover),
        'px-3 py-2',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      <div className="flex items-start gap-2.5">
        {/* Icon */}
        <div className={cn('flex-shrink-0 mt-0.5', colors.icon)}>
          <Icon className="h-4 w-4" strokeWidth={2.5} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p className={cn('text-[13px] font-semibold leading-tight tracking-tight', colors.text)}>
              {status.text}
            </p>
            {status.subtext && (
              <span className={cn('text-[11px] font-medium flex-shrink-0', colors.subtext)}>
                {status.subtext}
              </span>
            )}
          </div>
          
          {status.serviceContext && (
            <p className={cn('text-[11px] mt-0.5 font-medium opacity-75', colors.subtext)}>
              {status.serviceContext}
            </p>
          )}
        </div>

        {/* Hover indicator */}
        {onClick && (
          <div className={cn(
            'absolute inset-0 border-l-4 opacity-0 group-hover:opacity-10 transition-opacity duration-200',
            colors.border.replace('border-', 'bg-')
          )} />
        )}
      </div>
    </div>
  );
}

// Utility to format due date to readable text
export function formatDueText(dueDate: string | Date): string {
  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return overdueDays === 1 ? '1 day overdue' : `${overdueDays} days overdue`;
  }
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  if (diffDays <= 7) return `Due in ${diffDays} days`;
  return 'Due later';
}


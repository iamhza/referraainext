'use client';

import { cn } from '@/lib/utils';
import { Clock, AlertCircle, FileText, Calendar, Flag, Circle } from 'lucide-react';
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

const actionTypeIcons = {
  request_status_update: AlertCircle,
  request_documentation: FileText,
  flag_concern: Flag,
  request_intake_date: Calendar,
  default: Clock,
};

export function SmartStatusBar({ status, compact = false, onClick, className }: SmartStatusBarProps) {
  if (!status) {
    // No pending actions - show subtle stable state
    return (
      <div className={cn(
        'flex items-center gap-2 py-1.5 px-2 rounded-md bg-slate-50/50 border border-slate-100',
        className
      )}>
        <Circle className="w-2 h-2 text-slate-300 fill-slate-300" />
        <span className="text-xs text-slate-500 font-medium">All services stable</span>
      </div>
    );
  }

  const Icon = actionTypeIcons[status.actionType as keyof typeof actionTypeIcons] || actionTypeIcons.default;
  
  // Tiered urgency system based on score
  const isCritical = status.urgencyScore >= 80 || status.color === 'red'; // Full attention
  const isUrgent = status.urgencyScore >= 50 && status.urgencyScore < 80; // Moderate attention
  const isPending = status.urgencyScore >= 20 && status.urgencyScore < 50; // Minimal attention
  const isStable = status.urgencyScore < 20; // Very subtle presence

  // STABLE: Very subtle card - low visual weight but still visible
  if (isStable) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 transition-all duration-200 rounded-md',
          'bg-slate-50/30 border border-slate-100/50',
          onClick && 'cursor-pointer hover:bg-slate-50 hover:border-slate-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-1',
          compact ? 'py-1 px-1.5' : 'py-1.5 px-2',
          className
        )}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      >
        <Circle className="w-1.5 h-1.5 text-slate-300 fill-slate-300 shrink-0" />
        
        <p className={cn(
          'font-medium text-slate-500 leading-snug truncate',
          compact ? 'text-xs' : 'text-sm'
        )}>
          {status.text}
        </p>
      </div>
    );
  }

  // COMPACT VIEW (for dense layouts)
  if (compact) {
    if (isCritical) {
      return (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'h-1 w-full rounded-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-200 animate-pulse',
                  onClick && 'cursor-pointer hover:h-1.5 hover:from-red-600 hover:to-red-700',
                  className
                )}
                onClick={onClick}
                role={onClick ? 'button' : undefined}
                tabIndex={onClick ? 0 : undefined}
              />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="space-y-1">
                <p className="font-semibold text-red-600">🔴 {status.text}</p>
                {status.subtext && <p className="text-xs opacity-90">{status.subtext}</p>}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    if (isUrgent) {
      return (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'h-0.5 w-full rounded-full bg-orange-400 transition-all duration-200',
                  onClick && 'cursor-pointer hover:h-1 hover:bg-orange-500',
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
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    if (isPending) {
      return (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn('flex items-center gap-1.5 px-2 py-1', className)}>
                <div className="w-1 h-1 rounded-full bg-yellow-500 shrink-0" />
                <span className="text-[10px] text-slate-600 truncate font-medium">{status.text}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="space-y-1">
                <p className="font-medium">{status.text}</p>
                {status.subtext && <p className="text-xs opacity-90">{status.subtext}</p>}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    // Stable in compact: very subtle line
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'h-px w-full bg-slate-200 transition-all duration-200',
                onClick && 'cursor-pointer hover:h-0.5 hover:bg-slate-300',
                className
              )}
              onClick={onClick}
              role={onClick ? 'button' : undefined}
              tabIndex={onClick ? 0 : undefined}
            />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-xs text-slate-600">{status.text || 'Stable'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // 🔴 CRITICAL: Full attention-grabbing bar (Overdue, Issues, Emergencies)
  if (isCritical) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-lg',
          'border border-red-200/80',
          'bg-gradient-to-br from-red-50 via-red-50/80 to-transparent',
          'shadow-sm shadow-red-100/50',
          'transition-all duration-300',
          onClick && 'cursor-pointer hover:shadow-md hover:shadow-red-200/60 hover:border-red-300',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2',
          className
        )}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      >
        {/* Subtle animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-100/20 to-transparent animate-pulse" />
        
        {/* Content */}
        <div className="relative flex items-start gap-2.5 px-3 py-2.5">
          {/* Icon with background */}
          <div className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-red-100 mt-0.5">
            <Icon className="w-3 h-3 text-red-600" strokeWidth={2.5} />
          </div>
          
          {/* Text content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[13px] font-bold leading-tight tracking-tight text-red-900 truncate">
                {status.text}
              </p>
              {status.subtext && (
                <span className="text-[11px] font-semibold text-red-700 shrink-0">
                  {status.subtext}
                </span>
              )}
            </div>
            
            {status.serviceContext && (
              <p className="text-[11px] mt-1 font-medium text-red-700/70 truncate">
                {status.serviceContext}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 🟠 URGENT: Slim left accent (Due soon, needs attention)
  if (isUrgent) {
    return (
      <div
        className={cn(
          'relative rounded-md border-l-[3px] border-orange-400',
          'bg-white',
          'transition-all duration-200',
          onClick && 'cursor-pointer hover:bg-orange-50/40 hover:border-l-orange-500',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-1',
          className
        )}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      >
        <div className="flex items-center gap-2 pl-2.5 pr-2 py-2">
          <Icon className="w-3.5 h-3.5 text-orange-600 shrink-0" strokeWidth={2} />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[13px] font-semibold leading-snug text-slate-800 truncate">
                {status.text}
              </p>
              {status.subtext && (
                <span className="text-[11px] font-medium text-slate-600 shrink-0">
                  {status.subtext}
                </span>
              )}
            </div>
            {status.serviceContext && (
              <p className="text-[11px] mt-0.5 text-slate-500 truncate">
                {status.serviceContext}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 🟡 PENDING: Minimal dot + text (Has actions, not urgent)
  if (isPending) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 transition-all duration-200 rounded-md',
          onClick && 'cursor-pointer hover:bg-slate-50/80',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-1',
          'py-1.5 px-2',
          className
        )}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0" />
        
        <div className="flex-1 min-w-0 flex items-baseline gap-2">
          <p className="text-[13px] font-medium text-slate-600 leading-snug truncate">
            {status.text}
          </p>
          {status.subtext && (
            <span className="text-[11px] text-slate-500 shrink-0">
              {status.subtext}
            </span>
          )}
        </div>
      </div>
    );
  }

  return null;
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

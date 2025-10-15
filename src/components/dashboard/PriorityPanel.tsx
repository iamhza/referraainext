'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CheckCircle2, SkipForward, Eye, X, Clock, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import type { Client } from '@/types';

interface PriorityPanelProps {
  urgentClient: Client | null;
  onComplete: (clientId: string, actionId: string) => void;
  onSkip: () => void;
  onViewClient: (clientId: string) => void;
  onDismiss: () => void;
  className?: string;
}

export function PriorityPanel({
  urgentClient,
  onComplete,
  onSkip,
  onViewClient,
  onDismiss,
  className
}: PriorityPanelProps) {
  const [isCompleting, setIsCompleting] = useState(false);

  if (!urgentClient || !urgentClient.smartStatus) {
    // Empty state - all caught up
    return (
      <div className={cn(
        'w-full bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200',
        className
      )}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-green-900">
                  All Caught Up!
                </h3>
                <p className="text-xs text-green-700 mt-0.5">
                  No urgent actions right now. Great work!
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="text-green-700 hover:text-green-900 hover:bg-green-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const status = urgentClient.smartStatus;
  const isOverdue = status.color === 'red';

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await onComplete(urgentClient._id!, status.actionId);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className={cn(
      'w-full border-b shadow-sm',
      isOverdue 
        ? 'bg-gradient-to-r from-red-50 via-red-50/80 to-orange-50/50 border-red-200' 
        : 'bg-gradient-to-r from-orange-50 via-orange-50/80 to-yellow-50/50 border-orange-200',
      className
    )}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg',
                isOverdue ? 'bg-red-100' : 'bg-orange-100'
              )}>
                <AlertCircle 
                  className={cn(
                    'h-5 w-5',
                    isOverdue ? 'text-red-600' : 'text-orange-600'
                  )} 
                  strokeWidth={2.5} 
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h3 className={cn(
                    'text-sm font-bold tracking-tight',
                    isOverdue ? 'text-red-900' : 'text-orange-900'
                  )}>
                    NEXT ACTION
                  </h3>
                  {status.subtext && (
                    <span className={cn(
                      'inline-flex items-center gap-1 text-xs font-semibold',
                      isOverdue ? 'text-red-700' : 'text-orange-700'
                    )}>
                      <Clock className="h-3 w-3" strokeWidth={2.5} />
                      {status.subtext}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="ml-11 space-y-1">
              <p className={cn(
                'text-base font-semibold',
                isOverdue ? 'text-red-950' : 'text-orange-950'
              )}>
                {urgentClient.firstName} {urgentClient.lastName}
              </p>
              <p className={cn(
                'text-sm font-medium',
                isOverdue ? 'text-red-800' : 'text-orange-800'
              )}>
                {status.text}
                {status.serviceContext && (
                  <span className="ml-2 opacity-75">
                    ({status.serviceContext})
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              onClick={handleComplete}
              disabled={isCompleting}
              className={cn(
                'font-semibold shadow-sm',
                isOverdue 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              )}
            >
              {isCompleting ? (
                <>
                  <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" strokeWidth={2.5} />
                  Mark Complete
                </>
              )}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewClient(urgentClient._id!)}
              className={cn(
                'font-semibold border-2',
                isOverdue 
                  ? 'border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400' 
                  : 'border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400'
              )}
            >
              <Eye className="h-4 w-4 mr-2" strokeWidth={2.5} />
              View Client
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={onSkip}
              className={cn(
                'font-semibold',
                isOverdue 
                  ? 'text-red-700 hover:bg-red-100' 
                  : 'text-orange-700 hover:bg-orange-100'
              )}
            >
              <SkipForward className="h-4 w-4 mr-2" strokeWidth={2.5} />
              Skip
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              className={cn(
                isOverdue 
                  ? 'text-red-600 hover:bg-red-100' 
                  : 'text-orange-600 hover:bg-orange-100'
              )}
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


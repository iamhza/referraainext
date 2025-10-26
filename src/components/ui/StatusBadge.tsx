import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, User } from 'lucide-react';
import { cn } from '@/lib/shared/utils';
import type { ClientStatus } from '@/types';

interface StatusBadgeProps {
  status: ClientStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusBadge({ 
  status, 
  showIcon = true, 
  size = 'md',
  className 
}: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'ACTIVE_STABLE':
        return {
          label: 'Active & Stable',
          icon: Shield,
          className: 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200 shadow-sm',
          iconClassName: 'text-green-600'
        };
      case 'ACTIVE_FRUSTRATED':
        return {
          label: 'Active & Frustrated',
          icon: AlertTriangle,
          className: 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-200 shadow-sm',
          iconClassName: 'text-amber-600'
        };
      case 'UNPLACED_NEW':
        return {
          label: 'Unplaced/New',
          icon: User,
          className: 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 shadow-sm',
          iconClassName: 'text-blue-600'
        };
      default:
        return {
          label: 'Unknown Status',
          icon: User,
          className: 'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border-gray-200 shadow-sm',
          iconClassName: 'text-gray-600'
        };
    }
  };
  
  const config = getStatusConfig();
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'text-xs py-1.5 px-3 gap-1.5',
    md: 'text-sm py-2 px-4 gap-2',
    lg: 'text-base py-2.5 px-5 gap-2.5'
  };
  
  return (
    <Badge 
      className={cn(
        'flex items-center font-semibold rounded-lg border transition-all duration-200 hover:shadow-md',
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={cn('h-3.5 w-3.5', config.iconClassName)} />}
      {config.label}
    </Badge>
  );
} 
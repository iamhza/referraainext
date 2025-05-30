import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
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
          className: 'bg-green-50 text-green-700 border-green-100',
          iconClassName: 'text-green-500'
        };
      case 'ACTIVE_FRUSTRATED':
        return {
          label: 'Active & Frustrated',
          icon: AlertTriangle,
          className: 'bg-amber-50 text-amber-700 border-amber-100',
          iconClassName: 'text-amber-500'
        };
      case 'UNPLACED_NEW':
        return {
          label: 'Unplaced/New',
          icon: User,
          className: 'bg-blue-50 text-blue-700 border-blue-100',
          iconClassName: 'text-blue-500'
        };
      default:
        return {
          label: 'Unknown Status',
          icon: User,
          className: 'bg-gray-50 text-gray-700 border-gray-100',
          iconClassName: 'text-gray-500'
        };
    }
  };
  
  const config = getStatusConfig();
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'text-xs py-1 px-2',
    md: 'text-sm py-1.5 px-3',
    lg: 'text-base py-2 px-4'
  };
  
  return (
    <Badge 
      className={cn(
        'flex items-center gap-1.5 font-medium rounded-full',
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={cn('h-4 w-4', config.iconClassName)} />}
      {config.label}
    </Badge>
  );
} 
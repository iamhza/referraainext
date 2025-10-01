import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon';
}

export function Logo({ className, size = 'md', variant = 'full' }: LogoProps) {
  const iconSizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-10 w-10',
    xl: 'h-12 w-12'
  };

  const iconTextSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl', 
    xl: 'text-3xl'
  };

  const logoTextSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  if (variant === 'icon') {
    return (
      <div className={cn(
        "flex items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-sm",
        iconSizeClasses[size],
        className
      )}>
        <span className={cn(
          "font-suisse font-bold text-white",
          iconTextSizeClasses[size]
        )}>
          R
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex items-center">
        {/* Icon */}
        <div className={cn(
          "flex items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-sm mr-3",
          iconSizeClasses[size]
        )}>
          <span className={cn(
            "font-suisse font-bold text-white",
            iconTextSizeClasses[size]
          )}>
            R
          </span>
        </div>
        
        {/* Wordmark */}
        <div className="flex items-center">
          <span 
            className={cn(
              "font-suisse font-semibold tracking-tight",
              logoTextSizeClasses[size],
              "bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent"
            )}
            style={{ 
              fontFamily: 'var(--font-suisse)',
              letterSpacing: '-0.02em'
            }}
          >
            Referra
          </span>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon';
}

export function Logo({ className, size = 'md', variant = 'full' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-10 w-10',
    xl: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl', 
    xl: 'text-3xl'
  };

  if (variant === 'icon') {
    return (
      <div className={cn(
        "flex items-center justify-center rounded-full bg-blue-100",
        sizeClasses[size],
        className
      )}>
        <span className={cn(
          "font-bold text-blue-600",
          textSizeClasses[size]
        )}>
          R
        </span>
      </div>
    );
  }

  const logoHeightClasses = {
    sm: 'h-4',
    md: 'h-5',
    lg: 'h-6',
    xl: 'h-7'
  };

  return (
    <div className={cn("flex items-center space-x-3", className)}>
      <div className={cn(
        "flex items-center justify-center rounded-full bg-blue-100",
        sizeClasses[size]
      )}>
        <span className={cn(
          "font-bold text-blue-600",
          textSizeClasses[size]
        )}>
          R
        </span>
      </div>
      <img 
        src="/refrr.png" 
        alt="referra" 
        className={cn("w-auto", logoHeightClasses[size])}
      />
    </div>
  );
}

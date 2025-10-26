import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/shared/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon';
}

export function Logo({ className, size = 'md', variant = 'full' }: LogoProps) {
  const [isLoading, setIsLoading] = useState(true);
  const iconSizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-10 w-10',
    xl: 'h-12 w-12'
  };

  const iconPixelSizes = {
    sm: 24,
    md: 32,
    lg: 40,
    xl: 48
  };

  const logoHeightClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-9',
    xl: 'h-14'
  };

  const logoPixelHeights = {
    sm: 24,
    md: 32,
    lg: 40,
    xl: 56
  };

  const logoPixelWidths = {
    sm: 120,
    md: 160,
    lg: 200,
    xl: 280
  };

  if (variant === 'icon') {
    return (
      <div className={cn(
        "flex items-center justify-center rounded-lg overflow-hidden relative",
        iconSizeClasses[size],
        className
      )}>
        {isLoading && (
          <div className={cn(
            "absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-shimmer bg-[length:200%_100%]",
            "rounded-lg"
          )} />
        )}
        <Image
          src="/icon.png"
          alt="Referra"
          width={iconPixelSizes[size]}
          height={iconPixelSizes[size]}
          className={cn(
            "object-contain transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100"
          )}
          onLoad={() => setIsLoading(false)}
        />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center relative", className)}>
      {isLoading && (
        <div className={cn(
          "absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-shimmer bg-[length:200%_100%]",
          "rounded-lg",
          logoHeightClasses[size]
        )} 
        style={{ width: logoPixelWidths[size] }}
        />
      )}
      <Image
        src="/referra-logo.png"
        alt="Referra"
        width={logoPixelWidths[size]}
        height={logoPixelHeights[size]}
        className={cn(
          "object-contain transition-opacity duration-300",
          logoHeightClasses[size],
          isLoading ? "opacity-0" : "opacity-100"
        )}
        priority
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
}

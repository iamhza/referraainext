'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background-500">
      <div className="flex flex-col min-h-screen">
        <main className={cn(
          "flex-1",
          "transition-all duration-300 ease-in-out",
          "bg-gradient-to-b from-background-100 to-background-500",
        )}>
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 
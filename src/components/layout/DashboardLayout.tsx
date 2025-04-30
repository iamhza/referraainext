'use client';

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50/30">
      <Sidebar />
      <main className={cn(
        "lg:pl-72 min-h-screen",
        "transition-all duration-300 ease-in-out",
        "bg-gradient-to-b from-gray-50/50 to-white",
      )}>
        <div className="h-full py-8">
          {children}
        </div>
      </main>
    </div>
  );
} 
'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  
  // For workspace pages, don't show the sidebar since workspace has its own navigation
  const isWorkspacePage = pathname?.includes('/workspace');
  
  if (isWorkspacePage) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="min-h-screen lg:pl-64">
        {children}
      </main>
    </div>
  );
} 
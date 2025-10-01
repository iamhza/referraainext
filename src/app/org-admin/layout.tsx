'use client';

import { usePathname } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function OrgAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use the unified dashboard layout that case managers use
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}
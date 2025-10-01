'use client'

import { usePathname } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default function CaseManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isWorkspacePage = pathname?.startsWith('/case-manager/workspace')

  if (isWorkspacePage) {
    // Workspace pages get full immersion - no main sidebar
    return (
      <div className="h-screen bg-white">
        {children}
      </div>
    )
  }

  // Regular case manager pages get the full dashboard layout with sidebar and topbar
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  )
} 
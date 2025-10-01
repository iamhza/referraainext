import { Sidebar } from '@/components/layout/Sidebar'

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen bg-white">
      {children}
    </div>
  )
} 
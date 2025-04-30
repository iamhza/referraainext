import { Sidebar } from '@/components/layout/Sidebar'

export default function CaseManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 ml-64 lg:ml-64">
        {children}
      </main>
    </div>
  )
} 
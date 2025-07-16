import { Sidebar } from '@/components/layout/Sidebar'

export default function CaseManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="min-h-screen lg:pl-64">
        {children}
      </main>
    </div>
  )
} 
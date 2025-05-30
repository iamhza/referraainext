import { TopNav } from '@/components/layout/TopNav'

export default function CaseManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50/50 flex flex-col">
      <TopNav />
      <main className="flex-1 container mx-auto px-8 md:px-12 lg:px-16 xl:px-24 max-w-screen-2xl">
        {children}
      </main>
    </div>
  )
} 
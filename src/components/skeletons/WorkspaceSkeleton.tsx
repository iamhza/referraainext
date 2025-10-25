import { Skeleton } from "@/components/ui/skeleton";

export function WorkspaceSkeleton() {
  return (
    <div className="flex h-screen bg-[#F9FAFB] overflow-hidden">
      {/* Far-Left Icon Bar */}
      <div className="w-[60px] bg-slate-900 flex flex-col items-center py-4 gap-3 flex-shrink-0">
        <Skeleton className="w-11 h-11 rounded-lg bg-white/10" />
        <Skeleton className="w-11 h-11 rounded-lg bg-white/20" />
        <div className="flex-1" />
        <Skeleton className="w-11 h-11 rounded-lg bg-white/10" />
      </div>

      {/* Left Panel - Issues Sidebar */}
      <div className="w-[320px] bg-white flex flex-col flex-shrink-0 border-r border-slate-200">
        {/* Header */}
        <div className="px-4 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-8" />
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-2">
          <Skeleton className="h-8 w-full rounded" />
        </div>

        {/* Issues List */}
        <div className="flex-1 py-2 space-y-3 px-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2" style={{ animationDelay: `${i * 75}ms` }}>
              {/* Client Header */}
              <div className="flex items-center gap-2 px-2">
                <Skeleton className="w-5 h-5 rounded" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-6" />
              </div>
              
              {/* Issue */}
              <div className="flex items-center gap-2 px-6 py-2">
                <Skeleton className="w-4 h-4 rounded-full" />
                <Skeleton className="h-3 flex-1" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Panel */}
      <div className="flex-1 flex flex-col bg-white border-r border-slate-200">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-slate-200">
          <Skeleton className="h-6 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Messages Area */}
        <div className="flex-1 px-6 py-4 space-y-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3" style={{ animationDelay: `${i * 100}ms` }}>
              <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="px-6 py-4 border-t border-slate-200">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>

      {/* Right Details Panel */}
      <div className="w-[340px] bg-white flex flex-col flex-shrink-0">
        {/* Panel Header */}
        <div className="px-6 py-4 border-b border-slate-200">
          <Skeleton className="h-5 w-32" />
        </div>

        {/* Details Content */}
        <div className="flex-1 px-6 py-4 space-y-6">
          {/* User Info Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>

          {/* Details Sections */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3" style={{ animationDelay: `${i * 125}ms` }}>
              <Skeleton className="h-4 w-20" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


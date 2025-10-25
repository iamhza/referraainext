import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton() {
  return (
    <div className="w-full space-y-4 p-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Table Header */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="grid grid-cols-8 gap-4 p-4 border-b border-slate-200 bg-slate-50">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-10" />
        </div>

        {/* Table Rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-8 gap-4 p-4 border-b border-slate-100 last:border-b-0"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {/* Client Name */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>

            {/* Provider */}
            <Skeleton className="h-4 w-28" />

            {/* Service */}
            <Skeleton className="h-4 w-32" />

            {/* Status */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>

            {/* Authorization */}
            <Skeleton className="h-6 w-20 rounded-full" />

            {/* Issues */}
            <Skeleton className="h-6 w-16 rounded-full" />

            {/* Last Updated */}
            <Skeleton className="h-4 w-20" />

            {/* Menu */}
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between mt-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
    </div>
  );
}



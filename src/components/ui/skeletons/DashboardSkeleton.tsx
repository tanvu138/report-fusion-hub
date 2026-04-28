import { Skeleton } from '@/components/ui/skeleton';

const DashboardSkeleton = () => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Filter tabs + search */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-48" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-md border">
        {/* Table header */}
        <div className="flex items-center gap-4 px-4 py-3 border-b bg-muted/50">
          <Skeleton className="h-4 w-[35%]" />
          <Skeleton className="h-4 w-[10%]" />
          <Skeleton className="h-4 w-[10%]" />
          <Skeleton className="h-4 w-[15%]" />
          <Skeleton className="h-4 w-[10%]" />
          <Skeleton className="h-4 w-[10%]" />
        </div>
        {/* Table rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b last:border-0">
            <div className="w-[35%] space-y-1">
              <Skeleton className="h-4 w-[80%]" />
              <Skeleton className="h-3 w-[50%]" />
            </div>
            <Skeleton className="h-4 w-[10%]" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-1.5 w-20" />
            <Skeleton className="h-4 w-[10%]" />
            <div className="flex gap-1 w-[10%]">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardSkeleton;

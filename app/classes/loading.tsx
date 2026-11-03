import ClassGridSkeleton from '@/components/classes/ClassGridSkeleton';

export default function ClassesLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Skeleton */}
      <div className="mb-6">
        <div className="h-9 w-80 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Filter Bar Skeleton */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-48 h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-48 h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Sort Controls Skeleton */}
      <div className="flex gap-2 mb-6">
        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
      </div>

      <ClassGridSkeleton />
    </div>
  );
}

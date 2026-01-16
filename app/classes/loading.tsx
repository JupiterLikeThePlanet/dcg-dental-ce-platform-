export default function ClassesLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Skeleton */}
      <div className="mb-6">
        <div className="h-9 w-80 bg-gray-200 rounded animate-pulse mb-2"></div>
        <div className="h-5 w-40 bg-gray-200 rounded animate-pulse"></div>
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

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white border-2 border-gray-200 rounded-sm overflow-hidden">
            {/* Image Skeleton */}
            <div className="h-48 bg-gray-200 animate-pulse"></div>
            
            {/* Content Skeleton */}
            <div className="p-4 space-y-3">
              <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="pt-3 border-t border-gray-200 flex justify-between">
                <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
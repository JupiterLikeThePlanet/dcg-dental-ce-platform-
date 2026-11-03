// Placeholder cards shown while class results load.
// Used by app/classes/loading.tsx (first load) and the Suspense fallback in app/classes/page.tsx (filter/sort/page changes).
export default function ClassGridSkeleton() {
  return (
    <div>
      {/* Result count skeleton */}
      <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-4"></div>

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

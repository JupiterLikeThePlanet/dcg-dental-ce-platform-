import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import SortControls from '@/components/classes/SortControls';
import FilterBar from '@/components/classes/FilterBar';
import ClassResults from '@/components/classes/ClassResults';
import ClassGridSkeleton from '@/components/classes/ClassGridSkeleton';
import { ClassesNavProvider, PendingResults } from '@/components/classes/ClassesNavigation';
import { getClassFilterOptions } from '@/lib/class-filter-options';

// Force dynamic rendering (no caching) so we always get fresh data
export const dynamic = 'force-dynamic';

// Define valid sort options
type SortOption = 'date' | 'instructor' | 'price' | 'location';
type SortDirection = 'asc' | 'desc';

// Map sort options to database columns
const sortColumnMap: Record<SortOption, string> = {
  date: 'start_date',
  instructor: 'instructor_name',
  price: 'price',
  location: 'city',
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ClassesPage({ searchParams }: PageProps) {
  // In Next.js 14+, searchParams is a Promise
  const params = await searchParams;

  // Parse all URL parameters with defaults
  const sortParam = (params.sort as SortOption) || 'date';
  const dirParam = (params.dir as SortDirection) || 'asc';
  const pageParam = params.page as string || '1';
  const searchQuery = (params.search as string) || '';
  const stateFilter = (params.state as string) || '';
  const categoryFilter = (params.category as string) || '';
  const attendanceTypeFilter = (params.attendance_type as string) || '';

  // Validate sort option
  const validSort: SortOption = ['date', 'instructor', 'price', 'location'].includes(sortParam)
    ? sortParam
    : 'date';
  const validDirection: SortDirection = ['asc', 'desc'].includes(dirParam)
    ? dirParam
    : 'asc';

  // Validate page number
  const currentPage = Math.max(1, parseInt(pageParam, 10) || 1);

  // Today's date string (YYYY-MM-DD) — classes with end_date before this are hidden
  const today = new Date().toISOString().split('T')[0];

  // Create Supabase client for Server Component
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // Dropdown options are cached (lib/class-filter-options.ts), so filter clicks don't wait on them.
  // On failure, fall back to empty dropdowns rather than breaking the page (same as before).
  let availableStates: string[] = [];
  let availableCategories: string[] = [];
  try {
    const options = await getClassFilterOptions(today);
    availableStates = options.states;
    availableCategories = options.categories;
  } catch (err) {
    console.error(err);
  }

  const filters = {
    search: searchQuery,
    state: stateFilter,
    category: categoryFilter,
    attendanceType: attendanceTypeFilter,
  };

  // A new key on every filter/sort/page change makes React treat the boundary as new,
  // so the skeleton shows immediately instead of the old cards freezing on screen.
  const resultsKey = JSON.stringify({ ...filters, validSort, validDirection, currentPage });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Browse Dental CE Classes
        </h1>
      </div>

      <ClassesNavProvider>
      {/* Search and Filter Bar */}
      <FilterBar
        currentSearch={searchQuery}
        currentState={stateFilter}
        currentCategory={categoryFilter}
        currentAttendanceType={attendanceTypeFilter}
        availableStates={availableStates}
        availableCategories={availableCategories}
      />

      {/* Sort Controls */}
      <SortControls currentSort={validSort} currentDirection={validDirection} />

      {/* Skeleton from the moment of the click (PendingResults) until results stream in (Suspense) */}
      <PendingResults>
        <Suspense key={resultsKey} fallback={<ClassGridSkeleton />}>
          <ClassResults
            supabase={supabase}
            filters={filters}
            sortColumn={sortColumnMap[validSort]}
            ascending={validDirection === 'asc'}
            currentPage={currentPage}
            today={today}
          />
        </Suspense>
      </PendingResults>
      </ClassesNavProvider>
    </div>
  );
}

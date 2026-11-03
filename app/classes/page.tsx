import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import SortControls from '@/components/classes/SortControls';
import FilterBar from '@/components/classes/FilterBar';
import ClassResults from '@/components/classes/ClassResults';
import ClassGridSkeleton from '@/components/classes/ClassGridSkeleton';

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

  // Dropdown options don't depend on the active filters, so fetch both at once.
  const [{ data: statesData }, { data: categoriesData }] = await Promise.all([
    supabase
      .from('classes')
      .select('state')
      .eq('status', 'approved')
      .is('deleted_at', null)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .not('state', 'is', null),
    supabase
      .from('classes')
      .select('category')
      .eq('status', 'approved')
      .is('deleted_at', null)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .not('category', 'is', null),
  ]);

  // Extract unique values and sort alphabetically
  const availableStates = [...new Set(statesData?.map(c => c.state).filter(Boolean) || [])].sort() as string[];
  const availableCategories = [...new Set(categoriesData?.map(c => c.category).filter(Boolean) || [])].sort() as string[];

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

      {/* Count, grid, and pagination stream in; skeleton shows meanwhile */}
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
    </div>
  );
}

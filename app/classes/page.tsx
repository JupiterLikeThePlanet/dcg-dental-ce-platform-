import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import ClassGrid from '@/components/classes/ClassGrid';
import SortControls from '@/components/classes/SortControls';
import Pagination from '@/components/classes/Pagination';

// Force dynamic rendering (no caching) so we always get fresh data
export const dynamic = 'force-dynamic';

// Pagination settings
const ITEMS_PER_PAGE = 20;

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
  
  // Parse sort parameters with defaults
  const sortParam = (params.sort as SortOption) || 'date';
  const dirParam = (params.dir as SortDirection) || 'asc';
  const pageParam = params.page as string || '1';
  
  // Validate sort option
  const validSort: SortOption = ['date', 'instructor', 'price', 'location'].includes(sortParam) 
    ? sortParam 
    : 'date';
  const validDirection: SortDirection = ['asc', 'desc'].includes(dirParam) 
    ? dirParam 
    : 'asc';
  
  // Validate page number
  const currentPage = Math.max(1, parseInt(pageParam, 10) || 1);
  
  // Get the database column name
  const sortColumn = sortColumnMap[validSort];

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

  // First, get total count for pagination
  const { count: totalCount, error: countError } = await supabase
    .from('classes')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved')
    .is('deleted_at', null);

  if (countError) {
    console.error('Error fetching count:', countError);
  }

  const totalItems = totalCount || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  
  // Ensure current page is within bounds
  const validPage = Math.min(currentPage, Math.max(1, totalPages));
  
  // Calculate offset for pagination
  const offset = (validPage - 1) * ITEMS_PER_PAGE;

  // Fetch paginated classes with sorting
  const { data: classes, error } = await supabase
    .from('classes')
    .select('*')
    .eq('status', 'approved')
    .is('deleted_at', null)
    .order(sortColumn, { ascending: validDirection === 'asc' })
    .range(offset, offset + ITEMS_PER_PAGE - 1);

  // Handle error state
  if (error) {
    console.error('Error fetching classes:', error);
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Browse Dental CE Classes
        </h1>
        <div className="bg-red-50 border border-red-200 rounded-sm p-4">
          <p className="text-red-700">
            Error loading classes. Please try again later.
          </p>
          <p className="text-red-500 text-sm mt-1">
            {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Browse Dental CE Classes
        </h1>
        <p className="text-gray-600">
          {totalItems} {totalItems === 1 ? 'class' : 'classes'} available
        </p>
      </div>

      {/* Sort Controls */}
      <SortControls currentSort={validSort} currentDirection={validDirection} />

      {/* Class Grid */}
      <ClassGrid classes={classes || []} />

      {/* Pagination */}
      <Pagination 
        currentPage={validPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={ITEMS_PER_PAGE}
      />
    </div>
  );
}
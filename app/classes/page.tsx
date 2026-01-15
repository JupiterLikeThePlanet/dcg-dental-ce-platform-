import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import ClassGrid from '@/components/classes/ClassGrid';
import SortControls from '@/components/classes/SortControls';

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
  
  // Parse sort parameters with defaults
  const sortParam = (params.sort as SortOption) || 'date';
  const dirParam = (params.dir as SortDirection) || 'asc';
  
  // Validate sort option
  const validSort: SortOption = ['date', 'instructor', 'price', 'location'].includes(sortParam) 
    ? sortParam 
    : 'date';
  const validDirection: SortDirection = ['asc', 'desc'].includes(dirParam) 
    ? dirParam 
    : 'asc';
  
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

  // Fetch all approved classes with sorting
  const { data: classes, error } = await supabase
    .from('classes')
    .select('*')
    .eq('status', 'approved')
    .is('deleted_at', null)
    .order(sortColumn, { ascending: validDirection === 'asc' });

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

  const classCount = classes?.length || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Browse Dental CE Classes
        </h1>
        <p className="text-gray-600">
          {classCount} {classCount === 1 ? 'class' : 'classes'} available
        </p>
      </div>

      {/* Sort Controls */}
      <SortControls currentSort={validSort} currentDirection={validDirection} />

      {/* Class Grid */}
      <ClassGrid classes={classes || []} />
    </div>
  );
}
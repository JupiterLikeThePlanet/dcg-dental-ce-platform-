import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import ClassGrid from '@/components/classes/ClassGrid';
import SortControls from '@/components/classes/SortControls';
import Pagination from '@/components/classes/Pagination';
import FilterBar from '@/components/classes/FilterBar';

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
  
  // Parse all URL parameters with defaults
  const sortParam = (params.sort as SortOption) || 'date';
  const dirParam = (params.dir as SortDirection) || 'asc';
  const pageParam = params.page as string || '1';
  const searchQuery = (params.search as string) || '';
  const cityFilter = (params.city as string) || '';
  const categoryFilter = (params.category as string) || '';
  
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

  // Fetch all unique cities for the filter dropdown
  const { data: citiesData } = await supabase
    .from('classes')
    .select('city')
    .eq('status', 'approved')
    .is('deleted_at', null);
  
  // Extract unique cities and sort alphabetically
  const availableCities = [...new Set(citiesData?.map(c => c.city) || [])].sort();

  // Fetch all unique categories for the filter dropdown
  const { data: categoriesData } = await supabase
    .from('classes')
    .select('category')
    .eq('status', 'approved')
    .is('deleted_at', null)
    .not('category', 'is', null);
  
  // Extract unique categories and sort alphabetically
  const availableCategories = [...new Set(categoriesData?.map(c => c.category).filter(Boolean) || [])].sort() as string[];

  // Build the base query for counting
  let countQuery = supabase
    .from('classes')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved')
    .is('deleted_at', null);

  // Apply search filter to count query
  if (searchQuery) {
    // countQuery = countQuery.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,instructor_name.ilike.%${searchQuery}%`);
    // countQuery = countQuery.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,instructor_name.ilike.%${searchQuery}%,title.fts.${searchQuery},description.fts.${searchQuery}`);
    
      // Search with partial matching - trims to word stem for better results
    const searchTerm = searchQuery.toLowerCase().trim();
    // Remove common suffixes for stem matching (e.g., "dental" matches "dentistry")
    const stemmedSearch = searchTerm
      .replace(/ing$/, '')
      .replace(/istry$/, '')
      .replace(/ist$/, '')
      .replace(/tion$/, '')
      .replace(/al$/, '');
    
    // Use the shorter of original or stemmed (minimum 3 chars)
    const effectiveSearch = stemmedSearch.length >= 3 ? stemmedSearch : searchTerm;
    
    countQuery = countQuery.or(`title.ilike.%${effectiveSearch}%,description.ilike.%${effectiveSearch}%,instructor_name.ilike.%${searchQuery}%`);
  }

  // Apply city filter to count query
  if (cityFilter) {
    countQuery = countQuery.eq('city', cityFilter);
  }

  // Apply category filter to count query
  if (categoryFilter) {
    countQuery = countQuery.eq('category', categoryFilter);
  }

  const { count: totalCount, error: countError } = await countQuery;

  if (countError) {
    console.error('Error fetching count:', countError);
  }

  const totalItems = totalCount || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  
  // Ensure current page is within bounds
  const validPage = Math.min(currentPage, Math.max(1, totalPages));
  
  // Calculate offset for pagination
  const offset = (validPage - 1) * ITEMS_PER_PAGE;

  // Build the main query
  let mainQuery = supabase
    .from('classes')
    .select('*')
    .eq('status', 'approved')
    .is('deleted_at', null);

  // Apply search filter to main query
  if (searchQuery) {
    // mainQuery = mainQuery.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,instructor_name.ilike.%${searchQuery}%`);
  
    // Search with partial matching - trims to word stem for better results
    const searchTerm = searchQuery.toLowerCase().trim();
    // Remove common suffixes for stem matching (e.g., "dental" matches "dentistry")
    const stemmedSearch = searchTerm
      .replace(/ing$/, '')
      .replace(/istry$/, '')
      .replace(/ist$/, '')
      .replace(/tion$/, '')
      .replace(/al$/, '');
    
    // Use the shorter of original or stemmed (minimum 3 chars)
    const effectiveSearch = stemmedSearch.length >= 3 ? stemmedSearch : searchTerm;
    
    mainQuery = mainQuery.or(`title.ilike.%${effectiveSearch}%,description.ilike.%${effectiveSearch}%,instructor_name.ilike.%${searchQuery}%`);
  }

  // Apply city filter to main query
  if (cityFilter) {
    mainQuery = mainQuery.eq('city', cityFilter);
  }

  // Apply category filter to main query
  if (categoryFilter) {
    mainQuery = mainQuery.eq('category', categoryFilter);
  }

  // Apply sorting and pagination
  const { data: classes, error } = await mainQuery
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
          {(searchQuery || cityFilter || categoryFilter) && ' (filtered)'}
        </p>
      </div>

      {/* Search and Filter Bar */}
      <FilterBar 
        currentSearch={searchQuery}
        currentCity={cityFilter}
        currentCategory={categoryFilter}
        availableCities={availableCities}
        availableCategories={availableCategories}
      />

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
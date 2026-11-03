import type { SupabaseClient } from '@supabase/supabase-js';
import ClassGrid from '@/components/classes/ClassGrid';
import Pagination from '@/components/classes/Pagination';

export const ITEMS_PER_PAGE = 20;

// Only the columns ClassCard renders (see ClassCard.tsx props).
const CARD_COLUMNS =
  'id, title, start_date, city, state, instructor_name, price, image_url, ce_credits, attendance_type';

export interface ClassFilters {
  search: string;
  state: string;
  category: string;
  attendanceType: string;
}

interface ClassResultsProps {
  supabase: SupabaseClient;
  filters: ClassFilters;
  sortColumn: string;
  ascending: boolean;
  currentPage: number;
  today: string;
}

// Shared WHERE clause for the count query and the results query, so the two can't drift apart.
// Generic over the column string so Supabase can infer the row type from it.
function buildClassQuery<Columns extends string>(
  supabase: SupabaseClient,
  columns: Columns,
  options: { count?: 'exact'; head?: boolean } | undefined,
  filters: ClassFilters,
  today: string
) {
  let query = supabase
    .from('classes')
    .select(columns, options)
    .eq('status', 'approved')
    .is('deleted_at', null)
    .or(`end_date.is.null,end_date.gte.${today}`);

  if (filters.search) {
    // Search with partial matching - trims to word stem for better results
    const searchTerm = filters.search.toLowerCase().trim();
    // Remove common suffixes for stem matching (e.g., "dental" matches "dentistry")
    const stemmedSearch = searchTerm
      .replace(/ing$/, '')
      .replace(/istry$/, '')
      .replace(/ist$/, '')
      .replace(/tion$/, '')
      .replace(/al$/, '');

    // Use the shorter of original or stemmed (minimum 3 chars)
    const effectiveSearch = stemmedSearch.length >= 3 ? stemmedSearch : searchTerm;

    query = query.or(
      `title.ilike.%${effectiveSearch}%,description.ilike.%${effectiveSearch}%,instructor_name.ilike.%${filters.search}%`
    );
  }

  if (filters.state) query = query.eq('state', filters.state);
  if (filters.category) query = query.eq('category', filters.category);
  if (filters.attendanceType) query = query.eq('attendance_type', filters.attendanceType);

  return query;
}

export default async function ClassResults({
  supabase,
  filters,
  sortColumn,
  ascending,
  currentPage,
  today,
}: ClassResultsProps) {
  const fetchPage = (page: number) => {
    const offset = (page - 1) * ITEMS_PER_PAGE;
    return buildClassQuery(supabase, CARD_COLUMNS, undefined, filters, today)
      .order(sortColumn, { ascending })
      .range(offset, offset + ITEMS_PER_PAGE - 1);
  };

  // Count and results run at the same time (one round trip instead of two).
  const [countResult, firstPageResult] = await Promise.all([
    buildClassQuery(supabase, '*', { count: 'exact', head: true }, filters, today),
    fetchPage(currentPage),
  ]);

  if (countResult.error) {
    console.error('Error fetching count:', countResult.error);
  }

  const totalItems = countResult.count || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const validPage = Math.min(currentPage, Math.max(1, totalPages));

  // Hand-edited or stale URL (e.g. ?page=999): fetch the last real page instead.
  const { data: classes, error } =
    validPage !== currentPage ? await fetchPage(validPage) : firstPageResult;

  if (error) {
    console.error('Error fetching classes:', error);
    return (
      <div className="bg-red-50 border border-red-200 rounded-sm p-4">
        <p className="text-red-700">
          Error loading classes. Please try again later.
        </p>
        <p className="text-red-500 text-sm mt-1">
          {error.message}
        </p>
      </div>
    );
  }

  const isFiltered = Boolean(filters.search || filters.state || filters.category || filters.attendanceType);

  return (
    <div>
      <p className="text-gray-600 mb-4">
        {totalItems} {totalItems === 1 ? 'class' : 'classes'} available
        {isFiltered && ' (filtered)'}
      </p>

      <ClassGrid classes={classes || []} />

      <Pagination
        currentPage={validPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={ITEMS_PER_PAGE}
      />
    </div>
  );
}

import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

// Cached dropdown options (states, categories) for /classes.
//
// These lists only change when a listing is approved, edited, or deleted, so we don't
// re-query them on every filter click. Any route that writes to `classes` must call
// revalidateTag(CLASS_FILTER_OPTIONS_TAG) so new options show up right away.
// `revalidate` is a backstop for edits made outside the app (e.g. the Supabase SQL editor).
export const CLASS_FILTER_OPTIONS_TAG = 'class-filter-options';

export interface ClassFilterOptions {
  states: string[];
  categories: string[];
}

async function fetchClassFilterOptions(today: string): Promise<ClassFilterOptions> {
  // unstable_cache can't read cookies, so this uses a cookie-free anon client.
  // Safe: approved, non-deleted classes are public (RLS "Public can view approved classes").
  // Created inside the function, never at module level (breaks Vercel builds).
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  const { data, error } = await supabase
    .from('classes')
    .select('state, category')
    .eq('status', 'approved')
    .is('deleted_at', null)
    .or(`end_date.is.null,end_date.gte.${today}`);

  // Throwing (instead of returning empty lists) means a failed query is never cached.
  if (error) throw new Error(`Failed to load class filter options: ${error.message}`);

  const unique = (values: (string | null)[]) =>
    [...new Set(values.filter((v): v is string => Boolean(v)))].sort();

  return {
    states: unique(data.map((row) => row.state)),
    categories: unique(data.map((row) => row.category)),
  };
}

// `today` is part of the cache key automatically, so the lists roll over at midnight UTC
// (classes that ended yesterday drop out).
export const getClassFilterOptions = unstable_cache(
  fetchClassFilterOptions,
  ['class-filter-options'],
  { revalidate: 300, tags: [CLASS_FILTER_OPTIONS_TAG] }
);

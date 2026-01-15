import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import ClassGrid from '@/components/classes/ClassGrid';

// Force dynamic rendering (no caching) so we always get fresh data
export const dynamic = 'force-dynamic';

// Define the class type to match your database schema
interface DentalClass {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string | null;
  start_time: string;
  end_time: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip_code: string;
  instructor_name: string;
  provider_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  price: number;
  ce_credits: number | null;
  category: string | null;
  registration_url: string;
  image_url: string;
  status: 'pending' | 'approved' | 'rejected';
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export default async function ClassesPage() {
  // In Next.js 14+, cookies() returns a Promise and must be awaited
  const cookieStore = await cookies();

  // Create Supabase client for Server Component
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

  // Fetch all approved classes, sorted by date ascending
  const { data: classes, error } = await supabase
    .from('classes')
    .select('*')
    .eq('status', 'approved')
    .is('deleted_at', null)
    .order('start_date', { ascending: true })
    .returns<DentalClass[]>();

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Browse Dental CE Classes
        </h1>
        <p className="text-gray-600">
          {classCount} {classCount === 1 ? 'class' : 'classes'} available
        </p>
      </div>

      {/* Class Grid */}
      <ClassGrid classes={classes || []} />
    </div>
  );
}
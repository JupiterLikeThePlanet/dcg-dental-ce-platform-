import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SubmissionsTable from '@/components/admin/SubmissionsTable';

export const dynamic = 'force-dynamic';

type SubmissionStatus = 'all' | 'pending' | 'approved' | 'rejected';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = (params.status as SubmissionStatus) || 'pending';
  const message = params.message as string | undefined;

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

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login?redirect=/admin');
  }

  // Check if user is admin
  const { data: userData } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!userData?.is_admin) {
    redirect('/dashboard?error=unauthorized');
  }

  // Build query based on status filter
  let query = supabase
    .from('submissions')
    .select(`
      id,
      title,
      provider_name,
      city,
      state,
      start_date,
      status,
      payment_amount,
      coupon_code,
      created_at,
      users:submitted_by (
        email,
        full_name
      )
    `)
    .order('created_at', { ascending: false });

  // Apply status filter
  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data: submissions, error } = await query;

  if (error) {
    console.error('Error fetching submissions:', error);
  }

  // Get counts for each status
  const { count: pendingCount } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const { count: approvedCount } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved');

  const { count: rejectedCount } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'rejected');

  const { count: totalCount } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true });

  const statusTabs = [
    { key: 'pending', label: 'Pending Review', count: pendingCount || 0 },
    { key: 'approved', label: 'Approved', count: approvedCount || 0 },
    { key: 'rejected', label: 'Rejected', count: rejectedCount || 0 },
    { key: 'all', label: 'All', count: totalCount || 0 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage class submissions</p>
      </div>

      {/* Success Messages */}
      {message === 'approved' && (
        <div className="bg-green-50 border border-green-200 rounded-sm p-4 mb-6">
          <p className="text-green-700">✓ Submission approved and published successfully!</p>
        </div>
      )}
      {message === 'rejected' && (
        <div className="bg-red-50 border border-red-200 rounded-sm p-4 mb-6">
          <p className="text-red-700">Submission has been rejected.</p>
        </div>
      )}

      {/* Status Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <Link
                key={tab.key}
                href={`/admin?status=${tab.key}`}
                className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    isActive
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-sm p-4">
          <p className="text-blue-600 text-sm font-medium">Pending Review</p>
          <p className="text-2xl font-bold text-blue-700">{pendingCount || 0}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-sm p-4">
          <p className="text-green-600 text-sm font-medium">Approved</p>
          <p className="text-2xl font-bold text-green-700">{approvedCount || 0}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-sm p-4">
          <p className="text-red-600 text-sm font-medium">Rejected</p>
          <p className="text-2xl font-bold text-red-700">{rejectedCount || 0}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
          <p className="text-gray-600 text-sm font-medium">Total Submissions</p>
          <p className="text-2xl font-bold text-gray-700">{totalCount || 0}</p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-sm p-4 mb-6">
          <p className="text-red-700">Error loading submissions: {error.message}</p>
        </div>
      )}

      {/* Submissions Table */}
      <SubmissionsTable
        submissions={(submissions as any[]) || []}
        emptyMessage={
          statusFilter === 'pending'
            ? 'No submissions pending review'
            : statusFilter === 'approved'
            ? 'No approved submissions yet'
            : statusFilter === 'rejected'
            ? 'No rejected submissions'
            : 'No submissions found'
        }
      />
    </div>
  );
}
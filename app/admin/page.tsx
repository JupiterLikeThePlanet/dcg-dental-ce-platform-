import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SubmissionsTable from '@/components/admin/SubmissionsTable';
import AdminToast from '@/components/admin/AdminToast';

export const dynamic = 'force-dynamic';

type SubmissionStatus = 'all' | 'pending' | 'approved' | 'rejected';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = (params.status as SubmissionStatus) || 'pending';

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
    .select('is_admin, full_name')
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

  // Stat cards configuration with colors and icons
  const statCards = [
    { 
      key: 'pending', 
      label: 'Pending Review', 
      count: pendingCount || 0,
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-600',
      numberColor: 'text-blue-700',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      ),
    },
    { 
      key: 'approved', 
      label: 'Approved', 
      count: approvedCount || 0,
      bgColor: 'bg-green-50 hover:bg-green-100',
      borderColor: 'border-green-200',
      textColor: 'text-green-600',
      numberColor: 'text-green-700',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
    },
    { 
      key: 'rejected', 
      label: 'Rejected', 
      count: rejectedCount || 0,
      bgColor: 'bg-red-50 hover:bg-red-100',
      borderColor: 'border-red-200',
      textColor: 'text-red-600',
      numberColor: 'text-red-700',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      ),
    },
    { 
      key: 'all', 
      label: 'Total Submissions', 
      count: totalCount || 0,
      bgColor: 'bg-gray-50 hover:bg-gray-100',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-600',
      numberColor: 'text-gray-700',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
        </svg>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Toast Notifications */}
      <AdminToast />

      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                Admin
              </span>
            </div>
            <p className="text-gray-600">
              Welcome back, {userData.full_name || user.email}. Manage class submissions below.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
            </svg>
            My Dashboard
          </Link>
        </div>
      </div>

      {/* Quick Stats - Clickable Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => (
          <Link
            key={card.key}
            href={`/admin?status=${card.key}`}
            className={`${card.bgColor} border ${card.borderColor} rounded-sm p-4 transition-all duration-200 cursor-pointer ${
              statusFilter === card.key ? 'ring-2 ring-offset-2 ring-blue-500' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className={`${card.textColor} text-sm font-medium`}>{card.label}</p>
              <span className={card.textColor}>{card.icon}</span>
            </div>
            <p className={`text-2xl font-bold ${card.numberColor}`}>{card.count}</p>
          </Link>
        ))}
      </div>

      {/* Status Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <Link
                key={tab.key}
                href={`/admin?status=${tab.key}`}
                className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-all duration-200 ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-xs transition-colors ${
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
            ? 'No submissions pending review. 🎉'
            : statusFilter === 'approved'
            ? 'No approved submissions yet.'
            : statusFilter === 'rejected'
            ? 'No rejected submissions.'
            : 'No submissions found.'
        }
      />

      {/* Help Text */}
      <p className="text-center text-gray-500 text-sm mt-6">
        Click on any row to view full submission details and approve or reject.
      </p>
    </div>
  );
}
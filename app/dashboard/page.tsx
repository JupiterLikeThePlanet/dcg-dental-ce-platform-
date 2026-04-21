import { createServerClient } from '@supabase/ssr'
import Link from 'next/link';
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import UserSubmissionsTable from '@/components/dashboard/UserSubmissionsTable';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user data including is_admin
  const { data: userData } = await supabase
    .from('users')
    .select('is_admin, full_name')
    .eq('id', user.id)
    .single();

  const isAdmin = userData?.is_admin || false;

  // One year ago date — approved submissions with end_date before this are hidden and due for deletion
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0];

  // Fetch user's submissions, excluding approved ones past the 1-year retention window
  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, title, provider_name, city, state, start_date, end_date, status, created_at, rejection_reason')
    .eq('submitted_by', user.id)
    .or(`status.neq.approved,end_date.is.null,end_date.gte.${oneYearAgoStr}`)
    .order('created_at', { ascending: false });

  // Calculate stats
  const stats = {
    total: submissions?.length || 0,
    pending: submissions?.filter(s => s.status === 'pending' || s.status === 'pending_payment').length || 0,
    approved: submissions?.filter(s => s.status === 'approved').length || 0,
    rejected: submissions?.filter(s => s.status === 'rejected').length || 0,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-8 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
            <p className="text-gray-500 mt-1">
              {userData?.full_name ? `Welcome back, ${userData.full_name}` : 'Manage your submissions'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Desktop: Admin View box */}
            {isAdmin && (
              <Link href="/admin" className="hidden sm:block bg-orange-50 px-4 py-2 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors">
                <span className="text-xs font-bold text-orange-600 uppercase tracking-wider block">Admin View</span>
                <span className="text-sm font-semibold text-gray-800">My Dashboard</span>
              </Link>
            )}
            <div className="hidden sm:block bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">Logged in as</span>
              <span className="text-sm font-semibold text-gray-800">{user.email}</span>
            </div>
            {/* Mobile: simple tab toggle — only shown for admins */}
            {isAdmin && (
              <div className="sm:hidden flex rounded-lg border border-gray-200 overflow-hidden text-sm font-medium">
                <Link href="/admin" className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 transition-colors">
                  Admin View
                </Link>
                <span className="px-3 py-1.5 text-blue-600 bg-blue-50 border-l border-gray-200">
                  My Dashboard
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <p className="text-gray-500 text-sm">Total Submissions</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <p className="text-blue-600 text-sm">Pending Review</p>
            <p className="text-2xl font-bold text-blue-700">{stats.pending}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <p className="text-green-600 text-sm">Approved</p>
            <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 border border-red-200">
            <p className="text-red-600 text-sm">Rejected</p>
            <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
          </div>
        </div>

        {/* Actions Row */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Link
            href="/submit"
            className="flex-1 p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-3 font-semibold"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Submit New Class
          </Link>
          <Link
            href="/classes"
            className="flex-1 p-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-3 font-semibold border border-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
            Browse All Classes
          </Link>
          <Link
            href="/change-password"
            className="flex-1 p-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-3 font-semibold border border-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Change Password
          </Link>
        </div>

        {/* Submissions Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Your Submissions</h2>
            {stats.total > 0 && (
              <span className="text-sm text-gray-500">{stats.total} total</span>
            )}
          </div>
          
          <UserSubmissionsTable submissions={submissions || []} />

          {stats.total > 0 && (
            <p className="text-center text-gray-500 text-sm mt-4">
              Click on any row to view details, use as template, or edit rejected submissions.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
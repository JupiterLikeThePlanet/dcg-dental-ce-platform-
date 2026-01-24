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

  // Fetch user's submissions
  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, title, provider_name, city, state, start_date, status, created_at, rejection_reason')
    .eq('submitted_by', user.id)
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
            {/* Admin Dashboard Link - Only for admins */}
            {isAdmin && (
              <Link
                href="/admin"
                className="px-4 py-2 bg-orange-100 text-orange-700 text-sm font-semibold rounded-lg border border-orange-200 hover:bg-orange-200 transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
                Admin Dashboard
              </Link>
            )}
            <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">Logged in as</span>
              <span className="text-sm font-semibold text-gray-800">{user.email}</span>
            </div>
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
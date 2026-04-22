import { createServerClient } from '@supabase/ssr'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import DashboardContent from '@/components/dashboard/DashboardContent';

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

        <DashboardContent submissions={submissions || []} stats={stats} />
      </div>
    </div>
  )
}
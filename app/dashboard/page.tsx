
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `remove` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-8 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage your account and submissions</p>
          </div>
          <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">Logged in as</span>
            <span className="text-sm font-semibold text-gray-800">{user.email}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-center py-12">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-800">New Submission</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-[200px]">Create a new CE course listing for the platform.</p>
            <button className="mt-6 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors">
              Submit Class
            </button>
          </div>

          <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-4">Your Recent Activity</h3>
            <div className="space-y-3">
              <div className="p-3 bg-white border border-gray-100 rounded-lg flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Account successfully verified</span>
                <span className="text-xs text-gray-400 ml-auto">Just now</span>
              </div>
              <p className="text-xs text-center text-gray-400 italic pt-2">No active submissions found.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import SubmitClassForm from '@/components/submit/SubmitClassForm';

export const dynamic = 'force-dynamic';

export default async function SubmitClassPage() {
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

  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login?redirect=/submit');
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Submit a CE Class
        </h1>
        <p className="text-gray-600">
          List your dental continuing education course for just $5. 
          Your submission will be reviewed and published within 24-48 hours.
        </p>
      </div>

      {/* Submission Form */}
      <SubmitClassForm userId={user.id} userEmail={user.email || ''} />
    </div>
  );
}
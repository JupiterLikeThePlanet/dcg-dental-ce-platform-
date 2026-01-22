import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import SubmitClassForm from '@/components/submit/SubmitClassForm';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SubmitClassPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
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

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/submit');
  }

  // Handle canceled payment - delete pending_payment submission
  const canceled = params.canceled === 'true';
  if (canceled) {
    await supabase
      .from('submissions')
      .delete()
      .eq('submitted_by', user.id)
      .eq('status', 'pending_payment');
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Canceled Payment Notice */}
      {canceled && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-sm p-4">
          <p className="text-yellow-800">
            Payment was canceled. Your submission has been removed. Please try again when ready.
          </p>
        </div>
      )}

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
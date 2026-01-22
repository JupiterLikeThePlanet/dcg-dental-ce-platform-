import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import SubmissionDetail from '@/components/admin/SubmissionDetail';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SubmissionDetailPage({ params }: PageProps) {
  const { id } = await params;

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

  // Fetch the submission with user details
  const { data: submission, error } = await supabase
    .from('submissions')
    .select(`
      *,
      users:submitted_by (
        id,
        email,
        full_name
      ),
      reviewer:reviewed_by (
        email,
        full_name
      )
    `)
    .eq('id', id)
    .single();

  if (error || !submission) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back Link */}
      <Link
        href="/admin"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        ← Back to Admin Dashboard
      </Link>

      {/* Submission Detail Component */}
      <SubmissionDetail submission={submission as any} />
    </div>
  );
}
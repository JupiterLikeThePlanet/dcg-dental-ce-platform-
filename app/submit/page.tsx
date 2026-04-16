import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import Stripe from 'stripe';
import SubmitClassGate from '@/components/submit/SubmitClassGate';
import CanceledNotice from '@/components/submit/CanceledNotice';

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

  const canceled = params.canceled === 'true';

  // Verify a Stripe payment session when redirected back from checkout
  let verifiedStripeSessionId: string | null = null;
  const paidParam = typeof params.paid === 'string' ? params.paid : null;
  if (paidParam) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const session = await stripe.checkout.sessions.retrieve(paidParam);
      if (session.payment_status === 'paid' && session.metadata?.userId === user.id) {
        verifiedStripeSessionId = paidParam;
      }
    } catch {
      // Invalid or unrecognised session — fall through to show payment gate
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Canceled Payment Notice */}
      {canceled && <CanceledNotice />}

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Submit a CE Class
        </h1>
        <p className="text-gray-600">
          List your dental continuing education course for just $5.
          Your submission will be reviewed and published within 24–48 hours.
        </p>
      </div>

      {/* Payment gate → form */}
      <SubmitClassGate
        userId={user.id}
        userEmail={user.email || ''}
        verifiedStripeSessionId={verifiedStripeSessionId}
      />
    </div>
  );
}

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import { getStripeServer } from '@/lib/stripe-server';
import SubmitClassGate from '@/components/submit/SubmitClassGate';
import CanceledNotice from '@/components/submit/CanceledNotice';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { isPaywallEnabled } from '@/lib/paywall';

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

  const paywallEnabled = isPaywallEnabled();
  const canceled = paywallEnabled && params.canceled === 'true';

  // Verify a Stripe payment session when redirected back from checkout
  let verifiedStripeSessionId: string | null = null;
  const paidParam = typeof params.paid === 'string' ? params.paid : null;
  if (paywallEnabled && paidParam) {
    try {
      const stripe = getStripeServer();
      const session = await stripe.checkout.sessions.retrieve(paidParam);
      if (session.payment_status === 'paid' && session.metadata?.userId === user.id) {
        // A payment that already produced a submission can't be reused
        const { data: alreadyUsed } = await getSupabaseAdmin()
          .from('submissions')
          .select('id')
          .eq('stripe_payment_id', session.payment_intent as string)
          .limit(1);

        if (!alreadyUsed || alreadyUsed.length === 0) {
          verifiedStripeSessionId = paidParam;
        }
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
          {paywallEnabled
            ? 'List your dental continuing education course for just $5.'
            : 'List your dental continuing education course.'}{' '}
          Your submission will be reviewed and published within 24–48 hours.
        </p>
      </div>

      {/* Payment gate → form (gate skipped when the paywall is off) */}
      <SubmitClassGate
        userId={user.id}
        userEmail={user.email || ''}
        verifiedStripeSessionId={verifiedStripeSessionId}
        paywallEnabled={paywallEnabled}
      />
    </div>
  );
}

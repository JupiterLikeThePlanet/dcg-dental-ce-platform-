import Link from 'next/link';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

interface SuccessPageProps {
  searchParams: Promise<{ method?: string; session_id?: string }>;
}

export default async function SubmitSuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const method = params.method;
  const sessionId = params.session_id;

  // When Stripe redirects here with a session_id, verify payment and update status.
  // This is the primary update path in dev (where the webhook CLI isn't running)
  // and a reliable fallback in prod. The webhook does the same update but is idempotent.
  if (sessionId) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status === 'paid' && session.metadata?.submissionId) {
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        // Only update if still pending_payment — webhook may have already fired
        await supabaseAdmin
          .from('submissions')
          .update({
            status: 'pending',
            stripe_payment_id: session.payment_intent as string,
          })
          .eq('id', session.metadata.submissionId)
          .eq('status', 'pending_payment');
      }
    } catch (err) {
      // Non-fatal: webhook will handle it if this fails
      console.error('Session verification error:', err);
    }
  }

  const getMessage = () => {
    switch (method) {
      case 'admin':
        return {
          title: 'Submission Received!',
          description: 'As an admin, your class has been submitted directly for review.',
          icon: '✓',
          color: 'green',
        };
      case 'coupon':
        return {
          title: 'Submission Received!',
          description: 'Your coupon was applied successfully. Your class has been submitted for review.',
          icon: '🎟️',
          color: 'green',
        };
      case 'edit':
        return {
          title: 'Changes Saved!',
          description: 'Your submission has been updated and resubmitted for review.',
          icon: '✏️',
          color: 'blue',
        };
      default:
        // Paid via Stripe
        return {
          title: 'Payment Successful!',
          description: 'Your payment was received and your class has been submitted for review.',
          icon: '💳',
          color: 'green',
        };
    }
  };

  const message = getMessage();

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        {/* Icon */}
        <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center text-3xl ${
          message.color === 'blue' ? 'bg-blue-100' : 'bg-green-100'
        }`}>
          {message.icon}
        </div>

        {/* Title */}
        <h1 className={`text-2xl font-bold mb-2 ${
          message.color === 'blue' ? 'text-blue-900' : 'text-green-900'
        }`}>
          {message.title}
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-6">
          {message.description}
        </p>

        {/* What happens next */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <h2 className="font-semibold text-gray-900 mb-2">What happens next?</h2>
          <ol className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="bg-gray-200 text-gray-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0">1</span>
              <span>Our team will review your submission within 1-2 business days</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-gray-200 text-gray-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0">2</span>
              <span>You&apos;ll receive an email when your class is approved</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-gray-200 text-gray-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0">3</span>
              <span>Once approved, your class will appear in the public listings</span>
            </li>
          </ol>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/submit"
            className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Submit Another Class
          </Link>
        </div>
      </div>
    </div>
  );
}

import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getStripeServer } from '@/lib/stripe-server';

export async function POST(request: NextRequest) {
  const stripe = getStripeServer();
  const supabaseAdmin = getSupabaseAdmin();
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log('Webhook received:', event.type);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    const submissionId = session.metadata?.submissionId;

    if (!submissionId) {
      // Payment gate sessions have no submissionId — submission is created after
      // the user fills the form, so there's nothing to update here.
      console.log('No submissionId in metadata — payment gate session, skipping update');
      return NextResponse.json({ received: true });
    }

    console.log('Updating submission:', submissionId);

    const { error: updateError } = await supabaseAdmin
      .from('submissions')
      .update({
        status: 'pending',
        stripe_payment_id: session.payment_intent as string,
      })
      .eq('id', submissionId);

    if (updateError) {
      console.error('Failed to update submission:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log('Submission updated successfully:', submissionId);
  }

  return NextResponse.json({ received: true });
}
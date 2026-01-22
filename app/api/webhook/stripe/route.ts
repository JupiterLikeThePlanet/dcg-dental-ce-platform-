import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event: Stripe.Event;

  // For local development, skip signature verification if no secret
  if (process.env.STRIPE_WEBHOOK_SECRET && signature) {
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
  } else {
    // Local dev: parse event directly
    event = JSON.parse(body);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    const submissionId = session.metadata?.submissionId;
    const userId = session.metadata?.userId;

    if (!submissionId) {
      console.error('Missing submissionId in metadata');
      return NextResponse.json({ error: 'Missing submissionId' }, { status: 400 });
    }

    // Update submission status to 'pending' (payment complete)
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

    console.log('Submission updated after payment:', submissionId);
  }

  return NextResponse.json({ received: true });
}
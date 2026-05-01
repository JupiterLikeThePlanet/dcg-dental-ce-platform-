import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getStripeServer } from '@/lib/stripe-server';

export async function POST(request: NextRequest) {
  try {
    const { submissionData, stripeSessionId, grantedCoupon, couponCode, originalSubmissionId, editClassOnly } = await request.json();
    const stripe = getStripeServer();
    const supabaseAdmin = getSupabaseAdmin();

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

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    const isAdmin = userData?.is_admin || false;

    // ==========================================
    // EDIT MODE: Update existing submission
    // ==========================================
    if (originalSubmissionId) {
      // Verify the original submission belongs to this user
      const { data: originalSubmission, error: fetchError } = await supabase
        .from('submissions')
        .select('id, status, submitted_by')
        .eq('id', originalSubmissionId)
        .eq('submitted_by', user.id)
        .single();

      if (fetchError || !originalSubmission) {
        return NextResponse.json(
          { error: 'Original submission not found or access denied' },
          { status: 404 }
        );
      }

      // Determine what happens based on original status
      const originalStatus = originalSubmission.status;

      // For rejected or pending submissions: update and set to pending
      if (originalStatus === 'rejected' || originalStatus === 'pending') {
        const { error: updateError } = await supabaseAdmin
          .from('submissions')
          .update({
            ...submissionData,
            status: 'pending',
            rejection_reason: null,
            reviewed_at: null,
            reviewed_by: null,
          })
          .eq('id', originalSubmissionId);

        if (updateError) {
          console.error('Update error:', updateError);
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ 
          success: true, 
          isEdit: true, 
          message: 'Submission updated and resubmitted for review' 
        });
      }

      // For approved submissions: update both submission AND the classes table
      if (originalStatus === 'approved') {
        const { error: updateSubmissionError } = await supabaseAdmin
          .from('submissions')
          .update({ ...submissionData })
          .eq('id', originalSubmissionId);

        if (updateSubmissionError) {
          console.error('Update submission error:', updateSubmissionError);
          return NextResponse.json({ error: updateSubmissionError.message }, { status: 500 });
        }

        const { error: updateClassError } = await supabaseAdmin
          .from('classes')
          .update({ ...submissionData })
          .eq('submission_id', originalSubmissionId);

        // Note: If there's no matching class (edge case), we don't fail
        if (updateClassError) {
          console.error('Update class error (non-fatal):', updateClassError);
        }

        return NextResponse.json({ 
          success: true, 
          isEdit: true, 
          message: 'Listing updated successfully' 
        });
      }

      // For pending_payment: update data, then either save-only or handle payment
      if (originalStatus === 'pending_payment') {
        const { error: updateError } = await supabaseAdmin
          .from('submissions')
          .update({ ...submissionData })
          .eq('id', originalSubmissionId);

        if (updateError) {
          console.error('Update error:', updateError);
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // Class-only edit: data saved, no payment step right now
        if (editClassOnly) {
          return NextResponse.json({ success: true, isEdit: true, message: 'Class details updated' });
        }

        // Payment edit: check coupon first
        if (couponCode) {
          const { data: coupon } = await supabase
            .from('coupon_codes')
            .select('*')
            .eq('code', couponCode)
            .eq('is_active', true)
            .single();

          if (!coupon || (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses)) {
            return NextResponse.json({ error: 'Invalid or expired coupon code' }, { status: 400 });
          }

          await supabaseAdmin
            .from('coupon_codes')
            .update({ current_uses: coupon.current_uses + 1 })
            .eq('id', coupon.id);

          await supabaseAdmin
            .from('submissions')
            .update({ status: 'pending', coupon_code: couponCode, payment_amount: 0 })
            .eq('id', originalSubmissionId);

          return NextResponse.json({ success: true, isEdit: true, usedCoupon: true });
        }

        // No coupon: create a new Stripe session pointing to the existing submission
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          customer_email: user.email ?? undefined,
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: 'CE Class Listing',
                  description: `Listing: ${submissionData.title.substring(0, 50)}`,
                },
                unit_amount: 500,
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${request.nextUrl.origin}/submit/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${request.nextUrl.origin}/submit?canceled=true`,
          metadata: {
            submissionId: originalSubmissionId,
            userId: user.id,
          },
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });
      }
    }

    // ==========================================
    // NEW SUBMISSION MODE
    // Payment is collected upfront via the payment gate.
    // ==========================================

    // Admin bypass — no payment required
    if (isAdmin) {
      const { error: insertError } = await supabase
        .from('submissions')
        .insert([{
          ...submissionData,
          submitted_by: user.id,
          status: 'pending',
          payment_amount: 0,
        }]);

      if (insertError) {
        console.error('Insert error:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, isAdmin: true });
    }

    // Coupon path — validate & increment, then create submission
    if (grantedCoupon) {
      const { data: coupon } = await supabase
        .from('coupon_codes')
        .select('*')
        .eq('code', grantedCoupon)
        .eq('is_active', true)
        .single();

      if (!coupon || (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses)) {
        return NextResponse.json({ error: 'Coupon is no longer valid' }, { status: 400 });
      }

      await supabaseAdmin
        .from('coupon_codes')
        .update({ current_uses: coupon.current_uses + 1 })
        .eq('id', coupon.id);

      const { error: insertError } = await supabase
        .from('submissions')
        .insert([{
          ...submissionData,
          submitted_by: user.id,
          status: 'pending',
          payment_amount: 0,
          coupon_code: grantedCoupon,
        }]);

      if (insertError) {
        console.error('Insert error:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, usedCoupon: true });
    }

    // Stripe path — verify the session belongs to this user and was paid
    if (stripeSessionId) {
      let stripePaymentIntentId: string | null = null;
      try {
        const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
        if (session.payment_status !== 'paid' || session.metadata?.userId !== user.id) {
          return NextResponse.json({ error: 'Payment not verified' }, { status: 400 });
        }
        stripePaymentIntentId = session.payment_intent as string;
      } catch {
        return NextResponse.json({ error: 'Invalid payment session' }, { status: 400 });
      }

      const { error: insertError } = await supabase
        .from('submissions')
        .insert([{
          ...submissionData,
          submitted_by: user.id,
          status: 'pending',
          payment_amount: 5.00,
          stripe_payment_id: stripePaymentIntentId,
        }]);

      if (insertError) {
        console.error('Insert error:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Payment required' }, { status: 402 });

  } catch (error: unknown) {
    console.error('Checkout error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create checkout session: ${errorMessage}` },
      { status: 500 }
    );
  }
}
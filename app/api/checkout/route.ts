import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { submissionData, couponCode, originalSubmissionId } = await request.json();

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
        const { error: updateError } = await supabase
          .from('submissions')
          .update({
            ...submissionData,
            status: 'pending',
            rejection_reason: null,  // Clear rejection reason
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
        // Update the submission record
        const { error: updateSubmissionError } = await supabase
          .from('submissions')
          .update({
            ...submissionData,
          })
          .eq('id', originalSubmissionId);

        if (updateSubmissionError) {
          console.error('Update submission error:', updateSubmissionError);
          return NextResponse.json({ error: updateSubmissionError.message }, { status: 500 });
        }

        // Also update the corresponding class listing
        // The class entry should have the same data
        const { error: updateClassError } = await supabase
          .from('classes')
          .update({
            ...submissionData,
          })
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

      // For pending_payment status: don't allow edit (they need to pay first)
      if (originalStatus === 'pending_payment') {
        return NextResponse.json(
          { error: 'Cannot edit submission while payment is pending' },
          { status: 400 }
        );
      }
    }

    // ==========================================
    // NEW SUBMISSION MODE
    // ==========================================

    // Check if coupon code is valid
    let validCoupon = false;
    if (couponCode) {
      const { data: coupon } = await supabase
        .from('coupon_codes')
        .select('*')
        .eq('code', couponCode)
        .eq('is_active', true)
        .single();

      if (coupon) {
        // Check if coupon has uses remaining
        if (coupon.max_uses === null || coupon.current_uses < coupon.max_uses) {
          validCoupon = true;
          
          // Increment current_uses
          await supabase
            .from('coupon_codes')
            .update({ current_uses: coupon.current_uses + 1 })
            .eq('id', coupon.id);
        }
      }
    }

    // If admin or valid coupon, save directly (no payment)
    if (isAdmin || validCoupon) {
      const { error: insertError } = await supabase
        .from('submissions')
        .insert([{
          ...submissionData,
          submitted_by: user.id,
          status: 'pending',
          payment_amount: 0,
          coupon_code: validCoupon ? couponCode : null,
        }]);

      if (insertError) {
        console.error('Insert error:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, isAdmin, usedCoupon: validCoupon });
    }

    // Invalid coupon provided
    if (couponCode && !validCoupon) {
      return NextResponse.json({ error: 'Invalid or expired coupon code' }, { status: 400 });
    }

    // Save submission with pending_payment status
    const { data: submission, error: insertError } = await supabase
      .from('submissions')
      .insert([{
        ...submissionData,
        submitted_by: user.id,
        status: 'pending_payment',
        payment_amount: 5.00,
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Create Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
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
        submissionId: submission.id,
        userId: user.id,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });

  } catch (error: unknown) {
    console.error('Checkout error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create checkout session: ${errorMessage}` },
      { status: 500 }
    );
  }
}
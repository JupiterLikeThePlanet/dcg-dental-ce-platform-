import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { couponCode, initiateStripe, preserveTemplateMode } = await request.json();

  // ── Coupon validation path ──────────────────────────────────────────────────
  // Read-only check — coupon is incremented later at form submission
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

    return NextResponse.json({ valid: true });
  }

  // ── Stripe initiation path ──────────────────────────────────────────────────
  if (initiateStripe) {
    const successBase = `${request.nextUrl.origin}/submit?paid={CHECKOUT_SESSION_ID}`;
    const successUrl = preserveTemplateMode
      ? `${successBase}&template=true`
      : successBase;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: user.email ?? undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'CE Class Listing Fee',
              description: 'One-time fee to submit a dental CE class listing',
            },
            unit_amount: 500,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: `${request.nextUrl.origin}/submit?canceled=true`,
      metadata: { userId: user.id },
    });

    return NextResponse.json({ url: session.url });
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}

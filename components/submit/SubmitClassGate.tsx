'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PaymentGate from './PaymentGate';
import SubmitClassForm from './SubmitClassForm';

interface SubmitClassGateProps {
  userId: string;
  userEmail: string;
  /** Server-verified Stripe session ID (from ?paid= param). Non-null means payment is confirmed. */
  verifiedStripeSessionId: string | null;
}

export default function SubmitClassGate({ userId, userEmail, verifiedStripeSessionId }: SubmitClassGateProps) {
  const [grantedCoupon, setGrantedCoupon] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const isEdit = searchParams.get('edit') === 'true';
  const isTemplate = searchParams.get('template') === 'true';

  // Edit mode bypasses the payment gate — payment was already handled for that submission.
  // Templates are treated as new submissions and must go through the gate.
  // Stripe-verified or coupon-granted go straight to the form.
  if (isEdit || verifiedStripeSessionId || grantedCoupon) {
    return (
      <SubmitClassForm
        userId={userId}
        userEmail={userEmail}
        stripeSessionId={verifiedStripeSessionId}
        grantedCoupon={grantedCoupon}
      />
    );
  }

  return (
    <PaymentGate
      userEmail={userEmail}
      preserveTemplateMode={isTemplate}
      onCouponGranted={setGrantedCoupon}
    />
  );
}

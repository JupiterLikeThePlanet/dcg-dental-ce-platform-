'use client';

import { useState } from 'react';
import Spinner from '@/components/ui/Spinner';

interface PaymentGateProps {
  userEmail: string;
  preserveTemplateMode?: boolean;
  onCouponGranted: (coupon: string) => void;
}

export default function PaymentGate({ userEmail, preserveTemplateMode, onCouponGranted }: PaymentGateProps) {
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [isRedirectingToStripe, setIsRedirectingToStripe] = useState(false);

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setIsValidatingCoupon(true);
    setCouponError(null);

    try {
      const response = await fetch('/api/payment-gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponCode: couponCode.trim().toUpperCase() }),
      });
      const data = await response.json();

      if (!response.ok) {
        setCouponError(data.error || 'Invalid coupon code');
      } else {
        onCouponGranted(couponCode.trim().toUpperCase());
      }
    } catch {
      setCouponError('Something went wrong. Please try again.');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handlePayWithStripe = async () => {
    setIsRedirectingToStripe(true);

    try {
      const response = await fetch('/api/payment-gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initiateStripe: true, preserveTemplateMode }),
      });
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch {
      setIsRedirectingToStripe(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-sm p-8">
      {/* Spam prevention message */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">One step before your submission</h2>
        </div>
        <p className="text-gray-600">
          To prevent spam and keep our listings high quality, we require a{' '}
          <strong className="text-gray-900">$5 listing fee</strong> before submitting a CE class.
          Your class will be reviewed and published within 24–48 hours after submission.
        </p>
      </div>

      {/* Stripe payment button */}
      <div className="mb-6">
        <button
          type="button"
          onClick={handlePayWithStripe}
          disabled={isRedirectingToStripe || isValidatingCoupon}
          className={`w-full py-3 px-6 rounded-sm font-medium text-white flex items-center justify-center gap-2 transition-colors ${
            isRedirectingToStripe || isValidatingCoupon
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isRedirectingToStripe ? (
            <>
              <Spinner size="sm" />
              Redirecting to payment...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
              Pay $5 to Submit
            </>
          )}
        </button>
        <p className="text-center text-xs text-gray-400 mt-2">
          Secure payment via Stripe — you&apos;ll fill out the class details after payment
        </p>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 border-t border-gray-200" />
        <span className="text-sm text-gray-400">or use a coupon</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      {/* Coupon input */}
      <form onSubmit={handleCouponSubmit}>
        <p className="text-sm font-medium text-gray-700 mb-2">Have a coupon code?</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => {
              setCouponCode(e.target.value);
              setCouponError(null);
            }}
            placeholder="Enter coupon code"
            className={`flex-1 px-4 py-2 border rounded-sm focus:outline-none focus:border-blue-500 uppercase ${
              couponError ? 'border-red-400' : 'border-gray-300'
            }`}
          />
          <button
            type="submit"
            disabled={isValidatingCoupon || isRedirectingToStripe || !couponCode.trim()}
            className={`px-4 py-2 rounded-sm font-medium text-white transition-colors ${
              isValidatingCoupon || isRedirectingToStripe || !couponCode.trim()
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gray-700 hover:bg-gray-800'
            }`}
          >
            {isValidatingCoupon ? <Spinner size="sm" /> : 'Apply'}
          </button>
        </div>
        {couponError && <p className="text-red-500 text-sm mt-1">{couponError}</p>}
        <p className="text-gray-400 text-xs mt-1">Valid coupon codes waive the $5 fee</p>
      </form>

      {/* Contact */}
      <p className="text-center text-gray-400 text-xs mt-8">
        Questions? Contact{' '}
        <a href="mailto:support@dcgdental.com" className="underline hover:text-gray-600">
          support@dcgdental.com
        </a>
      </p>
    </div>
  );
}

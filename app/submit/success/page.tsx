import Link from 'next/link';

export default function SubmitSuccessPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      {/* Success Icon */}
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-green-600 text-3xl">✓</span>
      </div>

      {/* Success Message */}
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Submission Received!
      </h1>
      
      <p className="text-gray-600 mb-8">
        Thank you for submitting your CE class. Our team will review your listing 
        within 24-48 hours. Once approved, you&apos;ll receive an email with payment 
        instructions to complete your $5 listing fee.
      </p>

      {/* What's Next */}
      <div className="bg-gray-50 border border-gray-200 rounded-sm p-6 mb-8 text-left">
        <h2 className="font-semibold text-gray-900 mb-3">What happens next?</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-600">
          <li>Our team reviews your submission (24-48 hours)</li>
          <li>You&apos;ll receive an email notification</li>
          <li>If approved, complete the $5 listing fee</li>
          <li>Your class goes live on the platform!</li>
        </ol>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/classes"
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-sm hover:bg-blue-700"
        >
          Browse Classes
        </Link>
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-sm hover:bg-gray-50"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
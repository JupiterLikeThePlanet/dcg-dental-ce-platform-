import Link from 'next/link';

export default function SubmissionNotFound() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 text-center">
      <div className="text-gray-400 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Submission Not Found
      </h1>
      <p className="text-gray-600 mb-8">
        The submission you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
      </p>
      <Link
        href="/dashboard"
        className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        ← Back to Dashboard
      </Link>
    </div>
  );
}
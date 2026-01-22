import Link from 'next/link';

export default function SubmissionNotFound() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Submission Not Found
      </h1>
      <p className="text-gray-600 mb-8">
        The submission you&apos;re looking for doesn&apos;t exist or has been removed.
      </p>
      <Link
        href="/admin"
        className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-sm hover:bg-blue-700"
      >
        ← Back to Admin Dashboard
      </Link>
    </div>
  );
}
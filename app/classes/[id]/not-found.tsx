import Link from 'next/link';

export default function ClassNotFound() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Class Not Found
      </h1>
      <p className="text-gray-600 mb-8">
        Sorry, we couldn't find the class you're looking for. 
        It may have been removed or the link might be incorrect.
      </p>
      <Link
        href="/classes"
        className="inline-block bg-blue-600 text-white font-semibold py-3 px-8 rounded-sm hover:bg-blue-700 transition-colors"
      >
        Browse All Classes
      </Link>
    </div>
  );
}
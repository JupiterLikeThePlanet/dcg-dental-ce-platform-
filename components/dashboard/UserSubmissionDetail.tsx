'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import StatusBadge from '@/components/admin/StatusBadge';

interface Submission {
  id: string;
  title: string;
  description: string;
  category: string | null;
  start_date: string;
  end_date: string | null;
  start_time: string;
  end_time: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip_code: string;
  instructor_name: string;
  provider_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  price: number;
  ce_credits: number | null;
  registration_url: string;
  image_url: string;
  status: 'pending_payment' | 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
}

interface UserSubmissionDetailProps {
  submission: Submission;
}

export default function UserSubmissionDetail({ submission }: UserSubmissionDetailProps) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Allow editing for all statuses except pending_payment
  const canEdit = submission.status !== 'pending_payment';
  const canUseAsTemplate = true; // Always allow using as template

  const handleUseAsTemplate = () => {
    // Store submission data in sessionStorage and redirect to submit page
    sessionStorage.setItem('submissionTemplate', JSON.stringify({
      title: submission.title,
      description: submission.description,
      category: submission.category || '',
      start_date: '',  // Clear dates for new submission
      end_date: '',
      start_time: submission.start_time,
      end_time: submission.end_time,
      address_line1: submission.address_line1,
      address_line2: submission.address_line2 || '',
      city: submission.city,
      state: submission.state,
      zip_code: submission.zip_code,
      instructor_name: submission.instructor_name,
      provider_name: submission.provider_name,
      contact_email: submission.contact_email || '',
      contact_phone: submission.contact_phone || '',
      price: submission.price.toString(),
      ce_credits: submission.ce_credits?.toString() || '',
      registration_url: submission.registration_url,
      image_url: submission.image_url,
    }));
    router.push('/submit?template=true');
  };

  const handleEdit = () => {
    // Store full submission data including ID for editing
    sessionStorage.setItem('submissionEdit', JSON.stringify({
      originalId: submission.id,
      title: submission.title,
      description: submission.description,
      category: submission.category || '',
      start_date: submission.start_date,
      end_date: submission.end_date || '',
      start_time: submission.start_time,
      end_time: submission.end_time,
      address_line1: submission.address_line1,
      address_line2: submission.address_line2 || '',
      city: submission.city,
      state: submission.state,
      zip_code: submission.zip_code,
      instructor_name: submission.instructor_name,
      provider_name: submission.provider_name,
      contact_email: submission.contact_email || '',
      contact_phone: submission.contact_phone || '',
      price: submission.price.toString(),
      ce_credits: submission.ce_credits?.toString() || '',
      registration_url: submission.registration_url,
      image_url: submission.image_url,
    }));
    router.push('/submit?edit=true');
  };

  // Determine button text based on status
  const getEditButtonText = () => {
    switch (submission.status) {
      case 'rejected':
        return 'Edit & Resubmit';
      case 'pending':
        return 'Edit Submission';
      case 'approved':
        return 'Edit Listing';
      default:
        return 'Edit';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{submission.title}</h1>
              <StatusBadge status={submission.status} />
            </div>
            <p className="text-gray-600">{submission.provider_name}</p>
          </div>
          
          <div className="flex gap-3">
            {canUseAsTemplate && (
              <button
                onClick={handleUseAsTemplate}
                className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                  <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
                </svg>
                Use as Template
              </button>
            )}
            {canEdit && (
              <button
                onClick={handleEdit}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  submission.status === 'rejected'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-800 text-white hover:bg-gray-900'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                {getEditButtonText()}
              </button>
            )}
          </div>
        </div>

        {/* Rejection Notice */}
        {submission.status === 'rejected' && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-semibold text-red-800">Submission Rejected</h3>
                {submission.rejection_reason ? (
                  <p className="text-red-700 mt-1">{submission.rejection_reason}</p>
                ) : (
                  <p className="text-red-600 mt-1 italic">No reason provided.</p>
                )}
                {submission.reviewed_at && (
                  <p className="text-red-500 text-sm mt-2">
                    Reviewed on {formatDateTime(submission.reviewed_at)}
                  </p>
                )}
                <p className="text-red-700 text-sm mt-3">
                  Click &quot;Edit & Resubmit&quot; to make changes and submit again.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pending Notice */}
        {submission.status === 'pending' && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-semibold text-blue-800">Pending Review</h3>
                <p className="text-blue-700 mt-1">
                  Your submission is being reviewed by our team. You can still edit it while it&apos;s pending.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pending Payment Notice */}
        {submission.status === 'pending_payment' && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-semibold text-yellow-800">Payment Required</h3>
                <p className="text-yellow-700 mt-1">
                  This submission is awaiting payment. Complete the payment to submit for review.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Approved Notice */}
        {submission.status === 'approved' && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-semibold text-green-800">Approved & Live</h3>
                <p className="text-green-700 mt-1">
                  Your class is now visible on the platform. You can edit the listing if needed.{' '}
                  <Link href="/classes" className="underline hover:text-green-800">
                    View all classes →
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submission Metadata */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Submitted On</p>
            <p className="font-medium">{formatDateTime(submission.created_at)}</p>
          </div>
          <div>
            <p className="text-gray-500">Status</p>
            <StatusBadge status={submission.status} />
          </div>
          <div>
            <p className="text-gray-500">Submission ID</p>
            <p className="font-medium font-mono text-xs">{submission.id.slice(0, 8)}...</p>
          </div>
        </div>
      </div>

      {/* Class Details */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Description */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{submission.description}</p>
          </div>

          {/* Date & Time */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Date & Time</h2>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-gray-400">📅</span>
                <div>
                  <p className="text-gray-900">{formatDate(submission.start_date)}</p>
                  {submission.end_date && submission.end_date !== submission.start_date && (
                    <p className="text-gray-600">to {formatDate(submission.end_date)}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">🕐</span>
                <p className="text-gray-900">
                  {formatTime(submission.start_time)} - {formatTime(submission.end_time)}
                </p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Location</h2>
            <div className="flex items-start gap-2">
              <span className="text-gray-400">📍</span>
              <div>
                <p className="text-gray-900">{submission.address_line1}</p>
                {submission.address_line2 && (
                  <p className="text-gray-900">{submission.address_line2}</p>
                )}
                <p className="text-gray-900">
                  {submission.city}, {submission.state} {submission.zip_code}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Course Info */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Course Info</h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-500">Category</dt>
                <dd className="font-medium">{submission.category || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">CE Credits</dt>
                <dd className="font-medium">{submission.ce_credits || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Price</dt>
                <dd className="font-medium text-green-600">
                  {submission.price === 0 ? 'Free' : `$${submission.price.toFixed(2)}`}
                </dd>
              </div>
            </dl>
          </div>

          {/* Instructor & Contact */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Instructor & Contact</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-gray-500 text-sm">Instructor</dt>
                <dd className="font-medium">{submission.instructor_name}</dd>
              </div>
              <div>
                <dt className="text-gray-500 text-sm">Provider</dt>
                <dd className="font-medium">{submission.provider_name}</dd>
              </div>
              {submission.contact_email && (
                <div>
                  <dt className="text-gray-500 text-sm">Email</dt>
                  <dd className="text-blue-600">{submission.contact_email}</dd>
                </div>
              )}
              {submission.contact_phone && (
                <div>
                  <dt className="text-gray-500 text-sm">Phone</dt>
                  <dd>{submission.contact_phone}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Registration URL */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Registration</h2>
            <a
              href={submission.registration_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all text-sm"
            >
              {submission.registration_url}
            </a>
          </div>

          {/* Image Preview */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Image</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={submission.image_url}
              alt={submission.title}
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
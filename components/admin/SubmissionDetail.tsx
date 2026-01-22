'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StatusBadge from './StatusBadge';
import Spinner from '@/components/ui/Spinner';

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
  payment_amount: number | null;
  coupon_code: string | null;
  stripe_payment_id: string | null;
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
  users?: {
    id: string;
    email: string;
    full_name: string | null;
  };
  reviewer?: {
    email: string;
    full_name: string | null;
  };
}

interface SubmissionDetailProps {
  submission: Submission;
}

export default function SubmissionDetail({ submission }: SubmissionDetailProps) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState<string | null>(null);

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

  const handleApprove = async () => {
    setIsApproving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/submissions/${submission.id}/approve`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve submission');
      }

      router.push('/admin?status=pending&message=approved');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve submission');
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/submissions/${submission.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject submission');
      }

      setShowRejectModal(false);
      router.push('/admin?status=pending&message=rejected');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject submission');
      setIsRejecting(false);
    }
  };

  const isPending = submission.status === 'pending';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{submission.title}</h1>
              <StatusBadge status={submission.status} />
            </div>
            <p className="text-gray-600">{submission.provider_name}</p>
          </div>
          
          {isPending && (
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={isApproving || isRejecting}
                className={`px-4 py-2 rounded-sm font-medium flex items-center gap-2 ${
                  isApproving || isRejecting
                    ? 'bg-green-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                {isApproving ? (
                  <>
                    <Spinner size="sm" />
                    Approving...
                  </>
                ) : (
                  '✓ Approve'
                )}
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={isApproving || isRejecting}
                className={`px-4 py-2 rounded-sm font-medium ${
                  isApproving || isRejecting
                    ? 'bg-red-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                } text-white`}
              >
                ✕ Reject
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-sm p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Submission Metadata */}
      <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Submitted By</p>
            <p className="font-medium">{submission.users?.full_name || 'Unknown'}</p>
            <p className="text-gray-600 text-xs">{submission.users?.email}</p>
          </div>
          <div>
            <p className="text-gray-500">Submitted On</p>
            <p className="font-medium">{formatDateTime(submission.created_at)}</p>
          </div>
          <div>
            <p className="text-gray-500">Payment</p>
            {submission.coupon_code ? (
              <p className="font-medium text-purple-600">Coupon: {submission.coupon_code}</p>
            ) : submission.payment_amount === 0 ? (
              <p className="font-medium text-gray-500">Admin (Free)</p>
            ) : (
              <p className="font-medium text-green-600">
                ${submission.payment_amount?.toFixed(2) || '0.00'}
              </p>
            )}
          </div>
          <div>
            <p className="text-gray-500">Stripe ID</p>
            <p className="font-medium font-mono text-xs">
              {submission.stripe_payment_id || '-'}
            </p>
          </div>
        </div>

        {submission.reviewed_at && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-gray-500 text-sm">
              Reviewed on {formatDateTime(submission.reviewed_at)}
              {submission.reviewer && ` by ${submission.reviewer.full_name || submission.reviewer.email}`}
            </p>
            {submission.rejection_reason && (
              <p className="mt-2 text-red-600 text-sm">
                <strong>Rejection Reason:</strong> {submission.rejection_reason}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Class Details */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Description */}
          <div className="bg-white border border-gray-200 rounded-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{submission.description}</p>
          </div>

          {/* Date & Time */}
          <div className="bg-white border border-gray-200 rounded-sm p-6">
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
          <div className="bg-white border border-gray-200 rounded-sm p-6">
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
          <div className="bg-white border border-gray-200 rounded-sm p-6">
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
          <div className="bg-white border border-gray-200 rounded-sm p-6">
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
                  <dd>
                    <a
                      href={`mailto:${submission.contact_email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {submission.contact_email}
                    </a>
                  </dd>
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
          <div className="bg-white border border-gray-200 rounded-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Registration</h2>
            <a
              href={submission.registration_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              {submission.registration_url}
            </a>
          </div>

          {/* Image Preview */}
          <div className="bg-white border border-gray-200 rounded-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Image</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={submission.image_url}
              alt={submission.title}
              className="w-full h-48 object-cover rounded-sm"
            />
            <p className="text-xs text-gray-500 mt-2 break-all">{submission.image_url}</p>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-sm max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Submission</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to reject &quot;{submission.title}&quot;?
            </p>
            <div className="mb-4">
              <label
                htmlFor="rejection_reason"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Reason (optional)
              </label>
              <textarea
                id="rejection_reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="Enter reason for rejection..."
                className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                disabled={isRejecting}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isRejecting}
                className={`px-4 py-2 rounded-sm font-medium flex items-center gap-2 ${
                  isRejecting
                    ? 'bg-red-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                } text-white`}
              >
                {isRejecting ? (
                  <>
                    <Spinner size="sm" />
                    Rejecting...
                  </>
                ) : (
                  'Confirm Reject'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
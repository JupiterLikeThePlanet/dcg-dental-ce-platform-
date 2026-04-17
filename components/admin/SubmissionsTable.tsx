'use client';

import Link from 'next/link';
import StatusBadge from './StatusBadge';

interface Submission {
  id: string;
  title: string;
  provider_name: string;
  city: string;
  state: string;
  start_date: string;
  status: 'pending_payment' | 'pending' | 'approved' | 'rejected';
  payment_amount: number | null;
  coupon_code: string | null;
  created_at: string;
  users?: {
    email: string;
    full_name: string | null;
  };
}

interface SubmissionsTableProps {
  submissions: Submission[];
  emptyMessage?: string;
}

export default function SubmissionsTable({ 
  submissions, 
  emptyMessage = 'No submissions found' 
}: SubmissionsTableProps) {
  if (submissions.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-sm p-8 text-center">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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

  return (
    <div>
      {/* Mobile: card layout */}
      <div className="sm:hidden space-y-3">
        {submissions.map((submission) => (
          <Link
            key={submission.id}
            href={`/admin/submissions/${submission.id}`}
            className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm active:bg-gray-50 transition-all"
          >
            <div className="flex justify-between items-start mb-1.5">
              <p className="font-medium text-blue-600 text-sm leading-snug flex-1 mr-3">
                {submission.title}
              </p>
              <StatusBadge status={submission.status} />
            </div>
            <p className="text-xs text-gray-500 mb-2">{submission.provider_name}</p>
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1.5">
              <span>{submission.city}, {submission.state} · {formatDate(submission.start_date)}</span>
              <span>{submission.users?.full_name || submission.users?.email?.split('@')[0] || 'Unknown'}</span>
            </div>
            {(submission.coupon_code || submission.payment_amount != null) && (
              <div className="text-xs">
                {submission.coupon_code ? (
                  <span className="text-purple-600">Coupon: {submission.coupon_code}</span>
                ) : submission.payment_amount === 0 ? (
                  <span className="text-gray-500">Admin (Free)</span>
                ) : (
                  <span className="text-green-600">${submission.payment_amount!.toFixed(2)}</span>
                )}
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block bg-white border border-gray-200 rounded-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Class
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitted By
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Class Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitted
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {submissions.map((submission) => (
              <tr key={submission.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <div className="max-w-xs">
                    <Link
                      href={`/admin/submissions/${submission.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline truncate block"
                    >
                      {submission.title}
                    </Link>
                    <p className="text-sm text-gray-500 truncate">
                      {submission.provider_name}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm">
                    <p className="text-gray-900">
                      {submission.users?.full_name || 'Unknown'}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {submission.users?.email || 'No email'}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <p className="text-sm text-gray-900">
                    {submission.city}, {submission.state}
                  </p>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <p className="text-sm text-gray-900">
                    {formatDate(submission.start_date)}
                  </p>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    {submission.coupon_code ? (
                      <span className="text-purple-600 font-medium">
                        Coupon: {submission.coupon_code}
                      </span>
                    ) : submission.payment_amount === 0 ? (
                      <span className="text-gray-500">Admin (Free)</span>
                    ) : submission.payment_amount ? (
                      <span className="text-green-600">
                        ${submission.payment_amount.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <StatusBadge status={submission.status} />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <p className="text-sm text-gray-500">
                    {formatDateTime(submission.created_at)}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
}
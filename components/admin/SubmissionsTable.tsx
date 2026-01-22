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
    <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
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
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {submissions.map((submission) => (
              <tr key={submission.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <div className="max-w-xs">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {submission.title}
                    </p>
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
                <td className="px-4 py-4 whitespace-nowrap text-right">
                  <Link
                    href={`/admin/submissions/${submission.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
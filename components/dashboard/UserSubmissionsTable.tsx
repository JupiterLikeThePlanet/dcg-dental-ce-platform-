'use client';

import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/admin/StatusBadge';

interface Submission {
  id: string;
  title: string;
  provider_name: string;
  city: string;
  state: string;
  start_date: string;
  status: 'pending_payment' | 'pending' | 'approved' | 'rejected';
  created_at: string;
  rejection_reason: string | null;
}

interface UserSubmissionsTableProps {
  submissions: Submission[];
}

export default function UserSubmissionsTable({ submissions }: UserSubmissionsTableProps) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleRowClick = (id: string) => {
    router.push(`/dashboard/submissions/${id}`);
  };

  if (submissions.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-8 text-center">
        <div className="text-gray-400 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="font-semibold text-gray-700 mb-1">No submissions yet</h3>
        <p className="text-gray-500 text-sm">Submit your first CE class to see it here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Class
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Class Date
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
              <tr 
                key={submission.id} 
                onClick={() => handleRowClick(submission.id)}
                className="hover:bg-blue-50 cursor-pointer transition-colors duration-150"
              >
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
                  <StatusBadge status={submission.status} />
                  {submission.status === 'rejected' && submission.rejection_reason && (
                    <p className="text-xs text-red-500 mt-1 max-w-[150px] truncate" title={submission.rejection_reason}>
                      {submission.rejection_reason}
                    </p>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <p className="text-sm text-gray-500">
                    {formatDate(submission.created_at)}
                  </p>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right">
                  <span className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center gap-1">
                    View
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import Link from 'next/link';
import UserSubmissionsTable from './UserSubmissionsTable';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

interface Submission {
  id: string;
  title: string;
  provider_name: string;
  city: string;
  state: string;
  start_date: string;
  end_date: string | null;
  status: 'pending_payment' | 'pending' | 'approved' | 'rejected';
  created_at: string;
  rejection_reason: string | null;
}

interface Props {
  submissions: Submission[];
  stats: { total: number; pending: number; approved: number; rejected: number };
}

export default function DashboardContent({ submissions, stats }: Props) {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');

  const statCards = [
    {
      key: 'all' as StatusFilter,
      label: 'Total Submissions',
      count: stats.total,
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      activeBg: 'bg-gray-200',
      activeBorder: 'border-gray-400',
      text: 'text-gray-900',
      subText: 'text-gray-500',
    },
    {
      key: 'pending' as StatusFilter,
      label: 'Pending Review',
      count: stats.pending,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      activeBg: 'bg-blue-100',
      activeBorder: 'border-blue-500',
      text: 'text-blue-700',
      subText: 'text-blue-600',
    },
    {
      key: 'approved' as StatusFilter,
      label: 'Approved',
      count: stats.approved,
      bg: 'bg-green-50',
      border: 'border-green-200',
      activeBg: 'bg-green-100',
      activeBorder: 'border-green-500',
      text: 'text-green-700',
      subText: 'text-green-600',
    },
    {
      key: 'rejected' as StatusFilter,
      label: 'Rejected',
      count: stats.rejected,
      bg: 'bg-red-50',
      border: 'border-red-200',
      activeBg: 'bg-red-100',
      activeBorder: 'border-red-500',
      text: 'text-red-700',
      subText: 'text-red-600',
    },
  ];

  return (
    <>
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => {
          const isActive = activeFilter === card.key;
          return (
            <button
              key={card.key}
              onClick={() => setActiveFilter(card.key)}
              className={`rounded-xl p-4 border text-left transition-all ${
                isActive
                  ? `${card.activeBg} ${card.activeBorder} ring-2 ring-offset-1 ${card.activeBorder.replace('border-', 'ring-')}`
                  : `${card.bg} ${card.border} hover:brightness-95`
              }`}
            >
              <p className={`text-sm ${card.subText}`}>{card.label}</p>
              <p className={`text-2xl font-bold ${card.text}`}>{card.count}</p>
            </button>
          );
        })}
      </div>

      {/* Actions Row */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <Link
          href="/submit"
          className="flex-1 p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-3 font-semibold"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Submit New Class
        </Link>
        <Link
          href="/classes"
          className="flex-1 p-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-3 font-semibold border border-gray-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
          Browse All Classes
        </Link>
      </div>

      {/* Submissions Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Your Submissions</h2>
          {stats.total > 0 && (
            <span className="text-sm text-gray-500">{stats.total} total</span>
          )}
        </div>

        <UserSubmissionsTable
          submissions={submissions}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        {stats.total > 0 && (
          <p className="text-center text-gray-500 text-sm mt-4">
            Click on any row to view details, use as template, or edit rejected submissions.
          </p>
        )}
      </div>
    </>
  );
}

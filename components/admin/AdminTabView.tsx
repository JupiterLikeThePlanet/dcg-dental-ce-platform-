'use client';

import { useState } from 'react';
import Link from 'next/link';
import SubmissionsTable from './SubmissionsTable';
import CouponManager from './CouponManager';

type Tab = 'submissions' | 'coupons';

interface StatusTab {
  key: string;
  label: string;
  count: number;
}

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
  users?: { email: string; full_name: string | null };
}

interface Props {
  submissions: Submission[];
  emptyMessage: string;
  statusTabs: StatusTab[];
  statusFilter: string;
  error?: string | null;
}

export default function AdminTabView({ submissions, emptyMessage, statusTabs, statusFilter, error }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('submissions');
  const [displayedTab, setDisplayedTab] = useState<Tab>('submissions');
  const [contentVisible, setContentVisible] = useState(true);

  function switchTab(tab: Tab) {
    if (tab === displayedTab) return;
    setActiveTab(tab);
    setContentVisible(false);
    setTimeout(() => {
      setDisplayedTab(tab);
      setContentVisible(true);
    }, 180);
  }

  const tabStyle = (isActive: boolean) =>
    `px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-all duration-200 ${
      isActive
        ? 'border-blue-500 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`;

  return (
    <>
      {/* Toolbar: status filter tabs (left) + view toggle (right), sharing one border-b */}
      <div className="flex items-end justify-between border-b border-gray-200 mb-6 overflow-x-auto">
        {/* Left: status filter tabs — only shown in submissions view */}
        <nav className="flex gap-4 min-w-max">
          {displayedTab === 'submissions' ? (
            statusTabs.map((tab) => {
              const isActive = statusFilter === tab.key;
              return (
                <Link
                  key={tab.key}
                  href={`/admin?status=${tab.key}`}
                  className={tabStyle(isActive)}
                >
                  {tab.label}
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-xs transition-colors ${
                      isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </Link>
              );
            })
          ) : (
            <span className="px-4 py-3 text-sm font-medium text-gray-400">Coupons</span>
          )}
        </nav>

        {/* Right: view toggle, matching tab underline style */}
        <div className="flex gap-0">
          <button onClick={() => switchTab('submissions')} className={tabStyle(activeTab === 'submissions')}>
            Submissions
          </button>
          <button onClick={() => switchTab('coupons')} className={tabStyle(activeTab === 'coupons')}>
            Coupons
          </button>
        </div>
      </div>

      {/* Animated content area */}
      <div
        style={{
          transition: 'opacity 0.18s ease-in-out',
          opacity: contentVisible ? 1 : 0,
        }}
      >
        {displayedTab === 'submissions' ? (
          <>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-sm p-4 mb-6">
                <p className="text-red-700">Error loading submissions: {error}</p>
              </div>
            )}

            <SubmissionsTable submissions={submissions} emptyMessage={emptyMessage} />

            <p className="text-center text-gray-500 text-sm mt-6">
              Click on any row to view full submission details and approve or reject.
            </p>
          </>
        ) : (
          <CouponManager />
        )}
      </div>
    </>
  );
}

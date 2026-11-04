'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBadge from './StatusBadge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EyeIcon from '@/components/ui/EyeIcon';
import RestoreIcon from '@/components/ui/RestoreIcon';
import Tooltip from '@/components/ui/Tooltip';
import TrashIcon from '@/components/ui/TrashIcon';
import { REMOVE_LISTING_TITLE, removeListingBody } from '@/components/ui/removeListingCopy';
import { postSubmissionAction } from '@/components/ui/submissionAction';
import { formatPurgeDate } from '@/lib/removal-window';

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
  deleted_at: string | null;
  users?: {
    email: string;
    full_name: string | null;
  };
}

interface SubmissionsTableProps {
  submissions: Submission[];
  emptyMessage?: string;
  /** Paywall on: show the Payment column. Off: hide every money reference. */
  showPayment: boolean;
  /** Current admin tab, kept on the URL after remove or restore so the toast can fire. */
  statusFilter?: string;
}

export default function SubmissionsTable({
  submissions,
  emptyMessage = 'No submissions found',
  showPayment,
  statusFilter = 'pending',
}: SubmissionsTableProps) {
  const router = useRouter();
  const [pendingRemove, setPendingRemove] = useState<Submission | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);
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

  const finish = (message: 'removed' | 'restored') => {
    setPendingRemove(null);
    setBusyId(null);
    setRemoveError(null);
    router.push(`/admin?status=${statusFilter}&message=${message}`);
    router.refresh();
  };

  const handleRemove = async () => {
    if (!pendingRemove) return;
    setBusyId(pendingRemove.id);
    setRemoveError(null);
    const result = await postSubmissionAction(pendingRemove.id, 'remove');
    if (!result.ok) {
      setRemoveError(result.error);
      setBusyId(null);
      return;
    }
    finish('removed');
  };

  const handleRestore = async (submission: Submission) => {
    setBusyId(submission.id);
    setRowError(null);
    const result = await postSubmissionAction(submission.id, 'restore');
    if (!result.ok) {
      setRowError({ id: submission.id, message: result.error });
      setBusyId(null);
      return;
    }
    finish('restored');
  };

  const iconButton =
    'p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md disabled:cursor-not-allowed disabled:opacity-50';

  const rowAction = (submission: Submission) => {
    return (
      <div className="flex items-center justify-center gap-1">
        <Tooltip label="View listing">
          <Link
            href={`/admin/submissions/${submission.id}`}
            aria-label="View listing"
            className={iconButton}
          >
            <EyeIcon />
          </Link>
        </Tooltip>
        {submission.deleted_at ? (
          <Tooltip label="Restore listing">
            <button
              type="button"
              data-testid="restore-listing"
              aria-label="Restore listing"
              onClick={() => handleRestore(submission)}
              disabled={busyId === submission.id}
              className={iconButton}
            >
              <RestoreIcon />
            </button>
          </Tooltip>
        ) : (
          <Tooltip label="Remove listing">
            <button
              type="button"
              data-testid="remove-listing"
              aria-label="Remove listing"
              onClick={() => {
                setRemoveError(null);
                setPendingRemove(submission);
              }}
              disabled={busyId === submission.id}
              className={iconButton}
            >
              <TrashIcon />
            </button>
          </Tooltip>
        )}
        {rowError?.id === submission.id && (
          <p className="text-xs text-red-600 max-w-[8rem] whitespace-normal">{rowError.message}</p>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Mobile: card layout */}
      <div className="sm:hidden space-y-3">
        {submissions.map((submission) => (
          <div
            key={submission.id}
            className="bg-white border border-gray-200 rounded-xl p-4"
          >
            <div className="flex justify-between items-start gap-2">
              <Link
                href={`/admin/submissions/${submission.id}`}
                className="block min-w-0 flex-1"
              >
                <p className="font-medium text-blue-600 text-sm leading-snug hover:underline">
                  {submission.title}
                </p>
                {submission.deleted_at && <RemovedNote deletedAt={submission.deleted_at} />}
                <p className="text-xs text-gray-500 mb-2 mt-1.5">{submission.provider_name}</p>
                <div className="flex justify-between items-center text-xs text-gray-400 mb-1.5">
                  <span>{submission.city}, {submission.state} · {formatDate(submission.start_date)}</span>
                  <span>{submission.users?.full_name || submission.users?.email?.split('@')[0] || 'Unknown'}</span>
                </div>
                {showPayment && (submission.coupon_code || submission.payment_amount != null) && (
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
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={submission.status} />
                {rowAction(submission)}
              </div>
            </div>
          </div>
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
              {showPayment && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitted
              </th>
              <th className="w-[88px] px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
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
                {showPayment && (
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
                )}
                <td className="px-4 py-4 whitespace-nowrap">
                  <StatusBadge status={submission.status} />
                  {submission.deleted_at && <RemovedNote deletedAt={submission.deleted_at} />}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <p className="text-sm text-gray-500">
                    {formatDateTime(submission.created_at)}
                  </p>
                </td>
                <td className="px-2 py-4 whitespace-nowrap">
                  {rowAction(submission)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

      {pendingRemove && (
        <ConfirmDialog
          title={REMOVE_LISTING_TITLE}
          body={removeListingBody('admin', pendingRemove.status)}
          confirmLabel="Remove"
          busy={busyId === pendingRemove.id}
          error={removeError}
          onConfirm={handleRemove}
          onCancel={() => {
            if (busyId === pendingRemove.id) return;
            setPendingRemove(null);
            setRemoveError(null);
          }}
        />
      )}
    </div>
  );
}

function RemovedNote({ deletedAt }: { deletedAt: string }) {
  return (
    <p className="mt-1 text-xs text-gray-500 whitespace-nowrap">
      Removed · deletes {formatPurgeDate(deletedAt)}
    </p>
  );
}

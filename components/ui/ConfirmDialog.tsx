'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import Spinner from '@/components/ui/Spinner';

interface ConfirmDialogProps {
  title: string;
  body: ReactNode;
  confirmLabel: string;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  body,
  confirmLabel,
  busy,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [busy, onCancel]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        data-testid="confirm-dialog"
        className="bg-white rounded-sm max-w-md w-full p-6"
      >
        <h3 id="confirm-dialog-title" className="text-lg font-semibold text-gray-900 mb-4">
          {title}
        </h3>
        <div className="text-gray-600 mb-4">{body}</div>
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-sm p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        <div className="flex justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            data-testid="confirm-remove"
            className={`px-4 py-2 rounded-sm font-medium flex items-center gap-2 ${
              busy ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
            } text-white`}
          >
            {busy ? (
              <>
                <Spinner size="sm" />
                Removing...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

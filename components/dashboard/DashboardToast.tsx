'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Toast from '@/components/ui/Toast';
import { formatPurgeDate } from '@/lib/removal-window';

export default function DashboardToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const message = searchParams.get('message');

    if (message === 'removed') {
      setToast({
        type: 'success',
        message: `Listing removed. You can restore it from Recently removed until ${formatPurgeDate(new Date())}.`,
      });
    } else if (message === 'restored') {
      setToast({
        type: 'success',
        message: 'Listing restored.',
      });
    }
  }, [searchParams]);

  const handleClose = () => {
    setToast(null);
    router.replace('/dashboard', { scroll: false });
  };

  if (!toast) return null;

  return (
    <Toast
      type={toast.type}
      message={toast.message}
      duration={5000}
      onClose={handleClose}
    />
  );
}

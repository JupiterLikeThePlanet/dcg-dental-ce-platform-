'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Toast from '@/components/ui/Toast';

export default function AdminToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const message = searchParams.get('message');
    
    if (message === 'approved') {
      setToast({
        type: 'success',
        message: 'Submission approved and published successfully!',
      });
    } else if (message === 'rejected') {
      setToast({
        type: 'error',
        message: 'Submission has been rejected.',
      });
    }
  }, [searchParams]);

  const handleClose = () => {
    setToast(null);
    // Remove the message param from URL without refresh
    const currentStatus = searchParams.get('status') || 'pending';
    router.replace(`/admin?status=${currentStatus}`, { scroll: false });
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
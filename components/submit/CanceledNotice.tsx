'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CanceledNotice() {
  const [visible, setVisible] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Auto-hide after 5 seconds and clean URL
    const timer = setTimeout(() => {
      setVisible(false);
      router.replace('/submit', { scroll: false });
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  const handleDismiss = () => {
    setVisible(false);
    router.replace('/submit', { scroll: false });
  };

  if (!visible) return null;

  return (
    <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-sm p-4 flex justify-between items-center">
      <p className="text-yellow-800">
        Payment was canceled. Your submission has been removed. Please try again when ready.
      </p>
      <button 
        onClick={handleDismiss}
        className="text-yellow-600 hover:text-yellow-800 ml-4"
      >
        ✕
      </button>
    </div>
  );
}
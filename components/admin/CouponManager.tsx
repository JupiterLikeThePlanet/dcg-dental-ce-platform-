'use client';

import { useState, useEffect, useRef } from 'react';

interface Coupon {
  id: string;
  code: string;
  isNew?: boolean;
}

export default function CouponManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/admin/coupons')
      .then(r => r.json())
      .then(d => { setCoupons(d.coupons || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (showForm) setTimeout(() => inputRef.current?.focus(), 50);
  }, [showForm]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    await new Promise(r => setTimeout(r, 280));
    const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setCoupons(prev => prev.filter(c => c.id !== id));
    }
    setDeletingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newCode.trim().toUpperCase();
    if (!trimmed) { setFormError('Code is required'); return; }
    if (trimmed.length > 8) { setFormError('Max 8 characters'); return; }

    setSubmitting(true);
    setFormError('');

    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: trimmed }),
    });
    const data = await res.json();

    if (!res.ok) {
      setFormError(data.error || 'Failed to create coupon');
      setSubmitting(false);
      return;
    }

    setShowForm(false);
    setNewCode('');
    setSubmitting(false);

    const newCoupon: Coupon = { ...data.coupon, isNew: true };
    setCoupons(prev => [...prev, newCoupon]);
    setTimeout(() => {
      setCoupons(prev => prev.map(c => c.id === newCoupon.id ? { ...c, isNew: false } : c));
    }, 400);
  }

  if (loading) {
    return <div className="py-10 text-center text-gray-500 text-sm">Loading coupons...</div>;
  }

  return (
    <>
      <style>{`
        @keyframes couponRowIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .coupon-row-enter { animation: couponRowIn 0.3s ease-in forwards; }
      `}</style>

      {/* Coupon table */}
      <div className="border border-gray-200 rounded-sm overflow-hidden">
        {coupons.length === 0 ? (
          <div className="py-10 text-center text-gray-500 text-sm">
            No coupons yet. Add one below.
          </div>
        ) : (
          coupons.map((coupon) => (
            <div
              key={coupon.id}
              className={coupon.isNew ? 'coupon-row-enter' : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: '1px solid #f3f4f6',
                transition: 'opacity 0.28s ease-out, transform 0.28s ease-out',
                opacity: deletingId === coupon.id ? 0 : 1,
                transform: deletingId === coupon.id ? 'translateY(-4px)' : 'none',
              }}
            >
              <span className="font-mono text-sm font-medium text-gray-800 tracking-wide">
                {coupon.code}
              </span>
              <button
                onClick={() => handleDelete(coupon.id)}
                disabled={!!deletingId}
                title="Delete coupon"
                className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add coupon section */}
      <div className="mt-4">
        {/* Inline form — slides in */}
        <div
          style={{
            overflow: 'hidden',
            maxHeight: showForm ? '80px' : '0px',
            opacity: showForm ? 1 : 0,
            transition: 'max-height 0.25s ease-in-out, opacity 0.25s ease-in-out',
          }}
        >
          <form onSubmit={handleSubmit} className="flex items-start gap-2 pb-2">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newCode}
                  onChange={(e) => {
                    setNewCode(e.target.value.toUpperCase().slice(0, 8));
                    setFormError('');
                  }}
                  placeholder="COUPON"
                  maxLength={8}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm font-mono uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? '...' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setNewCode(''); setFormError(''); }}
                  className="px-2 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{newCode.length}/8 characters</span>
                {formError && <span className="text-xs text-red-500">{formError}</span>}
              </div>
            </div>
          </form>
        </div>

        {/* Add button — fades out when form opens */}
        <div
          style={{
            opacity: showForm ? 0 : 1,
            transition: 'opacity 0.2s ease-in-out',
            pointerEvents: showForm ? 'none' : 'auto',
          }}
        >
          <button
            onClick={() => { setShowForm(true); setFormError(''); }}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Coupon
          </button>
        </div>
      </div>
    </>
  );
}

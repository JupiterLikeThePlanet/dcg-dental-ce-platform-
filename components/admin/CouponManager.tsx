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
  const [modalMounted, setModalMounted] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
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
    if (modalVisible) setTimeout(() => inputRef.current?.focus(), 50);
  }, [modalVisible]);

  function openModal() {
    setNewCode('');
    setFormError('');
    setModalMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setModalVisible(true)));
  }

  function closeModal() {
    setModalVisible(false);
    setTimeout(() => {
      setModalMounted(false);
      setNewCode('');
      setFormError('');
    }, 220);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    // Fade + collapse simultaneously — remove from DOM after fade completes
    await new Promise(r => setTimeout(r, 200));
    setCoupons(prev => prev.filter(c => c.id !== id));
    setDeletingId(null);
    fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
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

    setSubmitting(false);
    closeModal();

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

        .modal-backdrop { transition: opacity 0.22s ease; }
        .modal-panel    { transition: opacity 0.22s ease, transform 0.22s ease; }
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
                padding: deletingId === coupon.id ? '0 16px' : '12px 16px',
                borderBottom: '1px solid #f3f4f6',
                maxHeight: deletingId === coupon.id ? '0px' : '56px',
                overflow: 'hidden',
                opacity: deletingId === coupon.id ? 0 : 1,
                transition: 'opacity 0.18s ease-out, max-height 0.18s ease-out, padding 0.18s ease-out',
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

      {/* Add Coupon button */}
      <div className="mt-4">
        <button
          onClick={openModal}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Coupon
        </button>
      </div>

      {/* Modal overlay */}
      {modalMounted && (
        <div
          className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          style={{ opacity: modalVisible ? 1 : 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            className="modal-panel bg-white rounded-sm shadow-xl w-full max-w-sm mx-4 p-6"
            style={{
              opacity: modalVisible ? 1 : 0,
              transform: modalVisible ? 'scale(1)' : 'scale(0.96)',
            }}
          >
            <h2 className="text-base font-semibold text-gray-900 mb-4">Add Coupon</h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <input
                  ref={inputRef}
                  type="text"
                  value={newCode}
                  onChange={(e) => { setNewCode(e.target.value.toUpperCase().slice(0, 8)); setFormError(''); }}
                  placeholder="COUPON"
                  maxLength={8}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-400">{newCode.length}/8 characters</span>
                  {formError && <span className="text-xs text-red-500">{formError}</span>}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Adding...' : 'Add Coupon'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

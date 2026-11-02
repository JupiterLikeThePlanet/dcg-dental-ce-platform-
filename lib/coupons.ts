import type { SupabaseClient } from '@supabase/supabase-js';

export interface CouponRow {
  id: string;
  code: string;
  is_active: boolean;
  current_uses: number;
  max_uses: number | null;
  expires_at?: string | null;
}

/** Active, not expired, and under its use limit. */
export function isCouponUsable(coupon: CouponRow | null): coupon is CouponRow {
  if (!coupon || !coupon.is_active) return false;
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() <= Date.now()) return false;
  if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) return false;
  return true;
}

/**
 * Look up a coupon with the service role client, so coupon_codes never needs
 * to be readable by regular users. Server only.
 */
export async function getUsableCoupon(
  supabaseAdmin: SupabaseClient,
  code: string
): Promise<CouponRow | null> {
  const { data } = await supabaseAdmin
    .from('coupon_codes')
    .select('*')
    .eq('code', code.trim())
    .maybeSingle();

  const coupon = data as CouponRow | null;
  return isCouponUsable(coupon) ? coupon : null;
}

/**
 * Count one use. The update only matches if current_uses hasn't changed since
 * we read it, so two simultaneous redemptions can't both slip past max_uses.
 * Returns false if another request won the race or the limit was reached.
 */
export async function claimCouponUse(
  supabaseAdmin: SupabaseClient,
  coupon: CouponRow
): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: current } = await supabaseAdmin
      .from('coupon_codes')
      .select('*')
      .eq('id', coupon.id)
      .maybeSingle();

    const fresh = current as CouponRow | null;
    if (!isCouponUsable(fresh)) return false;

    const { data: updated } = await supabaseAdmin
      .from('coupon_codes')
      .update({ current_uses: fresh.current_uses + 1 })
      .eq('id', fresh.id)
      .eq('current_uses', fresh.current_uses)
      .select('id');

    if (updated && updated.length === 1) return true;
  }
  return false;
}

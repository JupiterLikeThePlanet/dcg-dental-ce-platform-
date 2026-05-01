import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

async function verifyAdmin() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('users').select('is_admin').eq('id', user.id).single();
  return data?.is_admin ? user : null;
}

export async function GET() {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabaseAdmin = getSupabaseAdmin();
  const { data: coupons, error } = await supabaseAdmin
    .from('coupon_codes')
    .select('id, code, is_active, current_uses, max_uses')
    .order('code');

  if (error) return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  return NextResponse.json({ coupons });
}

export async function POST(request: NextRequest) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabaseAdmin = getSupabaseAdmin();
  const { code } = await request.json();

  if (!code?.trim()) return NextResponse.json({ error: 'Code is required' }, { status: 400 });
  const normalized = code.trim().toUpperCase();
  if (normalized.length > 8) return NextResponse.json({ error: 'Code must be 8 characters or less' }, { status: 400 });

  const { data: existing } = await supabaseAdmin
    .from('coupon_codes')
    .select('id')
    .eq('code', normalized)
    .single();

  if (existing) return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 });

  const { data: coupon, error } = await supabaseAdmin
    .from('coupon_codes')
    .insert([{ code: normalized, is_active: true, current_uses: 0, max_uses: null }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  return NextResponse.json({ coupon }, { status: 201 });
}

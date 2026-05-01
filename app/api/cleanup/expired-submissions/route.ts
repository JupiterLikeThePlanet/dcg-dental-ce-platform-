import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// Secured with CRON_SECRET env var — set this in your Vercel project settings
// Call via: POST /api/cleanup/expired-submissions
// Authorization: Bearer <CRON_SECRET>
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0];

  // Find approved submissions past the 1-year retention window
  const { data: expiredSubmissions, error: fetchError } = await supabaseAdmin
    .from('submissions')
    .select('id')
    .eq('status', 'approved')
    .not('end_date', 'is', null)
    .lt('end_date', oneYearAgoStr);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!expiredSubmissions || expiredSubmissions.length === 0) {
    return NextResponse.json({ deleted: 0, message: 'No expired submissions found' });
  }

  const expiredIds = expiredSubmissions.map(s => s.id);

  // Delete corresponding class records (linked via submission_id)
  const { error: classDeleteError } = await supabaseAdmin
    .from('classes')
    .delete()
    .in('submission_id', expiredIds);

  if (classDeleteError) {
    return NextResponse.json({ error: classDeleteError.message }, { status: 500 });
  }

  // Delete the submissions themselves
  const { error: submissionDeleteError } = await supabaseAdmin
    .from('submissions')
    .delete()
    .in('id', expiredIds);

  if (submissionDeleteError) {
    return NextResponse.json({ error: submissionDeleteError.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: expiredIds.length });
}

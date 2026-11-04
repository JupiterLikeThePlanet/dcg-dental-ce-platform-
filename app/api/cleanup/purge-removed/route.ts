import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { purgeCutoffIso, RECOVERY_DAYS } from '@/lib/removal-window';

// Permanently deletes listings that were removed (soft-deleted) more than
// RECOVERY_DAYS ago. Deleting the submission cascades to its class
// (classes.submission_id ON DELETE CASCADE). Removed classes are already hidden
// from /classes, so the filter-options cache doesn't need revalidating.
//
// Scheduled daily by vercel.json (Vercel Cron sends GET with
// `Authorization: Bearer <CRON_SECRET>`). POST is for manual runs, same header.
export async function GET(request: NextRequest) {
  return runPurge(request);
}

export async function POST(request: NextRequest) {
  return runPurge(request);
}

async function runPurge(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const cutoff = purgeCutoffIso();

  const { data: expired, error: fetchError } = await supabaseAdmin
    .from('submissions')
    .select('id, title, status, deleted_at, deleted_by')
    .not('deleted_at', 'is', null)
    .lt('deleted_at', cutoff);

  if (fetchError) {
    console.error('[purge-removed] fetch failed:', fetchError);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!expired || expired.length === 0) {
    return NextResponse.json({ deleted: 0, message: 'Nothing past the recovery window' });
  }

  const ids = expired.map((s) => s.id as string);

  // Re-apply the cutoff so a listing restored between the select and this
  // delete is left alone.
  const { data: deleted, error: deleteError } = await supabaseAdmin
    .from('submissions')
    .delete()
    .in('id', ids)
    .not('deleted_at', 'is', null)
    .lt('deleted_at', cutoff)
    .select('id');

  if (deleteError) {
    console.error('[purge-removed] delete failed:', deleteError);
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const deletedIds = new Set((deleted ?? []).map((d) => d.id as string));

  // Audit trail in Vercel logs: the only record of what was permanently deleted.
  for (const s of expired) {
    if (deletedIds.has(s.id as string)) {
      console.log(
        `[purge-removed] deleted submission ${s.id} "${s.title}" (status=${s.status}, removed_at=${s.deleted_at}, removed_by=${s.deleted_by ?? 'unknown'}) after ${RECOVERY_DAYS} days`
      );
    }
  }

  return NextResponse.json({ deleted: deletedIds.size });
}

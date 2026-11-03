import type { SupabaseClient } from '@supabase/supabase-js';
import { revalidateTag } from 'next/cache';
import { CLASS_FILTER_OPTIONS_TAG } from '@/lib/class-filter-options';
import { isRecoverable, purgeDateFor } from '@/lib/removal-window';

// Removed listings are soft-deleted (submissions.deleted_at + classes.deleted_at),
// recoverable for RECOVERY_DAYS (lib/removal-window.ts), then hard-deleted by
// /api/cleanup/purge-removed. Server only: imports next/cache.

export interface Actor {
  id: string;
  isAdmin: boolean;
}

/** Signed-in user plus admin flag, read with the user's own (RLS-bound) client. */
export async function getActor(supabase: SupabaseClient): Promise<Actor | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userData } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single<{ is_admin: boolean | null }>();

  return { id: user.id, isAdmin: Boolean(userData?.is_admin) };
}

export type RemovalResult =
  | { ok: true; purgeAt: string | null }
  | { ok: false; status: number; error: string };

interface RemovalRow {
  id: string;
  submitted_by: string;
  deleted_at: string | null;
  deleted_by: string | null;
}

// Admins can act on any row; everyone else only on their own. Others' rows
// return 404 so the response doesn't reveal whether the id exists.
async function loadForActor(
  admin: SupabaseClient,
  id: string,
  actor: Actor
): Promise<RemovalRow | null> {
  const { data, error } = await admin
    .from('submissions')
    .select('id, submitted_by, deleted_at, deleted_by')
    .eq('id', id)
    .maybeSingle<RemovalRow>();

  if (error || !data) return null;
  if (!actor.isAdmin && data.submitted_by !== actor.id) return null;
  return data;
}

/** Soft-delete a submission and its live class. Idempotent. */
export async function removeSubmission(
  admin: SupabaseClient,
  id: string,
  actor: Actor
): Promise<RemovalResult> {
  const row = await loadForActor(admin, id, actor);
  if (!row) return { ok: false, status: 404, error: 'Submission not found' };

  if (row.deleted_at) {
    return { ok: true, purgeAt: purgeDateFor(row.deleted_at).toISOString() };
  }

  const now = new Date().toISOString();

  const { error: submissionError } = await admin
    .from('submissions')
    .update({ deleted_at: now, deleted_by: actor.id })
    .eq('id', id)
    .is('deleted_at', null);

  if (submissionError) {
    console.error('Remove submission error:', submissionError);
    return { ok: false, status: 500, error: 'Failed to remove submission' };
  }

  const { error: classError } = await admin
    .from('classes')
    .update({ deleted_at: now })
    .eq('submission_id', id)
    .is('deleted_at', null);

  if (classError) {
    console.error('Remove class error, rolling back submission:', classError);
    await admin
      .from('submissions')
      .update({ deleted_at: null, deleted_by: null })
      .eq('id', id);
    return { ok: false, status: 500, error: 'Failed to remove listing' };
  }

  // A removed live listing may drop a state/category from the /classes dropdowns
  revalidateTag(CLASS_FILTER_OPTIONS_TAG);

  return { ok: true, purgeAt: purgeDateFor(now).toISOString() };
}

/** Undo a removal within the recovery window. Idempotent. */
export async function restoreSubmission(
  admin: SupabaseClient,
  id: string,
  actor: Actor
): Promise<RemovalResult> {
  const row = await loadForActor(admin, id, actor);
  if (!row) return { ok: false, status: 404, error: 'Submission not found' };

  if (!row.deleted_at) return { ok: true, purgeAt: null };

  if (!isRecoverable(row.deleted_at)) {
    return { ok: false, status: 410, error: 'The recovery window for this listing has passed' };
  }

  // Providers can't undo a removal an admin made (e.g. spam takedown)
  if (!actor.isAdmin && row.deleted_by !== actor.id) {
    return {
      ok: false,
      status: 403,
      error: 'This listing was removed by an administrator and can’t be restored from your dashboard',
    };
  }

  const { error: classError } = await admin
    .from('classes')
    .update({ deleted_at: null })
    .eq('submission_id', id);

  if (classError) {
    console.error('Restore class error:', classError);
    return { ok: false, status: 500, error: 'Failed to restore listing' };
  }

  const { error: submissionError } = await admin
    .from('submissions')
    .update({ deleted_at: null, deleted_by: null })
    .eq('id', id);

  if (submissionError) {
    console.error('Restore submission error, re-hiding class:', submissionError);
    await admin
      .from('classes')
      .update({ deleted_at: row.deleted_at })
      .eq('submission_id', id);
    return { ok: false, status: 500, error: 'Failed to restore submission' };
  }

  revalidateTag(CLASS_FILTER_OPTIONS_TAG);

  return { ok: true, purgeAt: null };
}

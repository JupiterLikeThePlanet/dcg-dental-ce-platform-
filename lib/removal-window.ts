// Recovery window for removed (soft-deleted) listings. Pure date math, safe to
// import from client components. Server-side rules: lib/submission-removal.ts.
// Purge job: app/api/cleanup/purge-removed/route.ts.
export const RECOVERY_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

/** The moment a removed listing gets permanently deleted. */
export function purgeDateFor(deletedAt: string | Date): Date {
  return new Date(new Date(deletedAt).getTime() + RECOVERY_DAYS * DAY_MS);
}

export function isRecoverable(deletedAt: string | Date, now: Date = new Date()): boolean {
  return purgeDateFor(deletedAt).getTime() > now.getTime();
}

/** Rows removed before this ISO timestamp are past the recovery window. */
export function purgeCutoffIso(now: Date = new Date()): string {
  return new Date(now.getTime() - RECOVERY_DAYS * DAY_MS).toISOString();
}

/** e.g. "Nov 10, 2026" */
export function formatPurgeDate(deletedAt: string | Date): string {
  return purgeDateFor(deletedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

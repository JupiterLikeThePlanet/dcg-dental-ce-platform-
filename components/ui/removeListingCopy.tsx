import type { ReactNode } from 'react';
import { formatPurgeDate } from '@/lib/removal-window';

export const REMOVE_LISTING_TITLE = 'Remove this listing?';

/** Confirm-dialog body. `formatPurgeDate(new Date())` is the deadline if removal happens now. */
export function removeListingBody(audience: 'admin' | 'provider', status: string): ReactNode {
  const home = audience === 'admin' ? 'the dashboard' : 'your dashboard';
  const publicListings = status === 'approved' ? ' and from the public class listings' : '';
  const until = formatPurgeDate(new Date());

  return (
    <>
      It will disappear from {home}
      {publicListings}. You can restore it until <strong>{until}</strong>. After that it&apos;s permanently deleted.
    </>
  );
}

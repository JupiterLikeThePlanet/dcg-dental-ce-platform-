# Status

Last checked against the repo: 2026-11-01. Last commit on `main`: 2026-05-01 (attendance type merge).

## Done
- Auth: signup with email verification, login, logout, forgot / reset / change password
- Browse with search, filters (state, category, attendance type), sort, pagination
- Class detail page
- 4-step submit wizard, Stripe checkout, coupon bypass
- Edit and resubmit rejected submissions
- User dashboard with status tracking
- Admin dashboard: approve / reject, coupon management
- Attendance type field and badges
- Mobile responsive pass
- Lazy init for Stripe and Supabase server clients
- Staging Supabase project + Playwright suite (admin, dashboard, signup, submit-class)
- Audit fixes (2026-11-02, branch `docs-and-sql-update`, committed `9388036`, **not yet deployed**):
  - One Stripe payment = one submission (`checkout` + `/submit` reject a reused payment intent)
  - Checkout only accepts allowlisted listing fields (`lib/submission-fields.ts`)
  - Coupons: `expires_at` enforced, race-safe use counting, lookups via service role (`lib/coupons.ts`)
  - Dead `timezone` form field removed
  - Playwright creds moved to `TEST_*` env vars; generated files untracked
- Follow-ups (2026-11-02, same branch, not yet deployed): deleted stray `approve-route.ts`, removed `@supabase/auth-helpers-nextjs`, cleanup route accepts GET (cron-ready, not scheduled), ESLint config added (`npm run lint` works), success page no longer promises an email, submit pages use the `lib/` Stripe and Supabase helpers
- Security: four `SECURITY DEFINER` functions (`admin_delete_user`, `approve_submission`, `reject_submission`, `validate_coupon`) were callable by anyone. Locked down by `supabase/migrations/001_lock_down_definer_functions.sql`, applied and verified on staging and prod 2026-11-02.
- Staging schema matches prod (migration 002 added prod's title/description length checks to staging; structure fingerprints identical 2026-11-02).
- Schema in git: `supabase/migrations/000_baseline.sql` (staging dump, 2026-11-02) + `000_baseline_auth_trigger.sql`; `DATA-MODEL.md` reconciled against it.
- Fixed: `/login` rendered blank for logged-in users (auth deadlock in `Header.tsx` `onAuthStateChange`). Covered by `tests/e2e/auth.spec.ts`.
- Playwright specs updated for current UI (attendance type required, optional address/ZIP, filter tabs, template goes through payment gate, no double login).
- Launch check 2026-11-02 (code): tsc, lint (1 known warning), build, no module-level clients, no auth-helpers, no stray route files, no real keys in git, `.env*` ignored. Prod DB (read-only, counts only): RLS on all 4 tables, 2 admins, no test-named coupons, no live test classes, no `@example.com` users.
- Header no longer flashes guest UI when logged in (2026-11-03, branch `ui-upgrade`): root layout reads the session with `getUser()` and passes `initialUser` / `initialUserData` into `Header`. The `isClient` stub nav and the client `getSession()` on mount are gone. `onAuthStateChange` still updates after login; the callback stays synchronous (see `KNOWN-TRAPS.md`).
- `/classes` speed + feedback (2026-11-03, branch `ui-upgrade`, commits `788cc02`, `b06b697` + caching): the 4 queries now run in parallel (`page.tsx` shell + `components/classes/ClassResults.tsx`), skeleton cards show on every filter/sort/page change via a keyed `<Suspense>` (`ClassGridSkeleton.tsx`, shared with `loading.tsx`), cards select only the 10 columns they render. Measured vs staging, prod build, local: ~0.56s → ~0.32s per filter change; skeleton appears in ~0.2s. The result count line moved from under the heading to just above the grid. Fixed: mobile filter sheet sent `In-Person`/`Virtual` attendance values that don't exist in the DB. Follow-ups: optimistic controls + instant skeleton (`ClassesNavigation.tsx`, feedback ~215ms → ~50ms); state/category dropdown lists cached (`lib/class-filter-options.ts`, tag refreshed by the approve, checkout-edit, and cleanup routes; 5-min backstop), cards now arrive in ~0.35s. Tag refresh not yet exercised end to end (needs an approve on staging).
- Paywall and coupons hidden behind `PAYWALL_ENABLED` (off unless `"true"`). Free submit path in checkout, gate route refuses, Coupons tab hidden, tests follow the flag. Stripe/coupon code and policies kept. Playwright (chromium, prod build vs staging) 2026-11-02: submit-class + admin 46 passed / 6 skipped, dashboard 27 passed.

## Open
- [ ] Playwright (chromium, prod build, 2026-11-02): all specs pass except signup (staging can't send confirmation email, needs custom SMTP). Test data is already seeded. The `chromium-slow` project hasn't been run yet.
- [ ] Rotate the staging test passwords (old ones are in git history)
- [ ] Staging email: custom SMTP (signup returns 500 "Error sending confirmation email"). Check prod's SMTP too.
- [ ] Migration: unique index on `submissions.stripe_payment_id` (backs the one-payment rule at the DB level)
- [ ] Add `PAYWALL_ENABLED=false` to Vercel Production and Preview (the code already treats unset as off; this just makes the setting visible)
- [ ] Remove the legacy `pending_payment` status (prod has 0 rows as of 2026-11-02; staging has 1 test row). Needs a migration for the status CHECK plus code cleanup in checkout, success page, webhook, badges.
- [ ] Decide: should editing an approved listing go back to review? Today it updates the live class immediately.
- [ ] Decide: finish soft delete (nothing sets `deleted_at`; cleanup hard-deletes) or drop the column
- [ ] No recovery for "paid but didn't submit" beyond revisiting the same `/submit?paid=` URL
- [ ] Admin coupon UI can't set `expires_at` or `max_uses`
- [ ] Prod has 6 active coupons, all unlimited and never-expiring, and the "Users can view active coupons" policy lets any logged-in user list them from the browser = free listings for anyone who looks. Moot once the paywall is hidden; until then, consider deactivating unused codes.
- [ ] RLS: "Users can update own pending submissions" allows any column, so a user can edit payment fields (`stripe_payment_id`, `payment_amount`, `coupon_code`) on their own pending row from the browser. Can't self-approve. Fix with a column-limited policy or move edits server-side.
- [ ] Confirm Stripe live mode is set in Vercel Production and the live webhook works
- [ ] Confirm Supabase Auth Site URL / redirects use dcgdental.com
- [ ] Confirm the email template is live in prod, and whether custom SMTP is set
- [ ] Schedule the cleanup cron: settle soft delete first (it hard-deletes), then add `vercel.json` with `{"crons":[{"path":"/api/cleanup/expired-submissions","schedule":"0 9 * * *"}]}`, confirm `CRON_SECRET` in Vercel Production, and check the first run in Vercel logs.
- [ ] Toast.tsx `useEffect` missing-dependency lint warning (left alone; changing it could alter behavior)
- [ ] Write the non-technical launch guide for Russell
- [ ] Co-owner access handoff (GitHub, Vercel, Supabase, Stripe, DNS)
- [ ] Decide if numeric AGD codes are still needed

## Parked
- Approval / rejection emails
- Calendar view

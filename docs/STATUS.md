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

## Open
- [ ] Playwright (chromium, prod build, 2026-11-02): 72 passed, 5 failed, 4 skipped. Remaining failures: 4 need a `pending_payment` submission seeded for the test user; 1 is signup (staging can't send confirmation email, needs custom SMTP). The `chromium-slow` project hasn't been run yet.
- [ ] Rotate the staging test passwords (old ones are in git history)
- [ ] Staging email: custom SMTP (signup returns 500 "Error sending confirmation email"). Check prod's SMTP too.
- [ ] Migration: unique index on `submissions.stripe_payment_id` (backs the one-payment rule at the DB level)
- [ ] Hide the paywall and coupons on the live site (client wants free listings), ideally behind a flag. Don't delete Stripe/coupon code or the `coupon_codes` policies; they may come back.
- [ ] Decide: should editing an approved listing go back to review? Today it updates the live class immediately.
- [ ] Decide: finish soft delete (nothing sets `deleted_at`; cleanup hard-deletes) or drop the column
- [ ] No recovery for "paid but didn't submit" beyond revisiting the same `/submit?paid=` URL
- [ ] Admin coupon UI can't set `expires_at` or `max_uses`
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

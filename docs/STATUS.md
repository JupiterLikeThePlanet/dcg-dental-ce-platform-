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
- Audit fixes (2026-11-02, branch `docs-and-sql-update`, **not yet committed or deployed**):
  - One Stripe payment = one submission (`checkout` + `/submit` reject a reused payment intent)
  - Checkout only accepts allowlisted listing fields (`lib/submission-fields.ts`)
  - Coupons: `expires_at` enforced, race-safe use counting, lookups via service role (`lib/coupons.ts`)
  - Dead `timezone` form field removed
  - Playwright creds moved to `TEST_*` env vars; generated files untracked

## Open
- [ ] Run Playwright against staging with the audit fixes (staging DB was unreachable on 2026-11-02)
- [ ] Add `TEST_USER_*` / `TEST_ADMIN_*` to `.env.local`, and rotate the staging test passwords (old ones are in git history)
- [ ] Migration: unique index on `submissions.stripe_payment_id` (backs the one-payment rule at the DB level)
- [ ] Migration: drop any `authenticated` SELECT policy on `coupon_codes` (app no longer needs it). Verify against the baseline first.
- [ ] Decide: should editing an approved listing go back to review? Today it updates the live class immediately.
- [ ] Decide: finish soft delete (nothing sets `deleted_at`; cleanup hard-deletes) or drop the column
- [ ] `/submit/success` promises an approval email that doesn't exist. Change the copy or build the email.
- [ ] No recovery for "paid but didn't submit" beyond revisiting the same `/submit?paid=` URL
- [ ] Admin coupon UI can't set `expires_at` or `max_uses`
- [ ] Commit the real DB schema. `schema.sql`, `types/database.ts`, and migrations are all empty.
- [ ] Confirm RLS is enabled on `users` in prod
- [ ] Confirm Stripe live mode is set in Vercel Production and the live webhook works
- [ ] Confirm Supabase Auth Site URL / redirects use dcgdental.com
- [ ] Confirm the email template is live in prod, and whether custom SMTP is set
- [ ] Schedule the cleanup route. No `vercel.json` cron exists, and the route only accepts POST while Vercel Cron sends GET.
- [ ] Delete the stray `approve-route.ts`
- [ ] Remove `@supabase/auth-helpers-nextjs` from package.json
- [ ] Write the non-technical launch guide for Russell
- [ ] Co-owner access handoff (GitHub, Vercel, Supabase, Stripe, DNS)
- [ ] Decide if numeric AGD codes are still needed

## Parked
- Approval / rejection emails
- Calendar view

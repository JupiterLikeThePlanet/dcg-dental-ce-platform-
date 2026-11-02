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

## Open
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

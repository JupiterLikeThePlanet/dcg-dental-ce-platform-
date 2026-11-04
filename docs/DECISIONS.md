# Decisions

Settled questions. Don't reopen these unless Jupiter does.

| Decision | Why |
|---|---|
| $5 one-time listing fee | Spam filter more than revenue |
| Coupons bypass Stripe completely | Lets the client comp listings and run promos without fake charges |
| Manual admin approval for everything | Client wants control over quality |
| Link out to registration | Keeps scope small. We're a directory, not a booking system. |
| Supabase for DB + Auth | One service, RLS, fast to build on a $5K budget |
| Supabase built-in auth emails | No extra service to pay for or maintain |
| Separate staging and prod Supabase projects | Playwright tests are destructive |
| Removing a listing is a soft delete with a 7-day restore, then a hard delete | A misclick or a provider's change of heart can be undone, and we don't keep dead rows forever. `deleted_at` lives on both `submissions` and `classes`, a daily cron purges after 7 days, and the purge is logged in Vercel. Decided and built 2026-11-03 (PR #22). |
| Providers can't restore a listing an admin removed | An admin removal is usually a takedown (spam, policy). `submissions.deleted_by` records who removed it. |
| One-year retention cleanup | Old listings are clutter. It hard-deletes the class and the submission with no recovery window. It isn't scheduled, unlike the soft-delete purge. `TODO: decide` whether to schedule it. |
| Pay (or coupon) before the form | Payment gate comes first, so a submission row only exists once it's paid for. One payment = one listing. |
| Admins submit for free | Admin submissions skip the payment gate and go straight to `pending` |
| Craigslist look | Client asked for simple and functional |
| `sessionStorage` for edit / template data | Simple handoff from dashboard to the wizard without a new route |
| AGD subject area names as categories | Matches how dentists already think about CE credit |

Add a row when a new decision gets made. One line of "why" is enough.

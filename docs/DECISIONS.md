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
| Soft delete on `classes` | Keeps history, lets admin undo. **Only half built:** the column and the read filters exist, but nothing sets `deleted_at` and there's no undo UI. `TODO: decide` whether to finish it or drop it. |
| One-year retention cleanup | Old listings are clutter. It hard-deletes both the class and the submission, which conflicts with the soft-delete row above. |
| Pay (or coupon) before the form | Payment gate comes first, so a submission row only exists once it's paid for. One payment = one listing. |
| Admins submit for free | Admin submissions skip the payment gate and go straight to `pending` |
| Craigslist look | Client asked for simple and functional |
| `sessionStorage` for edit / template data | Simple handoff from dashboard to the wizard without a new route |
| AGD subject area names as categories | Matches how dentists already think about CE credit |

Add a row when a new decision gets made. One line of "why" is enough.

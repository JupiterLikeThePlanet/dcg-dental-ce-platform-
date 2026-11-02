# Architecture

Map of where things live. Verified against the repo on 2026-11-01.

## Pages (`app/`)

| Route | What it is |
|---|---|
| `/` | Homepage |
| `/classes` | Browse: search, filter (state, category, attendance type), sort, paginate 20/page |
| `/classes/[id]` | Class detail |
| `/submit` | Payment gate first (`PaymentGate`), then the 4-step wizard (`SubmitClassForm`). `SubmitClassGate` picks which to show. Verifies `?paid=<session>` server side and ignores sessions already used by a submission. |
| `/submit/success` | Post-submit landing (`?method=admin\|coupon\|edit`). For legacy `pending_payment` edits paid via Stripe (`?session_id=`), flips the row to `pending` if the webhook hasn't yet. |
| `/dashboard` | User's own submissions and status |
| `/dashboard/submissions/[id]` | User submission detail, edit / resubmit |
| `/admin` | Admin tabs: submissions + coupons. Checks `is_admin` server side. |
| `/admin/submissions/[id]` | Admin review, approve / reject |
| `/login`, `/signup` | Auth |
| `/forgot-password`, `/update-password`, `/change-password` | Password flows |

## API routes (`app/api/`)

| Route | Job |
|---|---|
| `checkout` | Writes new and edited submissions. New: admin (free), coupon (claims a use), or a verified Stripe session (one submission per payment). Edit: by original status (see below). Only fields in `lib/submission-fields.ts` are accepted from the client. |
| `payment-gate` | Before the form: validates a coupon (read only, no use counted yet) or creates the $5 Stripe Checkout session with `metadata.userId` only |
| `webhooks/stripe` | `checkout.session.completed`: sets `pending` only when `metadata.submissionId` exists (legacy `pending_payment` edits). Payment-gate sessions are skipped on purpose. |
| `admin/submissions/[id]/approve` | Sets `approved`, copies row into `classes` (hard-deletes the class if the status update fails) |
| `admin/submissions/[id]/reject` | Sets `rejected`. `rejection_reason` is optional. |
| `admin/coupons`, `admin/coupons/[id]` | List, create, delete. No update. Admin only. |
| `auth/logout`, `auth/update-password` | Auth helpers |
| `cleanup/expired-submissions` | GET (for Vercel Cron; **not scheduled yet**, no `vercel.json`) or POST (manual), both with `Authorization: Bearer $CRON_SECRET`. Hard-deletes approved submissions and their classes once `end_date` is over a year old. |

Plus `app/auth/callback/route.ts`: email verification. Exchanges the code and upserts the `public.users` row.

## Clients (`lib/`)

| File | Use it for |
|---|---|
| `lib/supabase.ts` | Browser client singleton. Client Components only. |
| `createServerClient` from `@supabase/ssr` | Server Components and route handlers, built per request with `cookies()` |
| `lib/supabase-admin.ts` → `getSupabaseAdmin()` | Service role. Server only. Bypasses RLS. Use sparingly. |
| `lib/stripe-server.ts` → `getStripeServer()` | Stripe server SDK. Call inside handlers. |
| `lib/stripe.ts` → `getStripe()` | Stripe.js in the browser |
| `lib/coupons.ts` | `getUsableCoupon()`, `claimCouponUse()`. All coupon checks go through here. Server only. |
| `lib/submission-fields.ts` | `pickSubmissionFields()`, the allowlist of user-editable listing fields |

## Middleware

`middleware.ts` refreshes the Supabase session cookie on every non-static route. It doesn't do role checks. Admin checks happen in the page or route.

## Components

- `components/classes/` browse UI (ClassCard, ClassGrid, FilterBar, SortControls, Pagination)
- `components/submit/` the wizard and payment gate
- `components/dashboard/` user side
- `components/admin/` admin side
- `components/ui/` Spinner, Toast, LoadingOverlay

## Edit flow detail

- `components/dashboard/UserSubmissionDetail.tsx` writes `sessionStorage.submissionEdit` and goes to `/submit?edit=true`, or writes `submissionTemplate` and goes to `/submit?template=true`. The form reads and clears the key.
- Edit skips the payment gate. Template ("submit another like this") is a new submission and goes through the gate.
- `checkout` decides new vs update based on `originalSubmissionId`. On update, by original status:
  - `rejected` / `pending` → update and reset to `pending`
  - `approved` → update the submission **and the live `classes` row** directly (no re-review)
  - `pending_payment` → update; then save only (`editClassOnly`), claim a coupon, or start a Stripe session with `metadata.submissionId`

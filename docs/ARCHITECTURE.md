# Architecture

Map of where things live. Verified against the repo on 2026-11-01.

## Pages (`app/`)

| Route | What it is |
|---|---|
| `/` | Homepage |
| `/classes` | Browse: search, filter (state, category, attendance type), sort, paginate 20/page |
| `/classes/[id]` | Class detail |
| `/submit` | 4-step submit wizard, gated by `SubmitClassGate` / `PaymentGate` |
| `/submit/success` | Post-checkout landing. Flips `pending_payment` to `pending` if the webhook hasn't yet. |
| `/dashboard` | User's own submissions and status |
| `/dashboard/submissions/[id]` | User submission detail, edit / resubmit |
| `/admin` | Admin tabs: submissions + coupons. Checks `is_admin` server side. |
| `/admin/submissions/[id]` | Admin review, approve / reject |
| `/login`, `/signup` | Auth |
| `/forgot-password`, `/update-password`, `/change-password` | Password flows |

## API routes (`app/api/`)

| Route | Job |
|---|---|
| `checkout` | New and edited submissions. Coupon path skips Stripe. |
| `payment-gate` | Validates coupon / payment before the form |
| `webhooks/stripe` | `checkout.session.completed` sets status to `pending` |
| `admin/submissions/[id]/approve` | Sets `approved`, copies row into `classes` |
| `admin/submissions/[id]/reject` | Sets `rejected`, requires `rejection_reason` |
| `admin/coupons`, `admin/coupons/[id]` | Coupon CRUD, admin only |
| `auth/logout`, `auth/update-password` | Auth helpers |
| `cleanup/expired-submissions` | POST with `Authorization: Bearer $CRON_SECRET` |

Plus `app/auth/callback/route.ts`: email verification. Exchanges the code and upserts the `public.users` row.

## Clients (`lib/`)

| File | Use it for |
|---|---|
| `lib/supabase.ts` | Browser client singleton. Client Components only. |
| `createServerClient` from `@supabase/ssr` | Server Components and route handlers, built per request with `cookies()` |
| `lib/supabase-admin.ts` → `getSupabaseAdmin()` | Service role. Server only. Bypasses RLS. Use sparingly. |
| `lib/stripe-server.ts` → `getStripeServer()` | Stripe server SDK. Call inside handlers. |
| `lib/stripe.ts` → `getStripe()` | Stripe.js in the browser |

## Middleware

`middleware.ts` refreshes the Supabase session cookie on every non-static route. It doesn't do role checks. Admin checks happen in the page or route.

## Components

- `components/classes/` browse UI (ClassCard, ClassGrid, FilterBar, SortControls, Pagination)
- `components/submit/` the wizard and payment gate
- `components/dashboard/` user side
- `components/admin/` admin side
- `components/ui/` Spinner, Toast, LoadingOverlay

## Edit flow detail

- Edit and template data pass to the form through `sessionStorage` (`submissionTemplate`, plus `?edit=` / `?template=` params)
- `checkout` decides new vs update based on `originalSubmissionId`

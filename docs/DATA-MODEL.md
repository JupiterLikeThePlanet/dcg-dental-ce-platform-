# Data Model

> **Warning:** the schema is not in version control. `schema.sql` and `types/database.ts` are empty, and `supabase/` is gitignored with no migrations in it. This file was rebuilt from the April 2026 notes plus columns seen in the code. Treat it as a strong hint, not truth. `TODO: verify` against the live staging schema and commit a real dump (see the `dcg-migration` skill).

## Tables

### `auth.users`
Managed by Supabase Auth. Never write to it directly.

### `public.users`
Profile row. `id` must equal the matching `auth.users.id`.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | references `auth.users(id)` |
| email | text unique | |
| full_name | text | copied from auth metadata on signup |
| organization | text | |
| phone | text | |
| is_admin | boolean | default false. This is the only role flag. |
| created_at / updated_at | timestamptz | |

Created two ways, on purpose: a DB trigger on signup, and an upsert in `app/auth/callback/route.ts`. Keep both.

### `submissions`
Everything a provider sends in, any status.

- Content: `title`, `description`, `category`, `attendance_type`
- When: `start_date`, `end_date`, `start_time`, `end_time`
- Where: `address_line1`, `address_line2`, `city`, `state`, `zip_code`
- Who: `instructor_name`, `provider_name`, `contact_email`, `contact_phone`
- Details: `price`, `ce_credits`, `registration_url`, `image_url` (the form fills in a stock Unsplash image if left blank, `SubmitClassForm.tsx`)
- Geo: `latitude`, `longitude`. The approve route copies them to `classes`, but nothing in the app writes them. `TODO: verify` they exist in the schema.
- Workflow: `submitted_by` (uuid → users, cascade), `status`, `stripe_payment_id`, `payment_amount` (`TODO: verify` default; code always sets 5.00 or 0 explicitly), `coupon_code`, `reviewed_by`, `reviewed_at`, `rejection_reason`
- `created_at`, `updated_at`

`status` enum: `pending_payment` | `pending` | `approved` | `rejected`

`stripe_payment_id` is one payment per submission. `app/api/checkout/route.ts` refuses a payment intent that's already on a row. There's no unique index backing this yet (see `docs/STATUS.md`).

Users can only set the listing fields in `lib/submission-fields.ts`. Checkout drops everything else from the request body, so `status`, `submitted_by`, payment columns, etc. are always set server side.

### `classes`
Live listings. Same content columns as `submissions` (including `latitude` / `longitude`), plus:

- `status` text. The approve route sets `'approved'`; browse filters on it.
- `posted_by` uuid → users (cascade)
- `is_admin_post` boolean
- `submission_id` uuid → submissions (cascade)
- `deleted_at` timestamptz. Soft-delete column. Every public query filters `.is('deleted_at', null)`, but **nothing in the app sets it today**. The cleanup route hard-deletes (see `docs/DECISIONS.md`).

### `coupon_codes`

| Column | Notes |
|---|---|
| id | used by `DELETE /api/admin/coupons/[id]` |
| code | unique. Admin UI uppercases and caps at 8 chars. |
| max_uses | null means unlimited. Admin UI always creates with null. |
| current_uses | default 0. Incremented with a compare-and-set in `lib/coupons.ts` so concurrent redemptions can't overshoot `max_uses`. |
| expires_at | Enforced by `isCouponUsable()` in `lib/coupons.ts`. The admin UI can't set it yet. |
| is_active | default true |
| notes | `TODO: verify` |

All coupon reads go through the service role (`lib/coupons.ts`), so `coupon_codes` doesn't need a SELECT policy for regular users.

## Relationships

- Deleting a user cascades to their submissions and classes
- Deleting a submission cascades to its class
- There's an `admin_delete_user(email)` SQL function for removing spam accounts. `TODO: verify` it exists in prod.

## RLS

- RLS is on for all public tables. `TODO: verify` it's on for `users` in prod (it was disabled once during debugging).
- `users` SELECT policy: any authenticated user can read. This is what lets the admin check work during login.
- Service role (`getSupabaseAdmin`) skips RLS. Only use it where the code already does (webhook, cleanup, admin ops, coupon lookups, checkout writes).
- `coupon_codes`: if a policy lets `authenticated` SELECT it, any logged-in user can list every code from the browser. The app no longer needs that policy. `TODO: verify` and drop it via `dcg-migration`.

## Rules for queries

- Read this file or the real schema before writing a query. Don't guess a column name.
- Public browse reads `classes` only, with all three filters: `status = 'approved'`, `deleted_at is null`, and `end_date` null or today or later (`app/classes/page.tsx`).
- If `types/database.ts` ever gets generated, use those types instead of hand-written interfaces.

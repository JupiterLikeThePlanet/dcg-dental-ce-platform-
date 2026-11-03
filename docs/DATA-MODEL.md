# Data Model

Source of truth: `supabase/migrations/`. `000_baseline.sql` is a schema dump from staging (2026-11-02), with `000_baseline_auth_trigger.sql` for the signup trigger, then numbered migrations on top. Staging and prod were verified structurally identical on 2026-11-02. If this file and the migrations disagree, the migrations win. (`schema.sql` and `types/database.ts` at the repo root are still empty and unused.)

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

Created two ways, on purpose: the `on_auth_user_created` trigger on `auth.users` (runs `handle_new_user()`, inserts `id`, `email`, `full_name`), and an upsert in `app/auth/callback/route.ts`. Keep both.

### `submissions`
Everything a provider sends in, any status.

- Content: `title` (max 100 chars, DB check), `description` (max 1000 chars, DB check), `category`, `attendance_type`
- When: `start_date`, `end_date`, `start_time`, `end_time`
- Where: `address_line1`, `address_line2`, `city`, `state`, `zip_code`. `address_line1` and `zip_code` are NOT NULL in the DB even though the form treats street address as optional; the form sends `''` when blank.
- Who: `instructor_name`, `provider_name`, `contact_email`, `contact_phone`
- Details: `price`, `ce_credits`, `registration_url`, `image_url` (the form fills in a stock Unsplash image if left blank, `SubmitClassForm.tsx`)
- Geo: `latitude`, `longitude` (numeric, nullable). They exist in both tables. The approve route copies them to `classes`, but nothing in the app writes them.
- Workflow: `submitted_by` (uuid → users, cascade), `status`, `stripe_payment_id`, `payment_amount` (DB default 5.00; code always sets 5.00 or 0 explicitly), `coupon_code` (what the app writes), `used_coupon_code` (legacy, unused by the app), `reviewed_by`, `reviewed_at`, `rejection_reason`
- `created_at`, `updated_at`

`status` enum: `pending_payment` | `pending` | `approved` | `rejected`

`stripe_payment_id` is one payment per submission. `app/api/checkout/route.ts` refuses a payment intent that's already on a row. There's no unique index backing this yet (see `docs/STATUS.md`).

Users can only set the listing fields in `lib/submission-fields.ts`. Checkout drops everything else from the request body, so `status`, `submitted_by`, payment columns, etc. are always set server side.

### `classes`
Live listings. Same content columns as `submissions` (including `latitude` / `longitude`), plus:

- `status` uses the same `submission_status` enum, default `'approved'`. The approve route sets it explicitly; browse and the public RLS policy filter on it.
- `posted_by` uuid → users (cascade)
- `is_admin_post` boolean, default false. The approve route always writes false.
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
| notes | free text, nullable. Not used by the app or admin UI. |

All coupon reads go through the service role (`lib/coupons.ts`), so `coupon_codes` doesn't need a SELECT policy for regular users.

## Relationships

- Deleting a user cascades to their submissions and classes. `public.users.id` also cascades from `auth.users`.
- Deleting an admin sets `submissions.reviewed_by` and `coupon_codes.created_by` to null (no cascade)
- Deleting a submission cascades to its class
- There's an `admin_delete_user(email)` SQL function for removing spam accounts (exists in both projects). Run it from the SQL editor only.

## SQL functions

All `SECURITY DEFINER` (they bypass RLS) except `update_updated_at`. Verified identical in staging and prod on 2026-11-02.

| Function | Who can call it | Notes |
|---|---|---|
| `is_admin()` | everyone | Used by RLS policies. Must stay callable. |
| `handle_new_user()` | trigger only | `on_auth_user_created` on `auth.users` |
| `update_updated_at()` | trigger only | `updated_at` triggers on users, submissions, classes |
| `admin_delete_user(email)` | SQL editor + service role | No admin check inside. Locked by migration 001. |
| `approve_submission`, `reject_submission` | SQL editor + service role | Not used by the app (API routes do this). Locked by 001. Out of date: `approve_submission` doesn't copy `attendance_type` or set `classes.submission_id`. Don't start using it without fixing that. |
| `validate_coupon(code)` | SQL editor + service role | Not used by the app (`lib/coupons.ts` does this). Locked by 001. |

Any new `SECURITY DEFINER` function must either check `is_admin()` inside or `revoke execute ... from public, anon, authenticated`. Postgres and Supabase let everyone call new functions through `/rest/v1/rpc/` by default.

## RLS

- RLS is on for all four public tables in both staging and prod, `users` included (verified 2026-11-02).
- `users` SELECT: users read their own row; admins read all rows via `is_admin()` (a `SECURITY DEFINER` function, so the admin check doesn't recurse into RLS). There is no "any authenticated user can read" policy.
- Service role (`getSupabaseAdmin`) skips RLS. Only use it where the code already does (webhook, cleanup, admin ops, coupon lookups, checkout writes).
- `coupon_codes`: the "Users can view active coupons" policy lets any logged-in user list active codes from the browser. The app no longer needs it, but it stays for now: the plan is to hide paywall and coupons behind a flag, not remove them (see `STATUS.md`).

## Rules for queries

- Read this file or the real schema before writing a query. Don't guess a column name.
- Public browse reads `classes` only, with all three filters: `status = 'approved'`, `deleted_at is null`, and `end_date` null or today or later (`app/classes/page.tsx`).
- If `types/database.ts` ever gets generated, use those types instead of hand-written interfaces.

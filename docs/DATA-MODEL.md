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
- Details: `price`, `ce_credits`, `registration_url`, `image_url`
- Workflow: `submitted_by` (uuid → users, cascade), `status`, `stripe_payment_id`, `payment_amount` (default 5.00), `used_coupon_code`, `reviewed_by`, `reviewed_at`, `rejection_reason`
- `created_at`, `updated_at`

`status` enum: `pending_payment` | `pending` | `approved` | `rejected`

### `classes`
Live listings. Same content columns as `submissions`, plus:

- `posted_by` uuid → users (cascade)
- `is_admin_post` boolean
- `submission_id` uuid → submissions (cascade)
- `deleted_at` timestamptz. Soft delete. Every public query must filter `.is('deleted_at', null)`.

### `coupon_codes`

| Column | Notes |
|---|---|
| code | unique |
| max_uses | null means unlimited |
| current_uses | default 0 |
| expires_at | |
| is_active | default true |
| notes | |

## Relationships

- Deleting a user cascades to their submissions and classes
- Deleting a submission cascades to its class
- There's an `admin_delete_user(email)` SQL function for removing spam accounts. `TODO: verify` it exists in prod.

## RLS

- RLS is on for all public tables. `TODO: verify` it's on for `users` in prod (it was disabled once during debugging).
- `users` SELECT policy: any authenticated user can read. This is what lets the admin check work during login.
- Service role (`getSupabaseAdmin`) skips RLS. Only use it where the code already does (webhook, cleanup, admin ops).

## Rules for queries

- Read this file or the real schema before writing a query. Don't guess a column name.
- Public browse queries filter `status = 'approved'` (submissions) or `deleted_at is null` (classes), and hide past `end_date`.
- If `types/database.ts` ever gets generated, use those types instead of hand-written interfaces.

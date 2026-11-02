# Known Traps

Mistakes Claude (and humans) have already made on this project, plus the ones it's likely to make. Check this list before writing code.

## Things that look right but aren't

| Trap | Truth |
|---|---|
| Importing `@supabase/auth-helpers-nextjs` | Deprecated and uninstalled. Use `@supabase/ssr`. |
| `new Stripe(...)` or `createClient(...)` at the top of a route file | Breaks Vercel builds ("supabaseUrl is required", "Neither apiKey nor config.authenticator provided"). Create inside the handler. |
| Next 15-only APIs (`after()`, `connection()`, `use cache`, async-only request APIs) | This is Next 14 (14.2). `await cookies()` and Promise-typed `params` are fine and already the house style (see `CONVENTIONS.md`), but don't reach for APIs that don't exist in 14. |
| Spreading the request body into a DB write (`...submissionData`) | Run it through `pickSubmissionFields()` first. Raw spreads let a user set `status`, `deleted_at`, etc. |
| Checking coupons with the user's Supabase client | Use `lib/coupons.ts`. It checks expiry and counts uses safely. |
| Creating a `SECURITY DEFINER` SQL function and moving on | Everyone, logged out included, can call it via `/rest/v1/rpc/`. Check `is_admin()` inside or revoke execute. See migration 001. |
| Writing `pages/` or `getServerSideProps` | App Router only |
| Tailwind v4 syntax (`@import "tailwindcss"`, `@theme`) | Repo is on Tailwind v3 |
| Naming an API file `approve-route.ts` | Next only routes `route.ts`. A stray `app/admin/submissions/[id]/approve/approve-route.ts` used to exist and did nothing (deleted 2026-11-02). |
| Assuming an email service exists | None in code. Auth emails come from Supabase. |
| Assuming `types/database.ts` or `schema.sql` has the schema | Both are empty files. The real schema is in `supabase/migrations/` (baseline + numbered migrations). |
| "AGD codes" as a separate field | Categories already use AGD subject area names. There are no numeric codes in the DB. `TODO: verify` with Jupiter if numeric codes are still wanted. |

## Bugs we already fixed (don't reintroduce)

- **Admin couldn't log in:** `public.users.id` didn't match `auth.users.id`, and RLS blocked the `is_admin` read. Fix: matching UUIDs + an RLS path for the admin read (today: "Admins can view all users" using `is_admin()`).
- **`public.users` row missing after signup:** fixed by trigger + upsert in the auth callback. Keep both.
- **Supabase "lock was released because another request stole it":** too many browser clients. Fix: singleton in `lib/supabase.ts`.
- **Vercel build failures:** module-level client init. Fixed with lazy init.

## Habits that cause hallucinations here

- Guessing column names. Read `docs/DATA-MODEL.md` first.
- Claiming a test passed without running it
- Saying a Supabase dashboard setting is on. You can't see the dashboard. Say "verify in dashboard" instead.
- Treating staging and prod as the same. They drift.
- Answering "it's done" from chat history. Check the code or `docs/STATUS.md`.

When unsure, say "I don't know, here's how to check" instead of filling the gap.

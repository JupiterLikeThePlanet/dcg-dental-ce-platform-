# Known Traps

Mistakes Claude (and humans) have already made on this project, plus the ones it's likely to make. Check this list before writing code.

## Things that look right but aren't

| Trap | Truth |
|---|---|
| Importing `@supabase/auth-helpers-nextjs` | Deprecated. Still in package.json, imported nowhere. Use `@supabase/ssr`. |
| `new Stripe(...)` or `createClient(...)` at the top of a route file | Breaks Vercel builds ("supabaseUrl is required", "Neither apiKey nor config.authenticator provided"). Create inside the handler. |
| Next 15 patterns (async `cookies()`, `params` as Promise everywhere) | This is Next 14. `cookies()` is sync here. |
| Writing `pages/` or `getServerSideProps` | App Router only |
| Tailwind v4 syntax (`@import "tailwindcss"`, `@theme`) | Repo is on Tailwind v3 |
| Naming an API file `approve-route.ts` | Next only routes `route.ts`. A stray `app/admin/submissions/[id]/approve/approve-route.ts` already exists and does nothing. |
| Assuming an email service exists | None in code. Auth emails come from Supabase. |
| Assuming `types/database.ts` or `schema.sql` has the schema | Both are empty files |
| Assuming migrations live in `supabase/migrations` | Folder is empty and gitignored |
| "AGD codes" as a separate field | Categories already use AGD subject area names. There are no numeric codes in the DB. `TODO: verify` with Jupiter if numeric codes are still wanted. |

## Bugs we already fixed (don't reintroduce)

- **Admin couldn't log in:** `public.users.id` didn't match `auth.users.id`, and RLS blocked the `is_admin` read. Fix: matching UUIDs + "authenticated can read users" policy.
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

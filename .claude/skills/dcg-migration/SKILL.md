---
name: dcg-migration
description: Write and apply a Supabase schema change for DCG Dental safely (new column, table, index, RLS policy, function, trigger). Use for any database structure change, and to capture the current schema into the repo.
---

# Schema migrations

The schema isn't in git yet, so step 0 matters until it's done once.

## 0. First run only: capture the baseline
- Ask Jupiter to export the staging schema (Supabase CLI `supabase db dump --schema public` or the SQL editor). Don't connect to prod to do it.
- Save as `supabase/migrations/000_baseline.sql`
- Propose removing `supabase/` from `.gitignore` (keep `supabase/.temp` and `supabase/.branches` ignored). Ask before editing `.gitignore`.
- Diff the baseline against `docs/DATA-MODEL.md` and fix the doc

## 1. Write the SQL
- New file: `supabase/migrations/NNN_short_description.sql`, next number in sequence
- Idempotent where possible: `add column if not exists`, `create index if not exists`, `drop policy if exists` before `create policy`
- Columns that appear on listings go on both `submissions` and `classes`
- Any new table: `alter table ... enable row level security;` plus explicit policies in the same file
- Comment the top of the file: what, why, and how to roll back

## 2. Review gate
Show Jupiter the SQL. Call out:
- Anything destructive (`drop`, `delete`, type changes that lose data)
- RLS impact: who can read and write after this
- Whether app code must ship before or after

Wait for a yes.

## 3. Apply to staging
- Jupiter runs it in the staging SQL editor (`duqgdsrvaxucbckqkygo`), or approves you running it via CLI against staging
- Verify with a `select` on `information_schema.columns` or `pg_policies`
- Run the relevant Playwright specs

## 4. Apply to prod
- Only after a separate explicit yes for prod
- Same file, no edits between staging and prod
- Verify the same way

## 5. Close out
- Update `docs/DATA-MODEL.md`
- Regenerate `types/database.ts` if the team has started using generated types
- Note the migration in `docs/STATUS.md` if it was on the open list

## Never
- Disable RLS as a fix
- Edit a migration that already ran in prod. Write a new one.
- Run anything on prod "just to check"

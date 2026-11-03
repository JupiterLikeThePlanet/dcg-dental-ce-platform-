---
name: dcg-migration
description: Write and apply a Supabase schema change for DCG Dental safely (new column, table, index, RLS policy, function, trigger). Use for any database structure change, and to capture the current schema into the repo.
---

# Schema migrations

Staging and prod are separate projects (not clones). Their structure must stay identical; their data differs on purpose.

## 0. Baseline (done 2026-11-02)
- `supabase/migrations/000_baseline.sql`: `pg_dump --schema-only --schema=public --no-owner --no-privileges` from staging, via the Session pooler (`aws-1-us-east-2.pooler.supabase.com:5432`, user `postgres.<project_ref>`). Jupiter runs it in their own terminal; the password never goes through chat.
- `000_baseline_auth_trigger.sql`: the `auth.users` signup trigger, which a `public`-only dump misses.
- To re-dump later, use the same command with `-f` and let `pg_dump` prompt for the password.

## How to reach each database
- Staging: the `supabase-staging` MCP (`apply_migration` for DDL, `execute_sql` to verify).
- Prod: the `supabase-prod` MCP is `read_only=true` on purpose. Use it to verify only. Jupiter applies prod changes by pasting the SQL into the prod SQL editor.

## 1. Write the SQL
- New file: `supabase/migrations/NNN_short_description.sql`, next number in sequence
- Idempotent where possible: `add column if not exists`, `create index if not exists`, `drop policy if exists` before `create policy`
- Columns that appear on listings go on both `submissions` and `classes`
- Any new table: `alter table ... enable row level security;` plus explicit policies in the same file
- Any new `SECURITY DEFINER` function: check `is_admin()` inside, or `revoke execute ... from public, anon, authenticated` in the same file (see 001)
- Comment the top of the file: what, why, and how to roll back

## 2. Review gate
Show Jupiter the SQL. Call out:
- Anything destructive (`drop`, `delete`, type changes that lose data)
- RLS impact: who can read and write after this
- Whether app code must ship before or after

Wait for a yes.

## 3. Apply to staging
- After Jupiter's yes, apply via the staging MCP `apply_migration` (`duqgdsrvaxucbckqkygo`), or Jupiter pastes it into the staging SQL editor
- Verify with a `select` on `information_schema.columns` or `pg_policies`
- Run the relevant Playwright specs

## 4. Apply to prod
- Only after a separate explicit yes for prod
- Same file, no edits between staging and prod. Jupiter pastes it into the prod SQL editor (if a copy-paste mangles the comment header, paste just the statements).
- Verify the same way through the read-only prod MCP
- Then compare structure fingerprints (md5 of columns, policies, indexes, constraints, triggers, function grants) on both projects; they should match

## 5. Close out
- Update `docs/DATA-MODEL.md`
- Regenerate `types/database.ts` if the team has started using generated types
- Note the migration in `docs/STATUS.md` if it was on the open list

## Never
- Disable RLS as a fix
- Edit a migration that already ran in prod. Write a new one.
- Run anything on prod "just to check"

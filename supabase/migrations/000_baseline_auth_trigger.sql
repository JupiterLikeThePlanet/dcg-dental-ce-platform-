-- 000_baseline_auth_trigger
--
-- Companion to 000_baseline.sql. The baseline dump only covers the `public`
-- schema, so it misses this trigger, which lives on Supabase's `auth.users`
-- table. It creates the public.users profile row on every signup.
-- Captured from staging 2026-11-02 (identical in prod).
-- Safe to re-run: CREATE OR REPLACE.

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

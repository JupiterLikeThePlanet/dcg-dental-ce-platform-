-- ============================================================
-- Migration: Auto-create public.users profile on signup
-- ============================================================
-- This trigger fires whenever a new row is inserted into
-- auth.users (i.e. every time someone signs up, including
-- OAuth, magic link, and email/password).
--
-- It creates a matching row in public.users so that the app
-- always has a profile to read is_admin and full_name from.
--
-- HOW TO RUN:
--   1. Go to your Supabase project (staging first, then production)
--   2. Click SQL Editor in the left sidebar
--   3. Paste this entire file and click Run
--
-- This is SAFE to run multiple times — IF EXISTS / OR REPLACE
-- prevent duplicate triggers.
-- ============================================================

-- Step 1: Create the function that inserts into public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER           -- runs as the DB owner, bypasses RLS
SET search_path = public   -- prevents search_path hijacking
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    false
  )
  ON CONFLICT (id) DO NOTHING;  -- safe if profile already exists
  RETURN NEW;
END;
$$;

-- Step 2: Attach the trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

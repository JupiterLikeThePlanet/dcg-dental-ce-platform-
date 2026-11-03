-- 001_lock_down_definer_functions
--
-- What: stop anon and logged-in users from calling four SECURITY DEFINER
--       functions through the Supabase API (/rest/v1/rpc/...).
-- Why:  they run as the table owner (bypassing RLS), have no admin check, and
--       Postgres/Supabase grant EXECUTE to everyone by default. Anyone with the
--       public anon key could delete any user, approve or reject any submission,
--       or burn coupon uses. The app does not call any of them (approve/reject
--       go through API routes using the service role).
-- Who can still run them: the SQL editor (postgres) and the service role.
-- Not touched: is_admin() (RLS policies need it), handle_new_user() (trigger),
--       update_updated_at() (trigger, not SECURITY DEFINER).
-- Note: CREATE OR REPLACE keeps these revokes. DROP + CREATE does not; re-run
--       this file if a function is ever dropped and recreated.
--
-- Rollback (restores the old, unsafe state):
--   grant execute on function public.admin_delete_user(text) to public, anon, authenticated;
--   grant execute on function public.approve_submission(uuid, uuid) to public, anon, authenticated;
--   grant execute on function public.reject_submission(uuid, uuid, text) to public, anon, authenticated;
--   grant execute on function public.validate_coupon(text) to public, anon, authenticated;

revoke execute on function public.admin_delete_user(text)             from public, anon, authenticated;
revoke execute on function public.approve_submission(uuid, uuid)      from public, anon, authenticated;
revoke execute on function public.reject_submission(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.validate_coupon(text)               from public, anon, authenticated;

grant execute on function public.admin_delete_user(text)             to service_role;
grant execute on function public.approve_submission(uuid, uuid)      to service_role;
grant execute on function public.reject_submission(uuid, uuid, text) to service_role;
grant execute on function public.validate_coupon(text)               to service_role;

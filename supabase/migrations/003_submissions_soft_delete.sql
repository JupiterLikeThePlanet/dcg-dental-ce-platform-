-- 003_submissions_soft_delete
--
-- What: soft-delete columns on submissions.
--   deleted_at  null = live; set = removed (hidden from dashboards, recoverable for 7 days)
--   deleted_by  who removed it (admin or owner). Lets the app stop a provider from
--               restoring a listing an admin removed. Set to null if that user is deleted.
-- Why:  admins and providers can remove listings. The app hides removed rows, offers
--       restore for 7 days, then a daily cron hard-deletes them (cascade removes the class).
--       classes.deleted_at already exists (000_baseline.sql); the app sets it alongside.
-- RLS:  unchanged. Writes go through server routes using the service role.
-- Order: safe to apply before the app code ships (new nullable columns, nothing reads them yet).
-- Rollback:
--   drop index if exists public.idx_submissions_deleted_at;
--   alter table public.submissions drop column if exists deleted_by;
--   alter table public.submissions drop column if exists deleted_at;

alter table public.submissions
  add column if not exists deleted_at timestamp with time zone;

alter table public.submissions
  add column if not exists deleted_by uuid references public.users(id) on delete set null;

create index if not exists idx_submissions_deleted_at
  on public.submissions using btree (deleted_at);

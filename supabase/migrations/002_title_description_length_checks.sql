-- 002_title_description_length_checks
--
-- What: title <= 100 chars and description <= 1000 chars on classes and submissions.
-- Why:  prod already has these CHECK constraints; staging didn't. This brings
--       staging in line. The submit form enforces the same limits (maxLength).
-- Prod: constraints already exist with these names, so this file is a no-op there.
-- Rollback:
--   alter table public.classes     drop constraint if exists classes_title_check;
--   alter table public.classes     drop constraint if exists classes_description_check;
--   alter table public.submissions drop constraint if exists submissions_title_check;
--   alter table public.submissions drop constraint if exists submissions_description_check;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'classes_title_check' and conrelid = 'public.classes'::regclass) then
    alter table public.classes add constraint classes_title_check check (char_length(title) <= 100);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'classes_description_check' and conrelid = 'public.classes'::regclass) then
    alter table public.classes add constraint classes_description_check check (char_length(description) <= 1000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'submissions_title_check' and conrelid = 'public.submissions'::regclass) then
    alter table public.submissions add constraint submissions_title_check check (char_length(title) <= 100);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'submissions_description_check' and conrelid = 'public.submissions'::regclass) then
    alter table public.submissions add constraint submissions_description_check check (char_length(description) <= 1000);
  end if;
end $$;

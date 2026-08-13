-- Migration 032: System "Unknown" project
--
-- The Assets page requires a permanent, always-first project that holds assets
-- with no assigned destination. It must not be deletable or renameable by a
-- user, so it is marked with a flag rather than identified by a magic
-- project_code that anyone could edit.
--
-- Depends on: 028, 029, 030, 031.

begin;

alter table public.projects
  add column if not exists is_system boolean not null default false;

-- Exactly one system project may exist.
create unique index if not exists projects_single_system_idx
  on public.projects ((true)) where is_system;

-- Seed it. Idempotent.
insert into public.projects (title, project_code, description, status, is_system)
select 'Unknown', 'UNKNOWN',
       'Assets with no assigned destination. Created and maintained by Production OS.',
       'Active', true
where not exists (select 1 from public.projects where is_system);

-- ---------------------------------------------------------------------------
-- Protect it
-- ---------------------------------------------------------------------------
-- RLS on projects is the blanket active-user policy from 022, so without this
-- any user could delete the Unknown project and orphan every unassigned asset.

create or replace function public.protect_system_project()
returns trigger as $$
begin
  if tg_op = 'DELETE' then
    if old.is_system then
      raise exception 'The Unknown project is required by Production OS and cannot be deleted.';
    end if;
    return old;
  end if;

  -- UPDATE: the flag itself is immutable in both directions.
  if old.is_system is distinct from new.is_system then
    raise exception 'The system project flag cannot be changed.';
  end if;

  -- Identity of the system project is fixed; other fields stay editable.
  if old.is_system then
    new.title := old.title;
    new.project_code := old.project_code;
    new.status := 'Active';
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists projects_protect_system on public.projects;
create trigger projects_protect_system
  before update or delete on public.projects
  for each row execute function public.protect_system_project();

commit;

-- ---------------------------------------------------------------------------
-- Verification (run manually)
-- ---------------------------------------------------------------------------
-- select id, title, project_code, is_system from public.projects where is_system;
--   -- expect exactly one row, titled 'Unknown'
--
-- delete from public.projects where is_system;   -- must FAIL with the raise
-- update public.projects set is_system = false where is_system;  -- must FAIL

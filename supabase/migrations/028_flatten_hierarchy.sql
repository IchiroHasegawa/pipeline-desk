-- Migration 028: Flatten hierarchy to Project -> Episode -> Scene
--
-- Removes production_environments from the active data path.
-- The environment tables and columns are NOT dropped here — they are left in
-- place as a rollback window. A later migration (030) drops them once the
-- application no longer reads them.
--
-- RUN 029 IN THE SAME DEPLOY. 028 alone leaves days/custom tasks unbuilt.

begin;

-- ---------------------------------------------------------------------------
-- 1. episodes.project_id
-- ---------------------------------------------------------------------------

alter table public.episodes
  add column if not exists project_id uuid references public.projects(id) on delete cascade;

update public.episodes e
set project_id = pe.project_id
from public.production_environments pe
where e.environment_id = pe.id
  and e.project_id is null;

-- Fail loudly rather than silently creating orphans.
do $$
declare
  v_orphans integer;
begin
  select count(*) into v_orphans from public.episodes where project_id is null;
  if v_orphans > 0 then
    raise exception
      'Cannot flatten hierarchy: % episode(s) have no resolvable project_id. Inspect these rows before re-running.',
      v_orphans;
  end if;
end $$;

alter table public.episodes alter column project_id set not null;

-- environment_id becomes optional so new episodes can be created without one.
alter table public.episodes alter column environment_id drop not null;

create index if not exists episodes_project_id_sort_order_idx
  on public.episodes (project_id, sort_order, episode_name);

-- ---------------------------------------------------------------------------
-- 2. Projects gain a start date
-- ---------------------------------------------------------------------------
-- start_date drives timeline line length. end_date is optional: an active
-- project has no end, and the Project page clamps length regardless.

alter table public.projects
  add column if not exists start_date date,
  add column if not exists end_date date;

-- Backfill from the earliest episode so existing projects render on the timeline.
update public.projects p
set start_date = sub.min_start
from (
  select project_id, min(start_date) as min_start
  from public.episodes
  where start_date is not null
  group by project_id
) sub
where p.id = sub.project_id
  and p.start_date is null;

-- ---------------------------------------------------------------------------
-- 3. Migrate asset links off environments
-- ---------------------------------------------------------------------------

insert into public.asset_project_links (asset_id, project_id)
select distinct ael.asset_id, pe.project_id
from public.asset_environment_links ael
join public.production_environments pe on pe.id = ael.environment_id
on conflict on constraint asset_project_links_unique do nothing;

delete from public.asset_environment_links;

-- ---------------------------------------------------------------------------
-- 4. Migrate asset_assignments off environments
-- ---------------------------------------------------------------------------
-- asset_assignments has a CHECK requiring exactly one target column to be set.
-- Rewrite environment-targeted rows as project-targeted, then narrow the CHECK.

insert into public.asset_assignments (asset_id, project_id)
select distinct aa.asset_id, pe.project_id
from public.asset_assignments aa
join public.production_environments pe on pe.id = aa.environment_id
where aa.environment_id is not null;

delete from public.asset_assignments where environment_id is not null;

alter table public.asset_assignments drop constraint if exists one_assignment_target;

alter table public.asset_assignments add constraint one_assignment_target check (
  (project_id is not null and episode_id is null     and scene_id is null) or
  (project_id is null     and episode_id is not null and scene_id is null) or
  (project_id is null     and episode_id is null     and scene_id is not null)
);

-- ---------------------------------------------------------------------------
-- 5. Delete environment-level production tasks
-- ---------------------------------------------------------------------------
-- Migration 026 already removed 'environment' from workflows.workflow_type, so
-- no new environment tasks can be generated. These rows are unreachable.

delete from public.production_tasks where environment_id is not null;

commit;

-- ---------------------------------------------------------------------------
-- Verification (run manually, not part of the transaction)
-- ---------------------------------------------------------------------------
-- select count(*) from public.episodes where project_id is null;          -- expect 0
-- select count(*) from public.production_tasks where environment_id is not null; -- expect 0
-- select count(*) from public.asset_environment_links;                    -- expect 0
-- select count(*) from public.projects where start_date is null;          -- informational

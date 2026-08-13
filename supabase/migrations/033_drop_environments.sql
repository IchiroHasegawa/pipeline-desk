-- Migration 033: Drop the environment layer
--
-- ============================================================================
-- THIS MIGRATION IS DESTRUCTIVE AND IRREVERSIBLE.
--
-- Run it ONLY after:
--   1. All legacy code referencing environments has been deleted and the app
--      builds and runs without it (step 11a).
--   2. A fresh pg_dump has been taken and stored off-machine.
--
-- Migration 028 emptied these structures and stopped writing to them. This
-- removes them. If anything still reads them, it will break at query time,
-- not at migration time — which is why 11a comes first.
-- ============================================================================
--
-- Depends on: 028 through 032.

begin;

-- ---------------------------------------------------------------------------
-- 0. Refuse to run if the flattening never completed
-- ---------------------------------------------------------------------------

do $$
declare
  v_orphans integer;
begin
  select count(*) into v_orphans from public.episodes where project_id is null;
  if v_orphans > 0 then
    raise exception
      'Aborting: % episode(s) still have a null project_id. Migration 028 did not complete.',
      v_orphans;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 1. Drop dependents first (they hold FKs into production_environments)
-- ---------------------------------------------------------------------------

drop table if exists public.asset_environment_links;

alter table public.asset_assignments
  drop column if exists environment_id;

alter table public.production_tasks
  drop column if exists environment_id;

alter table public.episodes
  drop column if exists environment_id;

-- ---------------------------------------------------------------------------
-- 2. Drop the table
-- ---------------------------------------------------------------------------

drop table if exists public.production_environments;

-- ---------------------------------------------------------------------------
-- 3. Tidy indexes left behind by the old shape
-- ---------------------------------------------------------------------------

drop index if exists public.episodes_environment_id_sort_order_idx;

-- ---------------------------------------------------------------------------
-- 4. Rebuild the task uniqueness index without environment_id
-- ---------------------------------------------------------------------------
-- 029 created this as a partial unique index over
-- (episode_id, scene_id, day_id, source_workflow_process_id). Dropping the
-- environment_id column does not affect it, but recreate defensively in case
-- an earlier constraint-shaped version is still present.

drop index if exists public.uq_production_task_process;
alter table public.production_tasks
  drop constraint if exists uq_production_task_process;

create unique index uq_production_task_process
  on public.production_tasks (episode_id, scene_id, day_id, source_workflow_process_id)
  nulls not distinct
  where source_workflow_process_id is not null;

commit;

-- ---------------------------------------------------------------------------
-- Verification (run manually)
-- ---------------------------------------------------------------------------
-- select
--   (select count(*) from information_schema.tables
--     where table_schema='public'
--       and table_name in ('production_environments','asset_environment_links'))
--     as dead_tables,
--   (select count(*) from information_schema.columns
--     where table_schema='public' and column_name='environment_id')
--     as dead_columns,
--   (select count(*) from public.episodes where project_id is null)
--     as orphan_episodes,
--   (select indexdef ilike '%where%source_workflow_process_id is not null%'
--      from pg_indexes where indexname='uq_production_task_process')
--     as index_still_partial;
--
-- expect: dead_tables=0, dead_columns=0, orphan_episodes=0, index_still_partial=true

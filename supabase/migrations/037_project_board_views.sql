-- Migration 037: Project board aggregation views.
--
-- One row per project per metric, so the Project board issues three queries
-- total rather than three per visible panel.
--
-- security_invoker = true on all three. Without it a view runs with the
-- creator's privileges and silently bypasses the RLS from migration 022,
-- letting any active user read aggregates across every project.
-- Requires Postgres 15+.
--
-- Depends on: 028 through 036.

begin;

-- ---------------------------------------------------------------------------
-- 1. project_commit_days — GitHub-style contribution data
-- ---------------------------------------------------------------------------
-- A commit is a todos row with completed_at set (030). todos scope to episode
-- OR scene, never to a project, so both paths resolve upward.
-- Bucketed in Asia/Kolkata: `at time zone` converts to IST wall-clock before
-- the date cast, so an early-morning IST commit lands on the right day.
-- Project-wide, not per-user — todos' read policy is already workspace-wide.

create or replace view public.project_commit_days
with (security_invoker = true) as
with scoped as (
  select
    t.completed_at,
    coalesce(e_direct.project_id, e_via_scene.project_id) as project_id
  from public.todos t
  left join public.episodes e_direct   on e_direct.id = t.episode_id
  left join public.scenes   s          on s.id = t.scene_id
  left join public.episodes e_via_scene on e_via_scene.id = s.episode_id
  where t.completed_at is not null
)
select
  project_id,
  (completed_at at time zone 'Asia/Kolkata')::date as commit_day,
  count(*)::integer as commit_count
from scoped
where project_id is not null
group by project_id, 2;

-- ---------------------------------------------------------------------------
-- 2. project_episode_status — episode counts by derived progress
-- ---------------------------------------------------------------------------
-- Completion comes from workflow_task_statuses.completion_percentage = 100,
-- not from production_tasks.progress: the status column lost its CHECK in 023
-- and progress is not authoritative.
-- day_id IS NULL restricts to Main Tasks, excluding Custom Tasks (029).
-- An episode with no tasks counts as Not Started.

create or replace view public.project_episode_status
with (security_invoker = true) as
with episode_tasks as (
  select
    e.id         as episode_id,
    e.project_id,
    count(pt.id) as total_tasks,
    count(pt.id) filter (where wts.completion_percentage = 100) as complete_tasks
  from public.episodes e
  left join public.scenes s on s.episode_id = e.id
  left join public.production_tasks pt
    on pt.scene_id = s.id and pt.day_id is null
  left join public.workflow_task_statuses wts
    on wts.id = pt.task_status_definition_id
  group by e.id, e.project_id
)
select
  project_id,
  count(*) filter (where total_tasks = 0 or complete_tasks = 0)::integer as not_started,
  count(*) filter (where total_tasks > 0
                     and complete_tasks > 0
                     and complete_tasks < total_tasks)::integer as in_progress,
  count(*) filter (where total_tasks > 0
                     and complete_tasks = total_tasks)::integer as complete,
  count(*)::integer as total_episodes
from episode_tasks
group by project_id;

-- ---------------------------------------------------------------------------
-- 3. project_asset_stats — asset and file counts, total size
-- ---------------------------------------------------------------------------
-- Assets attach through three link tables (014). An asset linked only to a
-- scene has no asset_project_links row, so all three paths resolve upward and
-- UNION dedupes assets reachable by more than one.
-- The size column is file_size_bytes, not size_bytes.
-- Only Active files count — retired and trashed rows persist in the table.

create or replace view public.project_asset_stats
with (security_invoker = true) as
with asset_projects as (
  select l.asset_id, l.project_id
  from public.asset_project_links l
  union
  select jl.asset_id, e.project_id
  from public.asset_job_links jl
  join public.episodes e on e.id = jl.episode_id
  union
  select sl.asset_id, e.project_id
  from public.asset_scene_links sl
  join public.scenes   s on s.id = sl.scene_id
  join public.episodes e on e.id = s.episode_id
)
select
  ap.project_id,
  count(distinct ap.asset_id)::integer          as asset_count,
  count(af.id)::integer                         as file_count,
  coalesce(sum(af.file_size_bytes), 0)::bigint  as total_bytes
from asset_projects ap
left join public.asset_files af
  on af.asset_id = ap.asset_id
 and af.record_status = 'Active'
group by ap.project_id;

-- Re-assert in case a CREATE OR REPLACE against a pre-existing view dropped
-- the option. Harmless when it is already set.
alter view public.project_commit_days    set (security_invoker = true);
alter view public.project_episode_status set (security_invoker = true);
alter view public.project_asset_stats    set (security_invoker = true);

commit;

-- ---------------------------------------------------------------------------
-- VERIFICATION (run manually, one statement at a time)
-- ---------------------------------------------------------------------------
-- Each row's reloptions must contain security_invoker=true.
-- NOTE: pg_views.definition does NOT contain it — view options live in
-- pg_class.reloptions, so check there.
--
-- select c.relname, c.reloptions
--   from pg_class c join pg_namespace n on n.oid = c.relnamespace
--  where n.nspname = 'public'
--    and c.relname in ('project_commit_days','project_episode_status','project_asset_stats');
--
-- select * from public.project_episode_status;
-- select * from public.project_asset_stats;
-- select record_status, count(*) from public.asset_files group by record_status;
-- Migration 029: Days and Custom Tasks
--
-- Adds the Day entity (a dated container of work under an Episode) and the
-- custom-task relations that the Scene page's line geometry depends on.
--
-- Also replaces the uniqueness guard on production_tasks. The constraint added
-- in 027 used NULLS NOT DISTINCT across all four key columns, which would make
-- two custom tasks on the same Day collide (both have a null
-- source_workflow_process_id) and be silently discarded by the RPC's
-- ON CONFLICT DO NOTHING. A partial index guards only generated tasks.
--
-- RUN IMMEDIATELY AFTER 028.

begin;

-- ---------------------------------------------------------------------------
-- 1. days
-- ---------------------------------------------------------------------------
-- Days have no workflow column by design: creating a Day never generates
-- Main Tasks. Main Tasks come from Episode and Scene workflows only.

create table if not exists public.days (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes(id) on delete cascade,
  day_date date not null,
  title text,
  description text,
  sort_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Deliberately NOT unique on (episode_id, day_date): a shoot day can be split
-- into multiple tracked blocks. sort_order disambiguates ordering.
create index if not exists days_episode_id_date_idx
  on public.days (episode_id, day_date, sort_order);

-- ---------------------------------------------------------------------------
-- 2. Custom task columns on production_tasks
-- ---------------------------------------------------------------------------
-- day_id is not null  <=>  this is a custom task. No separate is_custom flag:
-- two sources of truth for one fact will drift.
--
-- contributes_to_task_id -> the Main Task whose progress this rolls up into.
--   cascade: deleting the Main Task removes its breakdown.
-- branches_from_task_id  -> the sibling whose endpoint this line grows from.
--   set null: deleting a sibling reattaches the line to the Day line.

alter table public.production_tasks
  add column if not exists day_id uuid
    references public.days(id) on delete cascade,
  add column if not exists contributes_to_task_id uuid
    references public.production_tasks(id) on delete cascade,
  add column if not exists branches_from_task_id uuid
    references public.production_tasks(id) on delete set null;

create index if not exists production_tasks_day_id_idx
  on public.production_tasks (day_id, sort_order);

create index if not exists production_tasks_contributes_to_idx
  on public.production_tasks (contributes_to_task_id);

-- A task cannot branch from or roll up into itself.
alter table public.production_tasks
  drop constraint if exists production_tasks_no_self_reference;

alter table public.production_tasks
  add constraint production_tasks_no_self_reference check (
    (contributes_to_task_id is null or contributes_to_task_id <> id) and
    (branches_from_task_id  is null or branches_from_task_id  <> id)
  );

-- ---------------------------------------------------------------------------
-- 3. Replace the uniqueness guard
-- ---------------------------------------------------------------------------

alter table public.production_tasks
  drop constraint if exists uq_production_task_process;

drop index if exists public.uq_production_task_process;

create unique index uq_production_task_process
  on public.production_tasks (episode_id, scene_id, day_id, source_workflow_process_id)
  nulls not distinct
  where source_workflow_process_id is not null;

-- ---------------------------------------------------------------------------
-- 4. Rewrite generate_workflow_tasks
-- ---------------------------------------------------------------------------
-- Changes from 027:
--   * 'environment' branch removed (026 already banned that workflow_type)
--   * ON CONFLICT ON CONSTRAINT -> ON CONFLICT (cols) WHERE ...
--     A partial unique index cannot be referenced by constraint name; the
--     conflict target must restate the index predicate.

create or replace function public.generate_workflow_tasks(
  p_entity_type text,
  p_entity_id uuid,
  p_workflow_id uuid
) returns void as $$
declare
  v_process record;
  v_default_status_name text;
  v_workflow_type text;
begin
  if not public.is_active_user() then
    raise exception 'Not authorized';
  end if;

  if p_entity_type not in ('job', 'scene', 'asset') then
    raise exception 'Unsupported entity type: %', p_entity_type;
  end if;

  select workflow_type into v_workflow_type
  from public.workflows
  where id = p_workflow_id
    and status = 'active';

  if v_workflow_type is null then
    raise exception 'The selected Workflow is not valid or active.';
  end if;

  if v_workflow_type <> p_entity_type then
    raise exception 'The selected Workflow is not valid for this item.';
  end if;

  for v_process in
    select wp.*, wts.name as default_status_name
    from public.workflow_processes wp
    left join public.workflow_task_statuses wts
      on wp.default_task_status_id = wts.id
    where wp.workflow_id = p_workflow_id
      and wp.status = 'active'
    order by wp.position asc
  loop
    v_default_status_name := coalesce(v_process.default_status_name, 'Standby');

    if p_entity_type = 'asset' then
      insert into public.asset_tasks (
        asset_id, name, progress, status, sort_order,
        source_workflow_id, source_workflow_process_id,
        task_status_workflow_id, task_status_definition_id,
        assignee_group_id, duration_days, effort_hours,
        take_retake_mode, take_retake_count
      ) values (
        p_entity_id, v_process.name, v_process.default_completion,
        v_default_status_name, v_process.position,
        p_workflow_id, v_process.id,
        v_process.task_status_workflow_id, v_process.default_task_status_id,
        v_process.assignee_group_id, v_process.duration_days, v_process.effort_hours,
        v_process.take_retake_mode, v_process.take_retake_count
      )
      on conflict on constraint uq_asset_task_process do nothing;
    else
      insert into public.production_tasks (
        episode_id, scene_id,
        name, progress, status, sort_order,
        source_workflow_id, source_workflow_process_id,
        task_status_workflow_id, task_status_definition_id,
        assignee_group_id, duration_days, effort_hours,
        take_retake_mode, take_retake_count
      ) values (
        case when p_entity_type = 'job'   then p_entity_id else null end,
        case when p_entity_type = 'scene' then p_entity_id else null end,
        v_process.name, v_process.default_completion,
        v_default_status_name, v_process.position,
        p_workflow_id, v_process.id,
        v_process.task_status_workflow_id, v_process.default_task_status_id,
        v_process.assignee_group_id, v_process.duration_days, v_process.effort_hours,
        v_process.take_retake_mode, v_process.take_retake_count
      )
      on conflict (episode_id, scene_id, day_id, source_workflow_process_id)
        where source_workflow_process_id is not null
        do nothing;
    end if;
  end loop;
end;
$$ language plpgsql security definer set search_path = public;

revoke execute on function public.generate_workflow_tasks(text, uuid, uuid) from public;
revoke execute on function public.generate_workflow_tasks(text, uuid, uuid) from anon;
grant execute on function public.generate_workflow_tasks(text, uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. RLS
-- ---------------------------------------------------------------------------
-- Matches the pattern established in 022 for every shared production table.

alter table public.days enable row level security;

drop policy if exists "Active users can manage days" on public.days;

create policy "Active users can manage days" on public.days
  for all to authenticated
  using (public.is_active_user())
  with check (public.is_active_user());

revoke all on public.days from anon;

commit;

-- ---------------------------------------------------------------------------
-- Verification (run manually)
-- ---------------------------------------------------------------------------
-- Confirm the partial index exists and is partial:
--   select indexdef from pg_indexes
--   where indexname = 'uq_production_task_process';
--
-- Confirm two custom tasks can coexist on one Day (this must NOT error):
--   insert into public.days (episode_id, day_date)
--     values ('<episode uuid>', current_date) returning id;
--   insert into public.production_tasks (day_id, name)
--     values ('<day uuid>', 'A'), ('<day uuid>', 'B');
--   -- then clean up

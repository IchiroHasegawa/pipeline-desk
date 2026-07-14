-- Migration 023: Workflows and Task Generation

create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  workflow_code text not null,
  workflow_type text not null check (workflow_type in ('environment', 'job', 'scene', 'asset', 'task_status')),
  colour text not null,
  description text,
  status text not null default 'active',
  sort_order integer default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workflow_task_statuses (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  name text not null,
  status_code text,
  colour text not null,
  position integer not null default 0,
  completion_percentage integer not null default 0 check (completion_percentage between 0 and 100),
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workflow_processes (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  name text not null,
  process_type text not null check (process_type in ('Manual', 'Approval', 'Asset Progress')),
  colour text not null,
  position integer not null default 0,
  task_status_workflow_id uuid references public.workflows(id),
  default_task_status_id uuid references public.workflow_task_statuses(id),
  assignee_group_id uuid,
  default_completion integer default 0 check (default_completion between 0 and 100),
  duration_days numeric default 0 check (duration_days >= 0),
  effort_hours numeric default 0 check (effort_hours >= 0),
  take_retake_mode text not null default 'Take' check (take_retake_mode in ('Take', 'Retake')),
  take_retake_count integer not null default 1 check (take_retake_count > 0),
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Update production_tasks
alter table public.production_tasks
  alter column scene_id drop not null,
  add column if not exists environment_id uuid references public.production_environments(id) on delete cascade,
  add column if not exists episode_id uuid references public.episodes(id) on delete cascade,
  add column if not exists source_workflow_id uuid references public.workflows(id) on delete set null,
  add column if not exists source_workflow_process_id uuid references public.workflow_processes(id) on delete set null,
  add column if not exists task_status_workflow_id uuid references public.workflows(id) on delete set null,
  add column if not exists task_status_definition_id uuid references public.workflow_task_statuses(id) on delete set null,
  add column if not exists assignee_group_id uuid,
  add column if not exists duration_days numeric default 0,
  add column if not exists effort_hours numeric default 0,
  add column if not exists take_retake_mode text default 'Take',
  add column if not exists take_retake_count integer default 1,
  drop constraint if exists production_tasks_status_check;

-- Create asset_tasks
create table if not exists public.asset_tasks (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  name text not null,
  progress integer not null default 0 check (progress between 0 and 100),
  status text not null default 'Unassigned',
  assignee text,
  start_date date,
  end_date date,
  sort_order integer,
  source_workflow_id uuid references public.workflows(id) on delete set null,
  source_workflow_process_id uuid references public.workflow_processes(id) on delete set null,
  task_status_workflow_id uuid references public.workflows(id) on delete set null,
  task_status_definition_id uuid references public.workflow_task_statuses(id) on delete set null,
  assignee_group_id uuid,
  duration_days numeric default 0,
  effort_hours numeric default 0,
  take_retake_mode text default 'Take',
  take_retake_count integer default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists asset_tasks_asset_id_sort_order_idx
  on public.asset_tasks (asset_id, sort_order, name);

-- RLS Enablement
alter table public.workflows enable row level security;
alter table public.workflow_task_statuses enable row level security;
alter table public.workflow_processes enable row level security;
alter table public.asset_tasks enable row level security;

-- Policies
CREATE POLICY "Active users can manage workflows" ON public.workflows
  FOR ALL TO authenticated
  USING (public.is_active_user())
  WITH CHECK (public.is_active_user());

CREATE POLICY "Active users can manage workflow_task_statuses" ON public.workflow_task_statuses
  FOR ALL TO authenticated
  USING (public.is_active_user())
  WITH CHECK (public.is_active_user());

CREATE POLICY "Active users can manage workflow_processes" ON public.workflow_processes
  FOR ALL TO authenticated
  USING (public.is_active_user())
  WITH CHECK (public.is_active_user());

CREATE POLICY "Active users can manage asset_tasks" ON public.asset_tasks
  FOR ALL TO authenticated
  USING (public.is_active_user())
  WITH CHECK (public.is_active_user());

REVOKE ALL ON public.workflows FROM anon;
REVOKE ALL ON public.workflow_task_statuses FROM anon;
REVOKE ALL ON public.workflow_processes FROM anon;
REVOKE ALL ON public.asset_tasks FROM anon;

-- Database Function: generate_workflow_tasks
-- Transactionally generates tasks for an entity from a given workflow.
CREATE OR REPLACE FUNCTION public.generate_workflow_tasks(
  p_entity_type text,
  p_entity_id uuid,
  p_workflow_id uuid
) RETURNS void AS $$
DECLARE
  v_process record;
  v_default_status_name text;
BEGIN
  -- Validate user
  IF NOT public.is_active_user() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  FOR v_process IN
    SELECT wp.*,
           wts.name as default_status_name
    FROM public.workflow_processes wp
    LEFT JOIN public.workflow_task_statuses wts ON wp.default_task_status_id = wts.id
    WHERE wp.workflow_id = p_workflow_id
      AND wp.status = 'active'
    ORDER BY wp.position ASC
  LOOP
    v_default_status_name := COALESCE(v_process.default_status_name, 'Standby');

    IF p_entity_type = 'asset' THEN
      INSERT INTO public.asset_tasks (
        asset_id, name, progress, status, sort_order,
        source_workflow_id, source_workflow_process_id,
        task_status_workflow_id, task_status_definition_id,
        assignee_group_id, duration_days, effort_hours,
        take_retake_mode, take_retake_count
      ) VALUES (
        p_entity_id, v_process.name, v_process.default_completion, v_default_status_name, v_process.position,
        p_workflow_id, v_process.id,
        v_process.task_status_workflow_id, v_process.default_task_status_id,
        v_process.assignee_group_id, v_process.duration_days, v_process.effort_hours,
        v_process.take_retake_mode, v_process.take_retake_count
      );
    ELSE
      INSERT INTO public.production_tasks (
        environment_id, episode_id, scene_id,
        name, progress, status, sort_order,
        source_workflow_id, source_workflow_process_id,
        task_status_workflow_id, task_status_definition_id,
        assignee_group_id, duration_days, effort_hours,
        take_retake_mode, take_retake_count
      ) VALUES (
        CASE WHEN p_entity_type = 'environment' THEN p_entity_id ELSE NULL END,
        CASE WHEN p_entity_type = 'job' THEN p_entity_id ELSE NULL END,
        CASE WHEN p_entity_type = 'scene' THEN p_entity_id ELSE NULL END,
        v_process.name, v_process.default_completion, v_default_status_name, v_process.position,
        p_workflow_id, v_process.id,
        v_process.task_status_workflow_id, v_process.default_task_status_id,
        v_process.assignee_group_id, v_process.duration_days, v_process.effort_hours,
        v_process.take_retake_mode, v_process.take_retake_count
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION public.generate_workflow_tasks(text, uuid, uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.generate_workflow_tasks(text, uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.generate_workflow_tasks(text, uuid, uuid) TO authenticated;
